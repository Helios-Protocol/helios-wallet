function toCSV(data){

    var lineArray = [];
    data.forEach(function (infoArray, index) {
        var line = infoArray.join(",");
        lineArray.push(line);
    });
    var csvContent = lineArray.join("\n");
    return csvContent;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var clear_vars = function(include_account = false){
    if (include_account){
        sending_account = null;
    }
    pending_send_transactions = [];
    document.getElementById("multiple_transaction_list").getElementsByTagName('tbody')[0].innerHTML = "";
}

function round_d(val, decimal_places){
    if(decimal_places == undefined){
        decimal_places = 0;
    }
    if(decimal_places < 0){
        decimal_places = 0;
    }
    return Math.round(val*(Math.pow(10,(decimal_places+1))))/Math.pow(10,(decimal_places+1))

}



function wei_to_gwei(number){
    return number/1000000000;
}
function gwei_to_wei(number){
    return number*1000000000;
}
function wei_to_hls(number){
    return number/Math.pow(10,18);
}
function hls_to_wei(number){
    return number*Math.pow(10,18);
}
function gwei_to_hls(number){
    return wei_to_hls(gwei_to_wei(number));
}
