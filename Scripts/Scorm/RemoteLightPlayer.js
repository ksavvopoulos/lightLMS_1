errorLogDivID = "errorDiv";
function getRemoteJSversion() { return 1; }

function InitListener() {
    if (window.addEventListener) {
        window.addEventListener("message", ReceiveMessage, false);
        say("added Event Listener");
        Handshake();
    } else if (window.attachEvent) {
        window.attachEvent("onmessage", ReceiveMessage);
        say("added attachEvent Listener");
        Handshake();
    } else { alert ("Your browser does not support event listeners"); }
}

function SendMessage(theMessage) {
    try {        
        var myMsg = JSON.stringify(theMessage);
        window.top.postMessage(myMsg, '*');
    } catch (err) {
        say("remote SendMessage - Error description: " + err.message);
        document.getElementById(errorLogDivID).innerHTML = "RemoteSendMessage() error: " + err.message;
    }
}

function ReceiveMessage(event) {
    try
    {
        var eventObjData = JSON.parse(event.data);
        var theFunction = eventObjData.theFunction;
        var theData = eventObjData.theData;
        //
        if (theFunction == "params") {          
            say("got params from parent: params. Asking for PlayerConfiguration");
            this.paramsObj = theData;
            SendMessage({ "theFunction": "playerconfig" });
        } else if (theFunction == "playerconfig") {           
            say("got data from parent: PlayerConfiguration");
            this.PlayerConfiguration = theData;  
			getLMSInitData();            
        } else if (theFunction == "lmsinitdata") {
            say("got data from parent: lmsinitdata / RTEinitData");
            bookmark = theData;
			StartPlayer();
        } else if (theFunction == "lookfor") {
            SendMessage({ "theFunction": "say", "theData": eval(theData) });
        } else {
            say("child received unknown Function: " + theFunction);
        }
     } catch (err) {
        say("remote ReceiveMessage - Error description: " + err.message);
        document.getElementById(errorLogDivID).innerHTML = "RemoteReceiveMessage() error: " + err.message;
     }
}

function onBeforeLMSInit(version) {
	say("onBeforeLMSInit() called for scorm version " + version);
    // version is 12 for scorm 1.2 or 2004 for scorm 2004
    ScormVersion = version;
    SendMessage({ "theFunction": "scormversion", "theData":version });
    //
    say("stop spinner");
    SendMessage({ "theFunction": "stopspinner" });   
}

function onAfterLMSInit() {
	say("onAfterLMSInit() called");
    say("checking for LMS init data ...");
	if (typeof bookmark != 'undefined') { if (bookmark.length > 0 ) { say("...found"); setLMSInitData(bookmark); } }
	else {say("... nope"); return false;}        
}

function saveLMSData() {
    //return;
    say("saveLMSData called");
    // version is 12 for scorm 1.2 or 2004 for scorm 2004
    if (ScormVersion > 1000) {
        // scorm 2004
        getterFunction = API_1484_11.GetValue;
        dataListToSave = [
           "cmi.success_status",
           "cmi.score.scaled",
           "cmi.session_time",
           "cmi.location",
           "cmi.exit"
        ];
    } 
    else {
        // possibly scorm 1.2
        getterFunction = API.LMSGetValue;
        dataListToSave = [
            "cmi.core.lesson_status",
            "cmi.core.score.raw",
            "cmi.core.session_time",
            "cmi.core.lesson_location",
            "cmi.core.exit"            
        ];
    }
    cmiData =
    {        
        "status": getterFunction(dataListToSave[0]),
        "score": getterFunction(dataListToSave[1]),
        "time": getterFunction(dataListToSave[2]),
        "location": getterFunction(dataListToSave[3]),
        "exit": getterFunction(dataListToSave[4]),        
        "otherdata": "empty"
    };
    SendMessage({ "theFunction": "savelmsdata", "theData": cmiData });
}

function setLMSInitData(theLocation) {
	//say("setLMSInitData WAS SKIPPED"); return;
    //if (!confirm("initialize scorm API from RTE data?")) return;
    say("setLMSInitData called");
    //
    if (ScormVersion > 1000) {
        say("setting init data for version scorm 2004");
        setterFunction = API_1484_11.SetValue;
        /*dataListToInit = [
           "cmi.success_status",
           "cmi.score.scaled",
           "cmi.session_time",
           "cmi.location",
           "cmi.exit"
        ];*/
		dataListToInit = [            
           "cmi.location"
        ];
    }
    else {
        say("setting init data for version scorm 1.2");
        setterFunction = API.LMSSetValue;
        /*dataListToInit = [
            "cmi.core.lesson_status",
            "cmi.core.score.raw",
            "cmi.core.session_time",
            "cmi.core.lesson_location",
            "cmi.core.exit"
        ];*/
		dataListToInit = [            
            "cmi.core.lesson_location" 
        ];
    }
    /*
    for (var i=0; i<dataListToInit.length;i++){
        setterFunction(dataListToInit[i], cmiData[i]) ;
    }*/
	// just put the bookmark
	setterFunction(dataListToInit[0], theLocation) ;
}

function Handshake() {
    try {
        if (window.top != window) {
            say("remote sends handshake to parent window");
            SendMessage({ "theFunction": "handshake" });
        } else {
            say("there is no top window for handshake, starting player");
            this.PlayerConfiguration = {};
            PlayerConfiguration.Debug = true;
            PlayerConfiguration.StorageSupport = true;
            StartPlayer();
        }
    } catch (err) {
        say("remote Handshake - Error description: " + err.message);
        document.getElementById(errorLogDivID).innerHTML = "Handshake() error: " + err.message;
    }
}

function getLMSInitData() {  SendMessage({ "theFunction": "lmsinitdata" }); }

function StartPlayer() {
    say("Remote initPlayer called, remotePlayer.js version: " + getRemoteJSversion()); 
    try {
        // get params from parent frame  
        var params = paramsObj;
    } catch (e) {
        // get params from url  
        say("failed to get params from parent frame, now reading url params");
        var params = URLparamsObj();
    }  
    try {
        if (params.manifest) {			
            if (params.cache) say("CAUTION, cache is enabled!");
            // now we should start the player			
            Run.ManifestByURL(params.manifest, params.cache);
        } else {           
            document.getElementById(errorLogDivID).innerHTML = "*** No manifest declared";
        }        
    } catch (err) {
        say("remote StartPlayer - Error description: " + err.message);
        document.getElementById(errorLogDivID).innerHTML = "StartPlayer() error: " + err.message;
    }
}

function say(what) {
    if (window.top != window) {
        SendMessage({ "theFunction": "say", "theData": what });       
    } else if (window.console) {
        console.log(what);
    }   
}

function jsonSay(jsonwhat) {
    if (window.top != window) {
        SendMessage({ "theFunction": "showdata", "theData": jsonwhat });
    } else if (window.console) {
        console.log(window.JSON.stringify(jsonwhat));
    }   
}

function URLparamsObj() {
    // function returns an object with url parameters
    if (window.location.search) {
        // if there are params in URL
        var param_array = document.location.search.substring(1).split('&');
        var params = new Object();
        var theLength = param_array.length;
        for (var i = 0; i < theLength; i++) {
            var x = param_array[i].toString().split('=');
            params[x[0]] = x[1];
        }
        return params;
    }
    return;
}