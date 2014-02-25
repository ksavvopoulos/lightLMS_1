XMLHttpRequest.prototype.oldSend = XMLHttpRequest.prototype.send;
var newSend = function (postBody) {
    var xhr = this;
    var onload = function () {
        h_log('intercepted repsonse: ' + xhr.status + ' - ' + xhr.responseText);
    };
    var onerror = function () {
        h_log('intercepted response error: ' + xhr.status);
    };
    xhr.addEventListener('load', onload, false);
    xhr.addEventListener('error', onerror, false);
    // clear rt and dr values cause they are large xmls...
    postBody = buildQueryString(postBody, 'rt', '-');
    postBody = buildQueryString(postBody, 'dr', '-');
    h_log("queryString created:" + postBody);

    // redirectUrl is added as code by app custom action in register.js
    // redirectUrl has already host & app Url & action params
    window.open(redirectUrl + '&' + postBody, '_blank');
    // HERE we must return a fake 'ok' response
    // we won't allow this original send
    // xhr.oldSend(postBody); 	
};
XMLHttpRequest.prototype.send = newSend;

function buildQueryString(str, param, val) {
    var ind = -1, attached = '',
        param_array = str.substring(ind + 1).split('&'),
        params = {},
        theLength = param_array.length;

    for (var i = 0; i < theLength; i++) {
        var x = param_array[i].toString().split('=');
        params[x[0]] = x[1];
    }
    params[param] = val;
    for (var key in params) {
        attached += key + '=' + params[key] + '&';
    }
    attached = attached.substr(0, attached.length - 1);
    return String(str.substr(0, ind) + attached);
}

function h_log(what) { console.log(what); }