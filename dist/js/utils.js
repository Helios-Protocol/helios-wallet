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
