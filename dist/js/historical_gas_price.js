//
// Contains all website functionality for the historical gas price tab.
//

//
// Jquery router
//

$( document ).ready(function() {
    $('.nav__link').click(function(){

    });

    populateHistoricalMinGasPricePlot();
});

function populateHistoricalMinGasPricePlot(){
    web3.hls.getHistoricalGasPrice()
        .then(function(args){
            var plot_div = document.getElementById("historical_min_gas_plot_div");
            var csv_string = toCSV(args)
            var g = new Dygraph(plot_div, csv_string);
        })
}