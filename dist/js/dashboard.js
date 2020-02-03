$(document).ready(function(){
    var username = sessionStorage.getItem("username");
    var password = sessionStorage.getItem("password");
    if(username == null && password == null){
        window.location.href = './login.html';
    }
    $("#lusername").text(username);
    var keystores = sessionStorage.getItem("online_keystores");
    console.log(JSON.stringify(keystores));
    //keystores = JSON.stringify(keystores);
    populateOnlineKeystores($.parseJSON(keystores), password);
    sessionStorage.setItem("online_keystores", keystores);
    afterLoginInit();
    //refreshDashboard();
    $(".netselect").find("a").click(function(){
        var selected_network_id = $(this).data("id");
        var selectedtext = $(this).text();
        $(".networkidselect").text(selectedtext);
        if(connectionMaintainer.networkId !== selected_network_id){
            //console.log("changing network id to "+selected_network_id);
            set_connection_status("Connecting to network with id "+selected_network_id, false)
            connectionMaintainer.setNetworkIdAndReconnect(parseInt(selected_network_id));
        }
    })
});
async function populateOnlineKeystores(keystores, password){
    //console.log(keystores);
    //console.log(keystores.length);
    if(keystores.length > 0){
        for(var i = 0; i < keystores.length; i++){
            var keystore = keystores[i]['keystore'];
            var wallet_id = keystores[i]['id'];
            var wallet_name = keystores[i]['name'];
            var new_wallet = web3.eth.accounts.decrypt(JSON.parse(keystore), password);
            if(i === 0) {
                addOnlineWallet(new_wallet, wallet_id, wallet_name);
            }else{
                addOnlineWallet(new_wallet, wallet_id, wallet_name, true);
            }
        }
        return true
    }
}
function addOnlineWallet(new_wallet, wallet_id, wallet_name, do_not_make_active_account){
    web3.hls.accounts.wallet.add(new_wallet);
    available_online_accounts[new_wallet.address] = new_wallet;
    online_wallet_to_id_lookup[new_wallet.address] = wallet_id;
    online_wallet_to_name_lookup[new_wallet.address] = wallet_name;
    if(!(do_not_make_active_account === true)) {
        sending_account = new_wallet;
        refreshDashboard();
    }

    var wallet_name_short = wallet_name.substr(0,25);
    if(wallet_name.length > 25){
        wallet_name_short = wallet_name_short + "...";
    }

    //Now add it to the menu
    // var wallet_menu_item = " <li role=\"presentation\" class=\"nav__item\">\n" +
    //     "                            <a href='#main_page-online_wallet' id='main_page-online_wallet-menu_item' class='nav__link edit_online_wallet' data-address='"+new_wallet.address+"'>\n" +
    //     "                                <div class='wallet_menu_item'>\n" +
    //     "                                     <div class='wallet_menu_item_name'>"+wallet_name_short+"</div><img class='switch_wallet_link' data-address='"+new_wallet.address+"' src='images/use_button.png'>\n" +
    //     "                                </div>\n" +
    //     "                            </a>\n" +
    //     "                        </li>"
    // $('#online_wallets_menu_list').prepend(wallet_menu_item);
}


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
var set_balance_status = function(status){
    $('#h-balance').text(status);
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
        $("#hls-name").text(name);
        $('#account_status').val(address);
    }else{
        $("#hls-name").text(name);
        $('#account_status').val(address);
    }

    // if(web3 !== undefined && address !== undefined && web3.utils.isAddress(address.toLowerCase())){
    //     $('.sending_account_copy').show().data('copy', address);
    // }else{
    //     $('.sending_account_copy').hide().data('copy', '');
    // }
   
}

async function receiveAnyIncomingTransactions(wallet_address, notify_if_none){
    //console.log("Getting receivable transactions")
    return web3.hls.getReceivableTransactions(wallet_address)
    .then(function (receivableTxs) {
        //console.log('Finished getting receivable transactions')
        if (receivableTxs.length > 0) {
            return sendRewardBlock(wallet_address)
            .then(function (res) {
                popup("You have received new transactions!");
                return true;
            });
        }else {
            if(notify_if_none) {
                popup("There are no new incoming transactions");
            }
            return false;
        }
    });
}

function getAddressFromAutocompleteStringIfExist(autocomplete_string){
    if(!web3.utils.isAddress(autocomplete_string)){
        if(autocomplete_string in contact_autocomplete_list_to_address_lookup){
            return contact_autocomplete_list_to_address_lookup[autocomplete_string];
        }
    }
    return autocomplete_string;
}