function toCSV(data){
    var lineArray = [];
    data.forEach(function (infoArray, index) {
        var line = infoArray.join(",");
        lineArray.push(line);
    });
    return lineArray.join("\n");
}



var clear_vars = function(include_account = false){
    if (include_account){
        sending_account = null;
    }
    pending_send_transactions = [];
    document.getElementById("multiple_transaction_list").getElementsByTagName('tbody')[0].innerHTML = "";
};


function getCookie(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    }
    else
    {
        begin += 2;
        var end = document.cookie.indexOf(";", begin);
        if (end == -1) {
        end = dc.length;
        }
    }
    // because unescape has been deprecated, replaced with decodeURI
    //return unescape(dc.substring(begin + prefix.length, end));
    return decodeURI(dc.substring(begin + prefix.length, end));
}