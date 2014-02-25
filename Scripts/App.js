'use strict';
var context = SP.ClientContext.get_current(),
	user = context.get_web().get_currentUser(),
	userName, userId;

(function () {

	// This code runs when the DOM is ready and creates a context object which is 
	// needed to use the SharePoint object model
	$(document).ready(function () {
		getUserNameAndInit();	
	});

	// This function prepares, loads, and then executes a SharePoint query to get 
	// the current users information
	function getUserNameAndInit() {
		context.load(user);
		context.executeQueryAsync(onGetUserNameSuccess, onGetUserNameFail);
	}

	// This function is executed if the above call is successful
	// It replaces the contents of the 'message' element with the user name
	function onGetUserNameSuccess() {
		userName = user.get_title();
		userId = user.get_id();
		$('#message').text('Hello ' + userName);
		initApp();
	}

	// This function is executed if the above call fails
	function onGetUserNameFail(sender, args) {
		alert('Failed to get user name. Error:' + args.get_message());
	}

})();