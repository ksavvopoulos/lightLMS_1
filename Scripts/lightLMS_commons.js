// define scope methods -------------------------------------------------------------------------------
var spyreqs = spyreqs || {},
	say = spyreqs.utils.say,
	urlParamsObj = spyreqs.utils.urlParamsObj,
    buildQueryString = spyreqs.utils.buildQueryString;

// common app properties ------------------------------------------------------------------------------
var app_Name = "lightLMS",
    app_Version = "0.0.1",
	app_MainListName = "lightLMS_tasks",	
    $app_Message,
    $app_Div;

// common vars ----------------------------------------------------------------------------------------
var clientContext = null, theWeb = null, theList = null,
	hostUrl, appUrl, queryParams, action,
	isSPClientContextReady = false,	
	statusId = '', notifyId = '';

// common functions -----------------------------------------------------------------------------------
function initApp () {
    // it gets here on DOM ready 
    //so it is safe to query the DOM
    $app_Message = $("#message");
    $app_Div = $("#lightLMS_div");

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
			    if (action === "rf_ispr") {
			        // Register File iSpring (rf_ispr)
			        say('Please wait while registering iSpring... ');
			        $app_Message.text('Please wait while registering iSpring... ');
			        $.getScript("../Scripts/iSpring/register.js");
			    }
			    if (action === "rf_sco") {
			        // Register File Scorm (rf_sco)
			        $app_Message.text('Please wait while registering Scorm... ');
			        $.getScript("../Scripts/Scorm/register.js");
			    }
			    else if (action === "sd_ispr") {
			        // Save Data from iSpring quiz (sd_ispr)
			        saveIspring();
			    }
			    else if (action === "sd_sco") {
			        // Save Data from iSpring quiz (sd_sco)
			        saveScorm();
			    }
			    else if (action === "st") {
			        // Show Tasks (st)					
			    }
			    else if (action === "at") {
			        // Assign Tasks (at)					
			    }
			}
		}, 
		function() { alert ("something went wrong creating list: " + app_MainListName ); }		
	); 
	
}

// ----------------------------------- Init ends ----------------------------------------------------------- 
// ---------------------------------------------------------------------------------------------------------

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
    $app_Message.text("Please wait while saving your score...")
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

function saveScorm() {
    say("saveScorm called ");
}

function checkHostListExistsOrCreate (listName, createFn, okFn, errFn){
	var listObj = { "Title":listName };
			
	spyreqs.jsom.checkHostList(listObj).then(
		function(listExistsBool) 
		{
			if (listExistsBool) { okFn(); }
			else {
			    $app_Message.text('Please wait while creating list... ');
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
		fields: [
                { "Name": "userId", "Type": "Text", "Required": "Τrue" },
				{ "Name": "testId", "Type": "Text" },
                { "Name": "testTemplateId", "Type": "Text" },				
				{ "Name": "userName", "Type": "Text" },
				{ "Name": "courseId", "Type": "Text" },
				{ "Name": "periodId", "Type": "Text" },
				{ "Name": "assignedFrom", "Type": "User" },
				{ "Name": "assignedTo", "Type": "User" },
				{ "Name": "dateAssigned", "Type": "DateTime" },
				{ "Name": "dateDue", "Type": "DateTime" },
				{ "Name": "dateLastTried", "Type": "DateTime" },
				{ "Name": "canRetry", "Type": "Boolean" },
				{ "Name": "state", "Type": "Choice", "choices": ["rejected", "approved", "passed", "proggress", "registered"] },
				{ "Name": "score", "Type": "Number" },
				{ "Name": "passingScore", "Type": "Number" },
				{ "Name": "maxScore", "Type": "Number" },
				{ "Name": "testLink", "Type": "URL" },
				{ "Name": "comments", "Type": "Note" },
				{ "Name": "extraField_1", "Type": "Text", "Hidden": "True" },
				{ "Name": "extraField_2", "Type": "Text", "Hidden": "True" },
				{ "Name": "extraField_3", "Type": "Text", "Hidden": "True" },
				{ "Name": "extraField_4", "Type": "Text", "Hidden": "True" },
				{ "Name": "extraField_5", "Type": "Text", "Hidden": "True" },
				{ "Name": "extraField_6", "Type": "Text", "Hidden": "True" }
			]	 
		})
	.then(                    
		function() { okFn(); },                    
		function(error) { errFn(); } 
	);
}


// ----------------------------------- Generic functions ----------------------------------------------------------- 

function onQueryFailed_Generic(sender, args) {  
	alert('Sorry, query failed: ' + args.get_message() + '\nstackTrace: ' + args.get_stackTrace());  
} 

// ----------------------------------- DEMO functions ----------------------------------------------------------- 

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