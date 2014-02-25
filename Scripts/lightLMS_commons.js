// define scope methods -------------------------------------------------------------------------------
var spyreqs = spyreqs || {},
	say = spyreqs.utils.say,
	urlParamsObj = spyreqs.utils.urlParamsObj;

// common app properties ------------------------------------------------------------------------------
var app_Name = "lightLMS",
	app_MainListName = "lightLMS_tasks",
	app_Div = "#lightLMS_div",
	app_CustomAction_RegisterFolder = "lightLMS_RegisterFolder",
	app_KeepListWithin = false;
	
// common vars ----------------------------------------------------------------------------------------
var clientContext = null, theWeb = null, theList = null,
	hostUrl, appUrl, queryParams, action,
	isSPClientContextReady = false,	
	statusId = '', notifyId = '';

// common functions -----------------------------------------------------------------------------------
function initApp () {
	// it gets here on DOM ready
		
	if (typeof GetUrlKeyValue == 'function') {
		hostUrl = GetUrlKeyValue("SPHostUrl");
		appUrl = GetUrlKeyValue("SPAppWebUrl");
		action = GetUrlKeyValue("action");
	} else {
		queryParams = urlParamsObj();
	    hostUrl = decodeURIComponent(queryParams.SPHostUrl);
	    appUrl = decodeURIComponent(queryParams.SPAppWebUrl);
		action = queryParams.action;
	}
	if (appUrl.indexOf('#') !== -1) { appUrl = appUrl.split('#')[0]; }
	
	checkHostListExistsOrCreate(
		app_MainListName, 
		buildAppList,
		function() { 
			say("app list is created or ready");
			if (action.length > 0) {
				// we have an action. queryParams is undefined if GetUrlKeyValue was found. 
				// but now we need it, so...
				if (queryParams === undefined) { queryParams = urlParamsObj(); }
				// now we have all the params, do jobs!
				if (action === "rf_ispr"){
					// Register File iSpring (rf_ispr)
					registerIspring();
				}
				else if (action === "sd_ispr"){
					// Save Data from iSpring quiz (sd_ispr)
					saveIspring();
				}
				else if (action === "st"){
					// Show Tasks (st)					
				}
				else if (action === "at"){
					// Assign Tasks (at)					
				}				
			}
		}, 
		function() { alert ("something went wrong creating list: " + app_MainListName ); }		
	); 
	/*
	checkCustomActionExistsOrCreate(
		app_CustomAction_RegisterFolder,
		addCA_RegisterFolder,
		function() { 
			alert ("success adding custom action: " + app_CustomAction_RegisterFolder );
		}, 
		function() { alert ("adding custom action failed: " + app_CustomAction_RegisterFolder ); }			
	);
	*/
}

// ----------------------------------- Init ends ----------------------------------------------------------- 
// ---------------------------------------------------------------------------------------------------------

function registerIspring() {
	var oldUrlStr, newUrlStr, requestWatchIspringCode, defineRedirectUrlCode, fullCodeString;
	/* requestWatchIspringCode: this is the js code to attach to the aspx file we will create for iSpring test to run
	 * This code stops XMLHttpRequests from sending quiz results to a server, 
	 * and instead it redirects to this app url with all data from iSpring into the queryString 
	 * SOS we need to add a string definition for our app's Url, 
	 * but requestWatchIspringCode is a standard string, so we use two code strings
	 */
	requestWatchIspringCode = "XMLHttpRequest.prototype.oldSend=XMLHttpRequest.prototype.send;var newSend=function(postBody){var xhr=this;h_log('intercepted SEND: '+postBody);var onload=function(){h_log('intercepted repsonse: '+xhr.status+' - '+xhr.responseText);};var onerror=function(){h_log('intercepted response error: '+xhr.status);}; xhr.addEventListener('load',onload,false); xhr.addEventListener('error',onerror,false);postBody=buildQueryString(postBody,'rt','-'); postBody=buildQueryString(postBody,'dr','-'); h_log(postBody);window.open(redirectUrl +'&'+postBody,'_blank');};XMLHttpRequest.prototype.send=newSend; function buildQueryString(str,param,val){var ind=-1,attached='';var param_array=str.substring(ind+1).split('&');var params={};var theLength=param_array.length;for(var i=0;i<theLength;i++){var x=param_array[i].toString().split('=');params[x[0]]=x[1];} params[param]=val;for(var key in params){attached+=key+'='+params[key]+'&';}attached=attached.substr(0,attached.length-1);return String(str.substr(0,ind)+attached);} function h_log(what){console.log(what);}";
	/* now we built the url to be redirected when user finishes the quiz
	*  The code in requestWatchIspringCode will redirect the iSpring quiz to this url
	*/
	// get current url without params
	oldUrlStr = window.location.href.split('?')[0]; 
	// the action will be to save quiz data returning from iSpring test
	newUrlStr = buildUrlParamsString(oldLocation, "action", "sd_ispr");
	// add next two params from the current urlParams object
	newUrlStr = buildUrlParamsString(newUrlStr, "SPHostUrl", queryParams.SPHostUrl);
	newUrlStr = buildUrlParamsString(newUrlStr, "SPAppWebUrl", queryParams.SPAppWebUrl);
	defineRedirectUrlCode = "var redirectUrl='" + newUrlStr +"';";
	// concat the two strings into one
	fullCodeString = defineRedirectUrlCode + requestWatchIspringCode;
		
	$.when(getBinaryDataFile (queryParams.relativeFileUrl)).then(
		function (data) {
			// we have the index.html in binary in data
			say ("we got BinaryDataFile! ");
			var fileBody;
			fileBody = data.substring(0,data.lastIndexOf("</script>"));
			fileBody += "</script><script>" +
						fullCodeString +
						"</script></body></html>";
			say ("new fileBody: " + fileBody);
			burnNewFile(fileBody, relativeFileUrl);			
		},
		function (error) {
			say("error getting BinaryDataFile " + err);							
		} 
	);	
}

function getBinaryDataFile (relativeFileUrl) {
	// code to get the file binary data with rest 
	// study: http://techmikael.blogspot.gr/2013/07/how-to-copy-files-between-sites-using.html
	
	var defer = new $.Deferred(),
		executor = new SP.RequestExecutor(appUrl),	
		restReqUrl = "_api/SP.AppContextSite(@target)/web/GetFileByServerRelativeUrl('" + 
						relativeFileUrl + "')/$value?@target='" + hostUrl + "'",			
		info = {
		    url: restReqUrl,
		    method: "GET",
		    binaryStringResponseBody: true,
		    success: function (data) {
		        //binary data available in data.body
		        defer.resolve(data.body);
		    },
		    error: function (err) {
		        defer.reject(JSON.stringify(err));
		    }
		};
		
	executor.executeAsync(info);	
	return defer.promise();	
}

function saveIspring() {
	/* iSpring data:
		v	QuizMaker version
		dr	Detailed results in .xml format complying with the schema below
		sp	Earned points
		ps	Passing score
		psp	Passing score in percent, that is how much of a total score in percent a user must gain to pass a quiz
		tp	Gained score
		sn	Quiztaker's username
		se	Quiztaker's email address
		qt	Quiz title
	*/
	say("data to save: " + queryParams.qt + " " + userId + " " + userName + "score:" + queryParams.tp);
	spyreqs.jsom.addHostListItem(app_MainListName, {
			"Title":queryParams.qt, 
			"testId":queryParams.qt, 
			"userId":userId,
			"userName":userName,
			"score":queryParams.tp,
			"extraField_1":"QuizMaker version: " + queryParams.v			
		}).then(
        function(itemId) { say("item was added, id:"+itemId); },
        function(error) { alert('Sorry, save data request failed. \n' +  error.args.get_message() + '\n' + error.args.get_stackTrace() ); }
    );
}

function checkHostListExistsOrCreate (listName, createFn, okFn, errFn){
	var listObj = { "Title":listName };
			
	spyreqs.jsom.checkHostList(listObj).then(
		function(listExistsBool) 
		{
			if (listExistsBool) { okFn(); }
			else {
				say ("creating list: " + listName);
				createFn(okFn, errFn);
			}					
		},
		function(error)
		{
			alert('checkHostList request failed. ' + error.args.get_message() + '\n' + error.args.get_stackTrace() );
		}
	);		
}

function buildAppList(okFn, errFn){	
	spyreqs.jsom.createHostList({
		"title":app_MainListName,	 
		"url":app_MainListName, 
		"template" : "genericList",
		"description" : "this is a list", 
			fields : [	 
				{"Name":"testId", "Type":"Text", "Required":"True"},	
				{"Name":"userId", "Type":"Text", "Required":"Τrue"},				 
				{"Name":"userName", "Type":"Text"},				
				{"Name":"courseId", "Type":"Text"},
				{"Name":"periodId", "Type":"Text"},				
				{"Name":"assginedFrom", "Type":"User"},
				{"Name":"assignedTo", "Type":"User"},
				{"Name":"dateAssigned", "Type":"DateTime"},
				{"Name":"dateDue", "Type":"DateTime"},
				{"Name":"dateLastTried", "Type":"DateTime"},
				{"Name":"canRetry", "Type":"Boolean"},
				{"Name":"state", "Type":"Choice", "choices" : ["rejected", "approved", "passed", "proggress"]},
				{"Name":"score", "Type":"Number"},
				{"Name":"passingScore", "Type":"Number"},
				{"Name":"maxScore", "Type":"Number"},
				{"Name":"testLink", "Type":"URL"},
				{"Name":"comments", "Type":"Note"},
				{"Name":"extraField_1", "Type":"Text", "Hidden":"True"},
				{"Name":"extraField_2", "Type":"Text", "Hidden":"True"},
				{"Name":"extraField_3", "Type":"Text", "Hidden":"True"},
				{"Name":"extraField_4", "Type":"Text", "Hidden":"True"},
				{"Name":"extraField_5", "Type":"Text", "Hidden":"True"},
				{"Name":"extraField_6", "Type":"Text", "Hidden":"True"}
			]	 
		})
	.then(                    
		function() { okFn(); },                    
		function(error) { errFn(); } 
	);
}


// ----------------------------------- Generic functions ----------------------------------------------------------- 
function buildUrlParamsString(str, param, val) { 
	// function returns string with str parameters plus the given parameter. works even param already exists in str
    var ind=str.indexOf('?');
    if (ind>-1) {
        var param_array = str.substring(ind+1).split('&');
        var params = {};
        var theLength = param_array.length;
        for (var i = 0; i < theLength; i++) {
            var x = param_array[i].toString().split('=');
            params[x[0]] = x[1];
        } 
        params[param]=val;
        var attached = "?";
        for (var key in params) {
            attached += key + "=" + params[key] + "&";
        } attached = attached.substr(0,attached.length-1);
        return String(str.substr(0,ind) + attached);
    } return String(str+"?"+param+"="+val);    
}

function onQueryFailed_Generic(sender, args) {  
	alert('Sorry, query failed: ' + args.get_message() + '\nstackTrace: ' + args.get_stackTrace());  
} 

// ----------------------------------- Custom Action functions ----------------------------------------------------------- 
function checkCustomActionExistsOrCreate (actionName, createFn, okFn, errFn){
	var actionObj = { "Title":actionName };
			
	spyreqs.jsom.checkHostList(actionObj).then(
		function(listExistsBool) 
		{
			//doSomething with the list Exists Boolean
			if (listExistsBool) { okFn(); }
			else {
				say ("creating list: " + actionName);
				createFn(okFn, errFn);
			}					
		},
		function(error)
		{
			alert('checkHostList request failed. ' + error.args.get_message() + '\n' + error.args.get_stackTrace() );
		}
	);		
}

function addCA_RegisterFolder()
{
	// study: http://www.instantquick.com/index.php/category/elumenotion-blog-archive/sharepoint-2013-and-office-365-apps
	var context; 
    var factory; 
    var appContextSite; 
 
    context = new SP.ClientContext(appweburl); 
    factory = new SP.ProxyWebRequestExecutorFactory(appweburl); 
    context.set_webRequestExecutorFactory(factory); 
    appContextSite = new SP.AppContextSite(context, hostweburl); 
 
	var action = appContextSite.get_web().get_userCustomActions().add();
	action.set_location("ScriptLink");
	action.set_sequence(100);
	action.set_scriptBlock("alert('Running!');");	
	action.update();

	context.executeQueryAsync(function(){alert('worked');},function(){alert('did not work');});

	return false;
}

function removeAction()
{
	var context; 
    var factory; 
    var appContextSite; 
	
	context = new SP.ClientContext(appweburl); 
    factory = new SP.ProxyWebRequestExecutorFactory(appweburl); 
    context.set_webRequestExecutorFactory(factory); 
    appContextSite = new SP.AppContextSite(context, hostweburl);
	
	appContextSite.get_web().get_userCustomActions().clear();	
	context.executeQueryAsync(function(){alert('worked');},function(){alert('did not work');});
	return false;
}

// ----------------------------------- DEMO functions ----------------------------------------------------------- 
function addSampleItem(){	
	spyreqs.jsom.addHostListItem(app_MainListName, {"user_id":733, "test_id":33, "score":90}).then(
		function(itemId) { alert("item was added, id:"+itemId); },
		function(error) { alert('addHostListItem request failed. ' +  error.args.get_message() + '\n' + error.args.get_stackTrace() ); }
	);
}

function getHostLists() {
	var context, factory, appContextSite, collList;
 
    context = new SP.ClientContext(appUrl);
    factory = new SP.ProxyWebRequestExecutorFactory(appUrl);
    context.set_webRequestExecutorFactory(factory);
    appContextSite = new SP.AppContextSite(context, hostUrl);
 
    theWeb = appContextSite.get_web();
    collList = theWeb.get_lists();
    context.load(collList);
 
    context.executeQueryAsync( successHandler , errorHandler);
 
    function successHandler() {
        var listInfo = '';
        var listEnumerator = collList.getEnumerator();
 
        while (listEnumerator.moveNext()) {
            var oList = listEnumerator.get_current();
			var title = oList.get_title();
            listInfo += '<li>' + title + '</li>';
			// uncomment to try to crash-test spyreqs (but spyreqs will deliver!)
			// checkListExists (title); 
        }
 
        document.getElementById("message").innerHTML = 'Lists found:<ul>' + listInfo + '</ul>';
    }
 
    function errorHandler(sender, args) {
        document.getElementById("message").innerText =
            "Could not complete cross-domain call: " + args.get_message();
    }
}