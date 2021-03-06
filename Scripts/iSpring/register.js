(function (spyreqs) {
    var say = spyreqs.utils.say,
        queryParams = spyreqs.utils.urlParamsObj(),
        getFile = spyreqs.rest.getHostFile,
        addFile = spyreqs.rest.addHostFile,
        itemUrl = decodeURIComponent(queryParams.ItemUrl);

    function getFolderName(fileName) {
        var folderName = fileName.split('/');
        return folderName.splice(0, folderName.length - 1).join('/');
    }
    
    function buildAppUrlScript() {
        var oldUrlStr, newUrlStr, fileNameOnUrl;
        // get current url without params
        oldUrlStr = window.location.href.split('?')[0];
        // replace 'register.aspx' with 'default.aspx'. Register.aspx may be changed, so, get it from current window.location
        fileNameOnUrl = window.location.pathname.split('/')[window.location.pathname.split('/').length - 1];
        // hopefully, the actual launch page file will keep that name for ever!
        newUrlStr = oldUrlStr.replace(fileNameOnUrl, 'default.aspx');
        // the action will be to save quiz data returning from iSpring test
        newUrlStr = newUrlStr + "?action=sd_ispr";
        // add next two params from the current urlParams object
        newUrlStr = newUrlStr + "&SPHostUrl=" + queryParams.SPHostUrl +
                                "&SPAppWebUrl=" + queryParams.SPAppWebUrl;
        return "var redirectUrl='" + newUrlStr + "';";
    }
    
    /* *
       * cancelXhrCode: this is the js code to attach to the aspx file we will create for iSpring test to run
       * This code stops XMLHttpRequests from sending quiz results to a server, 
       * and instead it redirects to this app url with all data from iSpring into the queryString 
       * SOS we need to add a string definition for our app's Url, 
       * but cancelXhrCode is a standard string, so we use two code strings
       * We have the code from the js file, now we built the url to be redirected when user finishes the quiz
       * The code in cancelXhrCode will redirect the iSpring quiz to the url returned from buildAppUrlScript()
    */
    $.when(getFile(itemUrl), $.get("../Scripts/iSpring/cancelXhr.txt")).done(function (data, scriptData) {
        var fileName = "start.aspx",
            folderName = getFolderName(itemUrl),
            appUrlScript = buildAppUrlScript(),
            cancelXhrScript = scriptData[0];
       
        say("appUrlScript = " + appUrlScript);
        // say("cancelXhrScript = " + cancelXhrScript);

        data = data.replace("</body>", "<script>" + appUrlScript + cancelXhrScript + "</script></body>");

        addFile(folderName, fileName, data).done(function () {
            // SOS $app_Message is not defined!!!
            $("#message").text('Please wait while updating list...');
            spyreqs.jsom.addHostListItem(app_MainListName,
                {
                    "userId": userId,
                    "assignedFrom": userId + ';#' + userName,
                    "state": "registered",
                    "testLink": folderName + "/" + fileName
                }).then(
                function (itemId) { $("#message").text('Registration completed!'); },
                function (error) {
                    $("#message").text('Sorry, registration failed.');
                    say('addRegistrationRecord request failed. ' + error.args.get_message() + '\n' + error.args.get_stackTrace());
                }
            );
        });
    });    

}(spyreqs));
