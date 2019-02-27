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
        available_offline_accounts = {};
        available_online_accounts = {};
        online_wallet_to_id_lookup = {};
        online_wallet_to_name_lookup = {};
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

function validateInputs(value, type){
    switch(type) {
        case "password":
            if(value === undefined || value === ''){
                return "Password cannot be left blank";
            }
            if(value.length < 16){
                return "Password must be at least 16 characters long";
            }
            break;
        case "email":
            if(value === undefined || value === ''){
                return "Email cannot be left blank";
            }
            if(!validateEmail(value)){
                return "Invalid email";
            }
            break;
        case "username":
            if(value === undefined || value === ''){
                return "Username cannot be left blank";
            }
            break;
        case "wallet_name":
            if(value === undefined || value === ''){
                return "Wallet name cannot be left blank";
            }
            break;
    }
    return true;
}

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}