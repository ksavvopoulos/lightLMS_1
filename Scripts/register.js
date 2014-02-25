(function (spyreqs) {
    var say = spyreqs.utils.say,
        queryParams = spyreqs.utils.urlParamsObj(),
        getFile = spyreqs.rest.getHostFile,
        addFile = spyreqs.rest.addHostFile,
        itemUrl = decodeURIComponent(queryParams.ItemUrl);

    function getFolderName(str) {
        var folder = str.split('/'),
            folderNameArray = [],
            i, len;

        for (i = 0, len = folder.length - 1; i < len; i++) {
            folderNameArray.push(folder[i]);
        }
        return folderNameArray.join('/');
    }

    function buildAppUrlScript() {
        var oldUrlStr, newUrlStr;
      
        // get current url without params
        oldUrlStr = window.location.href.split('?')[0];
        // the action will be to save quiz data returning from iSpring test
        newUrlStr = buildUrlParamsString(oldUrlStr, "action", "sd_ispr");
        // add next two params from the current urlParams object
        newUrlStr = buildUrlParamsString(newUrlStr, "SPHostUrl", queryParams.SPHostUrl);
        newUrlStr = buildUrlParamsString(newUrlStr, "SPAppWebUrl", queryParams.SPAppWebUrl);
        return "var redirectUrl='" + newUrlStr + "';";
    }

    function buildQueryString(str, param, val) {
        var ind = -1, attached = '';
        var param_array = str.substring(ind + 1).split('&');
        var params = {};
        var theLength = param_array.length;
        for (var i = 0; i < theLength; i++) {
            var x = param_array[i].toString().split('=');
            params[x[0]] = x[1];
        }
        params[param] = val;
        for (var key in params) {
            attached += key + "=" + params[key] + "&";
        } attached = attached.substr(0, attached.length - 1);
        return String(str.substr(0, ind) + attached);
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
    $.when(getFile(itemUrl), $.get("../Scripts/cancelXhr.js")).done(function (data, scriptData) {
        var fileName = "index1.aspx",
            folderName = getFolderName(itemUrl),
            cancelXhrScript = scriptData[0];

        data = data.replace("</body>", "<script>" + buildAppUrlScript() + cancelXhrScript + "</script></body>");

        addFile(folderName, fileName, data).done(function () {
            $('#message').text('iSpring registered');
        });
    });    

}(spyreqs));
