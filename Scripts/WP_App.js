'use strict';
// let these public for future use
var user, userName, userId;

(function () {

    var context = SP.ClientContext.get_current();
	// This code runs when the DOM is ready and creates a context object which is 
	// needed to use the SharePoint object model
	$(document).ready(function () {
		getUserName();
		say("commmons loaded from the web part!");
		initApp();
	});

	// This function prepares, loads, and then executes a SharePoint query to get 
	// the current users information
	function getUserName() {
	    user = context.get_web().get_currentUser();
		context.load(user);
		context.executeQueryAsync(onGetUserNameSuccess, onGetUserNameFail);
	}

	// This function is executed if the above call is successful
	// It replaces the contents of the 'message' element with the user name
	function onGetUserNameSuccess() {
		$(app_Div).text('Hello ' + user.get_title());
	}

	// This function is executed if the above call fails
	function onGetUserNameFail(sender, args) {
		alert('Failed to get user name. Error:' + args.get_message());
	}

})();