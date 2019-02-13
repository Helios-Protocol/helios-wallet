
var weiToGwei = function wei_to_gwei(number){
    return number/1000000000;
};
var gweiToWei = function gwei_to_wei(number){
    return number*1000000000;
};
var weiToHls = function wei_to_hls(number){
    return number/Math.pow(10,18);
};
var hlsToWei = function hls_to_wei(number){
    return number*Math.pow(10,18);
};
var gweiToHls = function gwei_to_hls(number){
    return weiToHls(gweiToWei(number));
};
var roundD = function roundD(val, decimal_places){
    if(decimal_places === undefined){
        decimal_places = 0;
    }
    if(decimal_places < 0){
        decimal_places = 0;
    }
    return val.toFixed(decimal_places)
    //return Math.round(val*(Math.pow(10,(decimal_places+1))))/Math.pow(10,(decimal_places+1))
}

module.exports = {
    weiToGwei: weiToGwei,
    gweiToWei: gweiToWei,
    weiToHls: weiToHls,
    hlsToWei: hlsToWei,
    gweiToHls: gweiToHls,
    roundD: roundD
};