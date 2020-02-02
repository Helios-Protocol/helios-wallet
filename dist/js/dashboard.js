$(document).ready(function(){
    var username = sessionStorage.getItem("username");
    var password = sessionStorage.getItem("password");
    if(username == null && password == null){
        window.location.href = './login.html';
    }
    afterLoginInit();
    refreshDashboard();
    // $('#network_id_select').on('click',function(){
    //     var selected_network_id = $('select.network_id').children("option:selected").val();
      //  var selected_network_id = $('select.network_id').children("option:selected").val();
    //     if(connectionMaintainer.networkId !== selected_network_id){
    //         //console.log("changing network id to "+selected_network_id);
            //  set_connection_status("Connecting to network with id 1", false)
            //  connectionMaintainer.setNetworkIdAndReconnect(parseInt(1));
    //     }
    // });

    $(".netselect").find("a").click(function(){
        var selected_network_id = $(this).data("id");
        var selectedtext = $(this).text();
        $(".networkidselect").text(selectedtext);
        if(connectionMaintainer.networkId !== selected_network_id){
            ////console.log("changing network id to "+selected_network_id);
            set_connection_status("Connecting to network with id "+selected_network_id, false)
            connectionMaintainer.setNetworkIdAndReconnect(parseInt(selected_network_id));
        }
    })
});
async function refreshContactList(){

    var tableRef = $('#contact_list').find('tbody')[0];

    server.getContacts()
    .then(function(response){
        if(response !== false && "success" in response) {
            //clear all rows
            tableRef.innerHTML = "";
            contact_name_to_address_lookup = {};
            contact_address_to_name_lookup = {};
            contact_autocomplete_list = [];
            var contacts = response['contacts'];
            for (i = 0; i < contacts.length; i++) {
                var row = tableRef.insertRow(tableRef.rows.length);
                var cell0 = row.insertCell(0);
                var cell1 = row.insertCell(1);

                cell0.innerHTML = "<img src='images/x.png' class='delete_contact' data-id=" + contacts[i]['id'] + ">"+ contacts[i]['name'];
                cell1.innerHTML = contacts[i]['address'];

                contact_name_to_address_lookup[contacts[i]['name']] = contacts[i]['address'];
                contact_address_to_name_lookup[contacts[i]['address']] = contacts[i]['name'];
                var autocomplete_entry = contacts[i]['name'] + " <" + contacts[i]['address'] + ">";
                contact_autocomplete_list.push(autocomplete_entry);
                contact_autocomplete_list_to_address_lookup[autocomplete_entry] = contacts[i]['address'];
            }
            autocomplete(document.getElementById("input_to"), contact_autocomplete_list);
            return true;
        }
    });

}


var set_connection_status = function(status, connected){
    if(connected){
        $('#connection_status_icon').attr('src', 'dist/assets/icon/node.png');
    }else{
        $('#connection_status_icon').attr('src', 'dist/assets/icon/x.png');
    }
    $('#connection_status').text(status);
}
var set_account_status = function(address, name){
    if(name === undefined){
        $('#account_status').val(address);
    }else{
        $('#account_status').val(address);
    }

    // if(web3 !== undefined && address !== undefined && web3.utils.isAddress(address.toLowerCase())){
    //     $('.sending_account_copy').show().data('copy', address);
    // }else{
    //     $('.sending_account_copy').hide().data('copy', '');
    // }


}
