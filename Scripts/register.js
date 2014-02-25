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

    $.when(getFile(itemUrl), $.get("../Scripts/cancelXhr.js")).done(function (data, scriptData) {
        var fileName = "index1.aspx",
            folderName = getFolderName(itemUrl),
            script = scriptData[0];

        data = data.replace("</body>", "<script>" + script + "</script></body>");

        addFile(folderName, fileName, data).done(function () {
            $('#message').text('iSpring registered');
        });
    });

}(spyreqs));
