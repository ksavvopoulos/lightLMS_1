function getScormPlayerversion() { return 1; }
var scoData = null; var web = null; var params = null; var clientContext = null; 

if (window.addEventListener) {
    window.addEventListener("message", ReceiveMessage, false);
    say("added Event Listener");
} else if (window.attachEvent) {
    window.attachEvent("onmessage", ReceiveMessage);
    say("added attachEvent Listener");
} else {     say("Your browser does not support event listeners"); }

function SendMessage(theMessage) {
    try {
        var child = document.getElementById("remote_Iframe");
        var myMsg = window.JSON.stringify(theMessage);
        child.contentWindow.postMessage(myMsg, '*');
    } catch (err) {
        say("SendMessage - Error description: " + err.message);
        document.getElementById(errorLogDivID).innerHTML = "SendMessage() error: " + err.message;
    }
}

function ReceiveMessage(event) {
    try {
        var eventObjData = window.JSON.parse(event.data);
        var theFunction = eventObjData.theFunction;
        var theData = eventObjData.theData;
        //
        if (theFunction == "handshake") {
            // we have connection, time to send params to child frame   
            SendMessage({ "theFunction": "params", "theData": finalParamsObj });
        }
        else if (theFunction == "playerconfig") {
            // we have the params, time to send PlayerConfiguration to child frame            
            SendMessage({ "theFunction": "playerconfig", "theData": PlayerConfiguration });
        }
        else if (theFunction == "scormversion") {
            theScormVersion = theData;
        }
        else if (theFunction == "lmsinitdata") {
            // we have the PlayerConfiguration, time to send LMS init data to child frame 			
            // normally we have this from the webpart
			var bookmark = "";
			if (finalParamsObj.itemDescription) { 
				var ind1 = finalParamsObj.itemDescription.indexOf('>')+1;
				var ind2 = finalParamsObj.itemDescription.indexOf('</');
				if (ind2 < 1) ind2 = finalParamsObj.itemDescription.length;
				var iDescription = finalParamsObj.itemDescription.substring(ind1,ind2);
				var descriptionParamsObj = strParamsObj(iDescription);			
				if (descriptionParamsObj != null) bookmark = descriptionParamsObj.scormbookmark;
			}			
            SendMessage({ "theFunction": "lmsinitdata", "theData": bookmark });
        }
        else if (theFunction == "savelmsdata") {
            say("data to save! " + window.JSON.stringify(theData));
            saveToList(theData);
        }
        else if (theFunction == "say") {
            // must log the data to parent's console			
            say("iframe says: " + theData);
        }
        else if (theFunction == "showdata") {
            // must log the data to parent's console			
            say("iframe sends data: " + window.JSON.stringify(theData));
        }
        else if (theFunction == "stopspinner") {
            // hide the loading spinner
            if (spinner) spinner.stop();
            // hide the ribbon also ?
        }
        else {
            say("parent received unknown Function: " + theFunction);
        }
    } catch (err) {
        say("ReceiveMessage - Error description: " + err.message);
        document.getElementById(errorLogDivID).innerHTML = "ReceiveMessage() error: " + err.message;
    }
}

function InitPlayer() {
    // scormplayer_iframe is the iframe inside the webpart
    try {
        say("initPlayer called, inEduScormPlayer.js version: " + getScormPlayerversion());
        /*
		say("correcting css");
		$('.PageLayout-Wrapper').removeClass('PageLayout-Wrapper');
		$('.OneColumnZone-Wrapper').removeClass('OneColumnZone-Wrapper');
		$('.TopColumnZone-Wrapper').removeClass('TopColumnZone-Wrapper');
		$('.s4-wpcell-plain').removeClass('s4-wpcell-plain');
		$('.s4-wpTopTable').removeClass('s4-wpTopTable');
		$('.ms-WPBody').removeClass('ms-WPBody noindex');
		$('#remote_player').parent().parent().css('height','700px');
		*/
		params = URLparamsObj();
        if (params.manifest) {
            if (!finalParamsObj) { say("*** Did not find final parameters object"); }
            else {
                // correct casting errors
                if (typeof finalParamsObj.cache === 'string') {
                    if (finalParamsObj.cache == "False") { finalParamsObj.cache = false; } else { finalParamsObj.cache = true; }
                    if (finalParamsObj.debug == "False") { finalParamsObj.debug = false; } else { finalParamsObj.debug = true; }
                    if (finalParamsObj.native == "False") { finalParamsObj.native = false; } else { finalParamsObj.native = true; }
                }
            }
            // now we should start the player
            if (finalParamsObj.native) { alert("Native player is not supported"); }
            else {
                // keep original filename to update item with score
                var originalItem = params.manifest;
                // manifest is the folder name in blob, we got it from assignment filename. We MUST check if it's copied for student and remove _id_id from filename.
                finalParamsObj.manifest = getOriginal(params.manifest);
                // attach target xml at manifest folder
                finalParamsObj.manifest = finalParamsObj.manifest.attachFileName("imsmanifest.xml");
                // add path for organization blob container
                if (getOrganizationName) { 
					finalParamsObj.manifest = "../" + getOrganizationName().toLowerCase() + "/" + finalParamsObj.manifest;
					StartRemotePlayer();
				}
                else { document.getElementById(errorLogDivID).innerHTML = "*** Organization name not known"; }                
            }
        } else { document.getElementById(errorLogDivID).innerHTML = "*** No manifest declared"; }
    } catch (err) {
        say("InitPlayer - Error description: " + err.message);
        document.getElementById(errorLogDivID).innerHTML = "InitPlayer() error: " + err.message;
    }
}

function getOriginal(filename) {
    var arr = filename.split("_");
    arrLength = arr.length;
    if ((arrLength > 2) && isNumber(last = arr[arrLength - 1]) && isNumber(preLast = arr[arrLength - 2])) {
        var strToCrop = "_" + preLast + "_" + last;
        return filename.replace(strToCrop, "");
    } else { return filename; }
}

function StartRemotePlayer() {
    try {
        say("startRemotePlayer called");
        document.getElementById("native_player").style.display = "none";
        document.getElementById("remote_player").style.display = "block";
        // add boolean debug param here, after we have evaluate casting string
        PlayerConfiguration["Debug"] = finalParamsObj.debug;
        document.getElementById("remote_Iframe").src = finalParamsObj.theSrc;
        say("remote iFrame is set with src: " + finalParamsObj.theSrc);
    } catch (err) {
        say("StartRemotePlayer Error description: " + err.message);
        document.getElementById(errorLogDivID).innerHTML = "StartRemotePlayer error: " + err.message;
    }
}

function saveToList(cmiData) {
	say("saveToList called");
    // Here we have to build a query string with cmiData as parameters
	// and our app url as target url 
}

function onItemUpdateSucceeded() {
    say("SUCCESS: item update");
    if (spinner) spinner.stop();
}

function onItemUpdateFailed(sender, args) {
    say("FAIL: item update");
    if (spinner) spinner.stop();
    alert('Save request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
}

function getRemoteJSVersion() { LookFor(getRemoteJSversion()); }
function LookFor(what) { SendMessage({ "theFunction": "lookfor", "theData": what }); };
function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }

String.prototype.attachFileName = function (filename) {
    // function adds filename string to this string if it's not already there. Checks for slash also.
    var attached = "";
    if (this.indexOf(filename) < 0) { // if it does not contain the filename
        if (this.charAt(this.length - 1) != "/") { // if needs to add a slash
            attached += "/";
        } attached += filename;
    } return String(this + attached);
}
String.prototype.attachURLParams = function (paramsObj) {
    var attached = "?";
    for (var key in paramsObj) {
        attached += key + "=" + paramsObj[key] + "&";
    } return String(this + attached);
}