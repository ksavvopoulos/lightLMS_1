
var watchDog = [],
    appUrl = "https://inedua2-b3e1806762af10.sharepoint.com/sites/GP_dev/napa/lightLMS_1/Pages/Default.aspx?SPHostUrl=https%3A%2F%2Finedua2%2Esharepoint%2Ecom%2Fsites%2FGP_dev%2Fnapa&SPAppWebUrl=https%3A%2F%2Finedua2-b3e1806762af10%2Esharepoint%2Ecom%2Fsites%2FGP_dev%2Fnapa%2FlightLMS_1",
    watchUrl = "__inedu__";

XMLHttpRequest.prototype.uniqueID = function () {
    if (!this.uniqueIDMemo) {
        this.uniqueIDMemo = Math.floor(Math.random() * 1000);
    }
    return this.uniqueIDMemo;
};

XMLHttpRequest.prototype.oldOpen = XMLHttpRequest.prototype.open;
var newOpen = function (method, url, async, user, password) {
    this.oldOpen(method, url, async, user, password);
    if (url === watchUrl) {
        watchDog.push(this.uniqueID());
    }
};

XMLHttpRequest.prototype.open = newOpen;

XMLHttpRequest.prototype.oldSend = XMLHttpRequest.prototype.send;

var newSend = function (postBody) {
    var xhr = this; h_log("[" + xhr.uniqueID() + "] intercepted send (" + postBody + ")");
    var onload = function () {
        h_log("[" + xhr.uniqueID() + "] intercepted load: " + xhr.status + " " + xhr.responseText);
    };
    var onerror = function () {
        h_log("[" + xhr.uniqueID() + "] intercepted error: " + xhr.status);
    };
    xhr.addEventListener("load", onload, false);
    xhr.addEventListener("error", onerror, false);
    if (watchDog.indexOf(xhr.uniqueID()) > -1) {
        postBody = buildQueryString(postBody, 'rt', watchUrl);
        postBody = buildQueryString(postBody, 'dr', watchUrl);
        h_log(postBody);
        window.location.href = appUrl + "&action=sd&" + postBody;
    } else { xhr.oldSend(postBody); }
};

XMLHttpRequest.prototype.send = newSend;

function buildQueryString(str, param, val) {
    var ind = -1, attached = '';
    var param_array = str.substring(ind + 1).split('&');
    var params = {};
    var theLength = param_array.length;
    for (var i = 0; i < theLength; i++) {
        var x = param_array[i].toString().split('='); params[x[0]] = x[1];
    }
    params[param] = val;
    for (var key in params) {
        attached += key + "=" + params[key] + "&";
    }
    attached = attached.substr(0, attached.length - 1);

    return String(str.substr(0, ind) + attached);
}

function h_log(what) { console.log(what); }
