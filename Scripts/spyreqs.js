(function (window) {
    "use strict";
    var appUrl, hostUrl, queryParams,
        executor, baseUrl, targetStr,
        spyreqs, say, rest, jsom;

    if (typeof window.console !== 'undefined') {
        say = function (what) { window.console.log(what); };
    } else if ((typeof window.top !== 'undefined') && (typeof window.top.console !== 'undefined')) {
        say = function (what) { window.top.console.log(what); };
    } else if ((typeof window.opener !== 'undefined') && (typeof window.opener.console !== 'undefined')) {
        say = function (what) { window.opener.console.log(what); };
    } else { say = function () { }; }

    function getAsync(url) {
        var defer = new $.Deferred();

        executor.executeAsync({
            url: url, method: "GET", dataType: "json",
            headers: {
                Accept: "application/json;odata=verbose"
            },
            success: function (data) {
                defer.resolve(JSON.parse(data.body));
            },
            fail: function (error) { defer.reject(error); }
        });
        return defer.promise();
    }

    function getFile(url) {
        var defer = new $.Deferred();

        executor.executeAsync({
            url: url, method: "GET",
            success: function (data) {
                defer.resolve(data.body);
            },
            fail: function (error) { defer.reject(error); }
        });
        return defer.promise();
    }

    function addFile(url, file) {
        var defer = new $.Deferred();

        executor.executeAsync({
            url: url,
            method: "POST",
            headers: {
                "Accept": "application/json; odata=verbose"
            },
            contentType: "application/json;odata=verbose",
            body: file,
            success: function (data) {
                defer.resolve(JSON.parse(data.body));
            },
            fail: function (error) {
                defer.reject(error);
            }
        });
        return defer.promise();
    }

    function deleteAsync(url, etag) {
        var defer = new $.Deferred();

        executor.executeAsync({
            url: url,
            method: "POST",
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-HTTP-Method": "DELETE",
                "If-Match": etag
            },
            success: function (data) {
                //data.body is an empty string
                defer.resolve(data);
            },
            fail: function (error) {
                defer.reject(error);
            }
        });
        return defer.promise();
    }

    function updateAsync(url, data) {
        var defer = new $.Deferred();

        executor.executeAsync({
            url: url,
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Accept": "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-HTTP-Method": "MERGE",
                "If-Match": data.__metadata.etag
            },
            success: function (data) {
                //data.body is an empty string
                defer.resolve(data);
            },
            fail: function (error) {
                defer.reject(error);
            }
        });
        return defer.promise();
    }

    function createAsync(url, data) {
        var defer = new $.Deferred();

        executor.executeAsync({
            url: url,
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose"
            },
            success: function (data) {
                defer.resolve(JSON.parse(data.body));
            },
            fail: function (error) {
                defer.reject(error);
            }
        });
        return defer.promise();
    }

    /**
     * checks if the query argument is a string and if it is not returns an empty string
     * @param  {string} query [the query to execute]
     * @return {string}       [the input query or an empty string]
     */
    function checkQuery(query) {
        if (typeof query === 'undefined' || (typeof query !== 'string' && !(query instanceof String))) {
            return '';
        }
        return query;
    }

    function newContextInstance() {
        // for jsom use. Return an object with new instances for clear async requests
        var returnObj = {}, context, factory, appContextSite;

        context = new SP.ClientContext(appUrl);
        factory = new SP.ProxyWebRequestExecutorFactory(appUrl);
        context.set_webRequestExecutorFactory(factory);
        appContextSite = new SP.AppContextSite(context, hostUrl);

        returnObj.context = context;
        returnObj.factory = factory;
        returnObj.appContextSite = appContextSite;
        return returnObj;
    }

    function urlParamsObj() {
        // function returns an object with url parameters
        if (window.location.search) { // if there are params in URL
            var param_array = document.location.search.substring(1).split('&'),
                theLength = param_array.length,
                params = {}, i = 0, x;

            for (; i < theLength; i++) {
                x = param_array[i].toString().split('=');
                params[x[0]] = x[1];
            }
            return params;
        }
        return null;
    }

    queryParams = urlParamsObj();
    appUrl = decodeURIComponent(queryParams.SPAppWebUrl);
    if (appUrl.indexOf('#') !== -1) { appUrl = appUrl.split('#')[0]; }

    hostUrl = decodeURIComponent(queryParams.SPHostUrl);
    targetStr = "&@target='" + hostUrl + "'";
    baseUrl = appUrl + "/_api/SP.AppContextSite(@target)/";
    executor = new SP.RequestExecutor(appUrl); // for rest use

    /**
     * the rest object has methods that are not to be exposed and are used
     * only from the spyreqs.rest methods
     */
    rest = {
        createList: function (url, list) {
            var data = {
                "__metadata": {
                    type: "SP.List"
                },
                BaseTemplate: list.Template,
                Title: list.Title
            };
            return createAsync(url, data);
        },
        addListField: function (url, field, fieldType) {
            field.__metadata = {
                type: (typeof fieldType !== 'undefined') ? fieldType : 'SP.Field'
            };
            return createAsync(url, field);
        }
    };
    jsom = {
        createListFields: function (context, SPlist, fieldsObj) {
            var field, defer, result;

            field = fieldsObj.shift();
            createListField();

            function createListField() {
                var xmlStr, choice, attr;

                if (typeof defer === 'undefined') {
                    defer = new $.Deferred();
                }
                if (typeof field.Type === 'undefined') {
                    field.Type = "Text";
                }
                if (typeof field.DisplayName === 'undefined') {
                    field.DisplayName = field.Name;
                }
                if (field.Type !== 'Lookup') {
                    xmlStr = '<Field ';
                    for (attr in field) {
                        if (attr !== 'choices') {
                            xmlStr += attr + '="' + field[attr] + '" ';
                        }
                    }
                    xmlStr += '>';
                    if (field.Type === 'Choice') {
                        xmlStr += '<CHOICES>';
                        for (choice in field.choices) {
                            xmlStr += '<CHOICE>' + field.choices[choice] + '</CHOICE>';
                        }
                        xmlStr += '</CHOICES>';
                    }
                    xmlStr += '</Field>';
                } else {
                    xmlStr += '';
                }
                result = SPlist.get_fields().addFieldAsXml(xmlStr, true, SP.AddFieldOptions.defaultValue);
                context.load(SPlist);
                context.executeQueryAsync(success, fail);
            }

            function success() {
                if (fieldsObj.length > 0) {
                    field = fieldsObj.shift();
                    createListField();
                } else {
                    defer.resolve(result);
                }
            }

            function fail(sender, args) {
                var error = { sender: sender, args: args };
                defer.reject(error);
            }

            return defer.promise();
        }
    };

    spyreqs = {
        rest: {
            /**
             * gets the Lists of the host Site
             * @param  {string} query [the query to execute example:"$filter=..."]
             * example of using the function
             * spyreqs.rest.getHostLists("$select=...").then(function(data){//doSomething with the data},function(error){//handle the error});
             */
            getHostLists: function (query) {
                var url = baseUrl + "web/lists?" + checkQuery(query) + targetStr;
                return getAsync(url);
            },
            getAppLists: function (query) {
                var url = appUrl + "/_api/web/lists?" + checkQuery(query);
                return getAsync(url);
            },
            /**
             * gets a List from the Host Site by the Title of the List
             * @param  {string} listTitle [the Title of the List]
             * @param  {string} query     [the query to execute]
             */
            getHostListByTitle: function (listTitle, query) {
                var url = baseUrl + "web/lists/getByTitle('" + listTitle + "')?" + checkQuery(query) + targetStr;
                return getAsync(url);
            },
            /**
             * gets the Items of a List from the Host Site
             * @param  {string} listTitle [The Title of the List]
             * @param  {string} query     [the query to execute]
             */
            getAppListByTitle: function (listTitle, query) {
                var url = appUrl + "/_api/web/lists/getByTitle('" + listTitle + "')?" + checkQuery(query);
                return getAsync(url);
            },
            getHostListItems: function (listTitle, query) {
                var url = baseUrl + "web/lists/getByTitle('" + listTitle + "')/Items?" + checkQuery(query) + targetStr;
                return getAsync(url);
            },
            getAppListItems: function (listTitle, query) {
                var url = appUrl + "/_api/web/lists/getByTitle('" + listTitle + "')/Items?" + checkQuery(query);
                return getAsync(url);
            },
            /**
             * gets the Fields of a List form the Host Site
             * @param  {string} listTitle [The Title of the List ]
             * @param  {string} query     [the query to execute]
             */
            getHostListFields: function (listTitle, query) {
                var url = baseUrl + "web/lists/getByTitle('" + listTitle + "')/Fields?" + checkQuery(query) + targetStr;
                return getAsync(url);
            },
            getAppListFields: function (listTitle, query) {
                var url = appUrl + "/_api/web/lists/getByTitle('" + listTitle + "')/Fields?" + checkQuery(query);

                return getAsync(url);
            },
            /**
             * create a List at the Host Site
             * @param  {object} list [the list to create. Must have the properties 'Template' and 'Title']
             */
            createHostList: function (list) {
                var url = baseUrl + "web/lists?" + targetStr;
                return rest.createList(url, list);
            },
            createAppList: function (list) {
                var url = appUrl + "/_api/web/lists?";
                return rest.createList(url, list);
            },
            /**
             * adds an item to a Host List
             * @param {string} listTitle [The Title of the List]
             * @param {object} item      [the item to create. Must have the properties Title and __metadata.
             * __metadata must be an object with property type and value "SP.Data.LessonsListItem"]
             */
            addHostListItem: function (listTitle, item) {
                var url = baseUrl + "web/lists/getByTitle('" + listTitle + "')/Items?" + targetStr;
                return createAsync(url, item);
            },
            addAppListItem: function (listTitle, item) {
                var url = appUrl + "/_api/web/lists/getByTitle('" + listTitle + "')/Items?";
                return createAsync(url, item);
            },
            /**
             * deletes an item from List from the Host Site
             * @param  {string} listTitle [The Title of the List]
             * @param  {string} itemId    [the id of the item]
             * @param  {string} etag      [the etag value of the item's __metadata object]
             */
            deleteHostListItem: function (listTitle, itemId, etag) {
                var url = baseUrl + "web/lists/getByTitle('" + listTitle + "')/Items(" + itemId + ")?" + targetStr;
                return deleteAsync(url, etag);
            },
            deleteAppListItem: function (listTitle, itemId, etag) {
                var url = appUrl + "/_api/web/lists/getByTitle('" + listTitle + "')/Items(" + itemId + ")?";
                return deleteAsync(url, etag);
            },
            /**
             * updates an item in a Host List
             * @param  {string} listTitle [the title of the Host List]
             * @param  {object} item      [the item to update. Must have the properties Id and __metadata]
             */
            updateHostListItem: function (listTitle, item) {
                var url = baseUrl + "web/lists/getByTitle('" + listTitle + "')/Items(" + item.Id + ")?" + targetStr;
                return updateAsync(url, item);
            },
            updateAppListItem: function (listTitle, item) {
                var url = appUrl + "/_api/web/lists/getByTitle('" + listTitle + "')/Items(" + item.Id + ")?";
                return updateAsync(url, item);
            },
            /**
             * adds a field to a Host List
             * @param {string} listGuid [the guid of the list]
             * @param {object} field    [the field to add]
             * @param {string} fieldType [otional fieldType.If not provided defaults to SP.Field]
             * field must have the properties :
             *      'Title': 'field title',
             *      'FieldTypeKind': FieldType value,{int}
             *      'Required': true/false,
             *      'EnforceUniqueValues': true/false,
             *      'StaticName': 'field name'
             * information about FieldTypeKind :
             *     http://msdn.microsoft.com/en-us/library/microsoft.sharepoint.client.fieldtype.aspx
             */
            addHostListField: function (listGuid, field, fieldType) {
                var url = baseUrl + "web/lists(guid'" + listGuid + "')/Fields?" + targetStr;
                return rest.addListField(url, field, fieldType);
            },
            addAppListField: function (listGuid, field, fieldType) {
                var url = appUrl + "/_api/web/lists(guid'" + listGuid + "')/Fields?";
                return rest.addListField(url, field, fieldType);
            },
            getCurrentUser: function () {
                var url = baseUrl + "/web/CurrentUser?" + targetStr;
                return getAsync(url);
            },
            getHostFile: function (fileUrl) {
                var url = baseUrl + "web/GetFileByServerRelativeUrl('" + fileUrl + "')/$value?" + targetStr;
                return getFile(url);
            },
            getAppFile: function (fileUrl) {
                var url = appUrl + "/_api/web/GetFileByServerRelativeUrl('" + fileUrl + "')/$value?";
                return getFile(url);
            },
            addHostFile: function (folderName, fileName, file) {
                var url = baseUrl + "web/GetFolderByServerRelativeUrl('" + folderName + "')/Files/Add(url='" + fileName + "',overwrite=true)?" + targetStr;
                return addFile(url, file);
            },
            addAppFile: function (folderName, fileName, file) {
                var url = appUrl + "/_api/web/GetFolderByServerRelativeUrl('" + folderName + "')/Files/Add(url='" + fileName + "',overwrite=true)?";
                return addFile(url, file);
            },
            deleteHostFile: function (fileUrl) {

            }
        },
        jsom: {
            checkHostList: function (listObj) {
                // This function checks if list.Title exists.
                /* syntax example: 
                spyreqs.jsom.checkHostList({ "Title":listName }).then(
                    function(listExistsBool) { alert(listExistsBool); // true or false },
                    function(error) { alert('checkHostList request failed. ' +  error.args.get_message() + '\n' + error.args.get_stackTrace() ); }
                );  
                */
                var web, collectionList,
                    defer = new $.Deferred(),
                    c = newContextInstance();

                web = c.appContextSite.get_web();
                collectionList = web.get_lists();
                // this will only load Title, no other list properties
                c.context.load(collectionList, 'Include(Title)');
                c.context.executeQueryAsync(success, fail);

                function success() {
                    var listInfo = '',
                        answerBool = false,
                        listEnumerator = collectionList.getEnumerator();

                    while (listEnumerator.moveNext()) {
                        var oList = listEnumerator.get_current();
                        if (oList.get_title() == listObj.Title) {
                            answerBool = true;
                            break;
                        }
                    }
                    defer.resolve(answerBool);
                }

                function fail(sender, args) {
                    var error = {
                        sender: sender,
                        args: args
                    };
                    defer.reject(error);
                }

                return defer.promise();
            },
            getHostListByTitle: function (listTitle, query) {
                // NOT READY            
                var web, theList, defer = new $.Deferred(),
                    c = newContextInstance();

                web = c.appContextSite.get_web();
                theList = web.get_lists().getByTitle(listObj.Title);
                context.load(theList);
                context.executeQueryAsync(success, fail);

                function success() {
                    var result = theList.get_title() + ' created.';
                    alert(result);
                }

                function fail(sender, args) {
                    alert('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
                }
            },
            addHostListItem: function (listTitle, itemObj) {
                /* example: 
                spyreqs.jsom.addHostListItem("My List", {"Title":"my item", "Score":90}).then(
                    function(itemId) { alert("item was added, id:"+itemId); },
                    function(error) { alert('addHostListItem request failed. ' +  error.args.get_message() + '\n' + error.args.get_stackTrace() ); }
                );  
                */
                var web, theList, theListItem, prop, itemCreateInfo,
                    defer = new $.Deferred(),
                    c = newContextInstance();

                web = c.appContextSite.get_web();
                theList = web.get_lists().getByTitle(listTitle);
                itemCreateInfo = new SP.ListItemCreationInformation();
                theListItem = theList.addItem(itemCreateInfo);
                for (prop in itemObj) {
                    theListItem.set_item(prop, itemObj[prop]);
                }
                theListItem.update();
                c.context.load(theListItem);
                c.context.executeQueryAsync(success, fail);

                function success() {
                    defer.resolve(theListItem.get_id());
                }

                function fail(sender, args) {
                    var error = { sender: sender, args: args };
                    defer.reject(error);
                }

                return defer.promise();
            },
            createHostList: function (listObj) {
                /* syntax example:
					spyreqs.jsom.createHostList({
						"title":app_MainListName,	 
						"url":app_MainListName, 
						"template" : "genericList",
						"description" : "this is a list", 
							fields : [	 
								{"Name":"userId", "Type":"Text", "Required":"true"},
								{"Name":"testId", "Type":"Text", "Required":"True"},	
								{"Name":"courseId", "Type":"Text"}, 
								{"Name":"periodId", "Type":"Text"},
								{"Name":"score", "Type":"Number"}, 
								{"Name":"scoreFinal", "Type":"Number", "hidden":"true"},
								{"Name":"assginedTo", "Type":"User", "Required":"true"},
								{"Name":"dateAssgined", "Type":"DateTime"},
								{"Name":"dateEnded", "Type":"DateTime"},
								{"Name":"canRetry", "Type":"Boolean"},
								{"Name":"state", "Type":"Choice", "choices" : ["rejected", "approved", "passed", "proggress"]},
								{"Name":"comments", "Type":"Note"},
								{"Name":"assginedFrom", "Type":"User"},
								{"Name":"testLink", "Type":"URL"}
							]	 
						})
					.then( ...... )				
					field properties: http://msdn.microsoft.com/en-us/library/office/jj246815.aspx
				*/
                var web, theList, listCreationInfo, template, field,
					defer = new $.Deferred(),
					c = newContextInstance();

                if (typeof listObj.title === 'undefined') {
                    say('createHostList cannot create without .title');
                    return;
                }
                web = c.appContextSite.get_web();
                listCreationInfo = new SP.ListCreationInformation();
                listCreationInfo.set_title(listObj.title);

                if (typeof listObj.url !== 'undefined') { listCreationInfo.set_url(listObj.url); }
                if (typeof listObj.description !== 'undefined') { listCreationInfo.set_description(listObj.description); }

                if (typeof listObj.template === 'undefined') {
                    template = SP.ListTemplateType.genericList;
                } else if (isNaN(listObj.template)) {
                    template = SP.ListTemplateType[listObj.template];
                } else {
                    template = listObj.template;
                }

                listCreationInfo.set_templateType(template);
                //say("list template number: " + template);
                if (typeof listObj.quickLaunchOption !== 'undefined') {
                    // option to show list in quick actions menu
                    listCreationInfo.set_quickLaunchOption(listObj.quickLaunchOption);
                }
                theList = web.get_lists().add(listCreationInfo);
                c.context.load(theList);
                c.context.executeQueryAsync(success, fail);

                function success() {
                    // list created
                    if (listObj.fields) {
                        // start creating fields
                        $.when(jsom.createListFields(c.context, theList, listObj.fields)).then(
							function (data) {
							    // create List Fields finished
							    defer.resolve(listObj);
							},
							function (error) {
							    defer.reject(error);
							}
						);
                    } else {
                        // no fields to create
                        defer.resolve(listObj);
                    }
                }

                function fail(sender, args) {
                    var error = { sender: sender, args: args };
                    defer.reject(error);
                }

                return defer.promise();
            },
            createHostSite: function (webToCreate) {
                // NOT READY
                var web, webCreationInfo, newWeb;

                web = appContextSite.get_web();
                webCreationInfo = new SP.WebCreationInformation();
                webCreationInfo.set_title(webToCreate.Title);
                webCreationInfo.set_webTemplate(webToCreate.Template);
                webCreationInfo.set_url(webToCreate.Url);
                webCreationInfo.set_language(webToCreate.language);
                webCreationInfo.set_useSamePermissionsAsParentSite(webToCreate.inheritPerms);
                newWeb = web.get_webs().add(webCreationInfo);

                context.load(newWeb);
                context.executeQueryAsync(success, fail);

                function success() {
                    var result = newWeb.get_title() + ' created.';
                    alert(result);
                }

                function fail(sender, args) {
                    alert('Request failed. ' + args.get_message() +
                        '\n' + args.get_stackTrace());
                }
            }
        },
        utils: {
            urlParamsObj: urlParamsObj,
            say: say
        }
    };

    // liberate scope...
    window.spyreqs = spyreqs;
}(window));
