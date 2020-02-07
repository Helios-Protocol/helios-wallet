$(document).ready(function(){
    var username = sessionStorage.getItem("username");
    var password = sessionStorage.getItem("password");
    if(username == null && password == null){
        window.location.href = './login.html';
    }
    $("#lusername").text(username);
    var keystores = sessionStorage.getItem("online_keystores");
    populateOnlineKeystores($.parseJSON(keystores), password);
    sessionStorage.setItem("online_keystores", keystores);
    afterLoginInit();
    
    $(".netselect").find("a").click(function(){
        var selected_network_id = $(this).data("id");
        var selectedtext = $(this).text();
        $(".networkidselect").text(selectedtext);
        if(connectionMaintainer.networkId !== selected_network_id){
            set_connection_status("Connecting to network with id "+selected_network_id, false)
            connectionMaintainer.setNetworkIdAndReconnect(parseInt(selected_network_id));
        }
    })
    
   
    $('#send_transaction_advanced_options_link').click(function(){
        if($(this).hasClass('active')){
            //$('#send_transaction_advanced_options_container').hide();
            $(this).removeClass('active');
            $("#send_block_pre_confirmation").removeClass("form2bind_opem");
            $('#send_block_submit').text("Send")
            //$('.send_block_submit').attr("id","send_block_submit");
            //Need to clear any transactions they may have added
            clear_vars();
        }else{
            //$('#send_transaction_advanced_options_container').show();
            $(this).addClass('active');
            $("#send_block_pre_confirmation").addClass("form2bind_opem");
            $('#send_block_submit').text("Send Block With Transactions in List");
        }
    });
    $('#add_transaction_form').submit(function (e) {
        e.preventDefault();
        if (sending_account == null) {
            $('#error_status').text('Need to load a wallet first')
            return
        }
        add_transaction_to_block_from_form();
    })
    $('#send_block_pre_confirmation').submit(function (e) {
        
        e.preventDefault();
        if (sending_account == null) {
            alertify.error('Need to load a wallet first.');
            return
        }
        if(!connectionMaintainer.isConnected()){
            alertify.error('Need to be connected to a node to do this.');
            return
        }

        var is_advanced = $('#send_transaction_advanced_options_link').hasClass('active');

        if (!is_advanced) {
            //need to add the transaction first
            //the non advanced mode is only 1 tx. so lets clear any that might be sitting in the block from a previously cancelled attempt
            pending_send_transactions = [];
            if (!add_transaction_to_block_from_form()) {
                return false;
            }
        }

        if(pending_send_transactions === null || pending_send_transactions === undefined || pending_send_transactions.length == 0){
            alertify.error("You need to have at least one transaction to do this.");
            return;
        }

        if(getSumPendingTransactionsCost().gt(web3.utils.toBN(current_hls_balance_in_wei))){
            var required_cost = web3.utils.fromWei(web3.utils.toBN(getSumPendingTransactionsCost()), 'ether').toString();
            var hls_balance = web3.utils.fromWei(web3.utils.toBN(current_hls_balance_in_wei), 'ether').toString();
            alertify.error("You don't have enough HLS to cover the transactions and fees. " +
                "You have a balance of "+hls_balance+" But the transactions and fees add up to "+required_cost +
                "<br><br>If your balance is incorrect, try sending it again in a few moments.");
            return;
        }

        if(!checkPendingTransactionsGasPrice()){
            alertify.error("One or more of your transactions does not meet the minimum gas price requirement. " +
                "The current minimum allowed gas price is "+current_min_gas_price);
            return;
        }
        if(!checkBlockGasLimit()){
            alertify.error("Your transactions require more gas than the block gas limit. " +
                "Reduce the number of transactions in this block before sending again. " +
                "The block gas limit is "+numerical.block_gas_limit);
            return;
        }
        if(!checkIntrinsicGas()){
            alertify.error("One or more of your transactions do not have a gas limit high enough. " +
                "The minimum gas required to send a transaction is 21000.")
        }

        if(pending_send_transactions.length === 0){
            alertify.error("You must add at least one transaction to the block.");
        }

        //var popup_content = document.getElementById("popup_content_confirm_transactions").innerHTML;

        //ensure correct
        alertify.error( "Please confirm your transactions in this list below and click send.");
        refresh_pending_transaction_table('final_tx_list_for_confirmation', false);

    });

    $('body').on('click', '.delete_transaction', function () {
        var index = $(this).data('index');
        pending_send_transactions.splice(index, 1);
        refresh_pending_transaction_table()
    });

    
    //contact list
    $('#add_contact_form').submit(function (e) {
        e.preventDefault();
        
        var contact_name = $("#add_contact_form_name").val();
        var contact_address = $("#add_contact_form_address").val();
        if(!(validateInputs(contact_name, 'contact_name') === true)){
            alertify.error(validateInputs(contact_name, 'contact_name'));
            return;
        }
        if(!(validateInputs(contact_address, 'wallet_address') === true)){
            alertify.error(validateInputs(contact_address, 'wallet_address'));
            return;
        }
        // console.log(contact_name);
        // console.log(contact_address);
        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.addContact(contact_name, contact_address)
        .then(function(response){
            //console.log(response);
            if(response !== false && "success" in response) {
                $("#add_contact_form_name").val('');
                $("#add_contact_form_address").val('');
                refreshContactList();
                alertify.success("New contact added successfully.");
            }else{
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                alertify.error(popup_content);
            }
        });

    });
    $('#modal-contact-remove-wallet-success , #modal-contact-remove-wallet-failed').on('hidden.bs.modal', function () {
        location.reload();
       })
    //
});
async function populateOnlineKeystores(keystores, password){
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
    $(".contact_div").remove();
    server.getContacts()
    .then(function(response){
        if(response !== false && "success" in response) {
            //console.log(response['contacts'].length);
            var contacts = response['contacts'];
            var html = '';
            contact_name_to_address_lookup = {};
            contact_address_to_name_lookup = {};
            contact_autocomplete_list = [];
            for(i=0; i < response['contacts'].length; i++){
                
                html +=  '<div class="d-flex contact_div">';
                html +=  '<div class="contact_table_1 align-self-center">';
                html +=  '<p class="mb-0 mr-2">'+contacts[i]['name']+'</p>';
                html +=  '</div>';
                html +=  '<div class="contact_table_2 align-self-center">';
                html +=  ' <p class="mb-0 mr-2">'+contacts[i]['address']+'</p>';
                html +=  '</div>';
                html +=  '<div class="contact_table_3">';
                html +=  '<button class="btn btn-contact-remove btn-rounded" id="delete_contact" data-toggle="modal" data-target="#modal-remove-contact-wallet" data-id="'+contacts[i]['id']+'" data-name="'+contacts[i]['name']+'" data-address="'+contacts[i]['address']+'" >Remove <i class="uil uil-trash-alt ml-1"></i></button>';
                html +=  '</div>';
                html +=  '</div>';
                contact_name_to_address_lookup[contacts[i]['name']] = contacts[i]['address'];
                contact_address_to_name_lookup[contacts[i]['address']] = contacts[i]['name'];
                var autocomplete_entry = contacts[i]['name'] + " <" + contacts[i]['address'] + ">";
                contact_autocomplete_list.push(autocomplete_entry);
                contact_autocomplete_list_to_address_lookup[autocomplete_entry] = contacts[i]['address'];
                
            }
            $( html ).insertAfter( ".contact_head" );
            return true;
        }
    });

    // var tableRef = $('#contact_list').find('tbody')[0];

    // server.getContacts()
    // .then(function(response){
    //     if(response !== false && "success" in response) {
    //         //clear all rows
    //         tableRef.innerHTML = "";
    //         contact_name_to_address_lookup = {};
    //         contact_address_to_name_lookup = {};
    //         contact_autocomplete_list = [];
    //         var contacts = response['contacts'];
    //         for (i = 0; i < contacts.length; i++) {
    //             var row = tableRef.insertRow(tableRef.rows.length);
    //             var cell0 = row.insertCell(0);
    //             var cell1 = row.insertCell(1);

    //             cell0.innerHTML = "<img src='dist/assets/icon/x.png' class='delete_contact' data-id=" + contacts[i]['id'] + ">"+ contacts[i]['name'];
    //             cell1.innerHTML = contacts[i]['address'];

    //             contact_name_to_address_lookup[contacts[i]['name']] = contacts[i]['address'];
    //             contact_address_to_name_lookup[contacts[i]['address']] = contacts[i]['name'];
    //             var autocomplete_entry = contacts[i]['name'] + " <" + contacts[i]['address'] + ">";
    //             contact_autocomplete_list.push(autocomplete_entry);
    //             contact_autocomplete_list_to_address_lookup[autocomplete_entry] = contacts[i]['address'];
    //         }
    //         autocomplete(document.getElementById("input_to"), contact_autocomplete_list);
    //         return true;
    //     }
    // });

}
$('body').on('click', '.delete_id', function(e) {
    var contact_id = $(this).data('id');
    //Need to sign in to confirm their username and password is correct before encrypting the keystore.
    server.deleteContact(contact_id)
    .then(function(response){
        if(response !== false && "success" in response) {
            $('#modal-remove-contact-wallet').modal('hide');
            $("#modal-contact-remove-wallet-success").modal("toggle");
            refreshContactList();
            //popup("Contact deleted successfully.");
        }else{
            $('#modal-remove-contact-wallet').modal('hide');
            $("#modal-contact-remove-wallet-failed").modal("toggle");

            var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
            //popup(popup_content, 500);
        }
    });
});
$('body').on('click',".btn-contact-remove",function(){
    var name = $(this).data('name');
    var address = $(this).data('address');
    $(".delete_modal_content #contact_name").text(name);
    $(".delete_modal_content #contact_address").text(address);
    $(".delete_id").attr("data-id",$(this).data('id'));
});


var set_balance_status = function(status){
    $('#h-balance').text(status);
    $('.h-balance').text(status);
}

var set_connection_status = function(status, connected){
    if(connected){
        $('#connection_status_icon').attr('src', 'dist/assets/icon/node.png');
    }else{
        $('#connection_status_icon').attr('src', 'dist/assets/icon/x.png');
    }
    $('#connection_status').text(status);
}
var set_min_gas_price_status = function(status){
    $('#min_gas_price_status').text(status);
    calculate_estimated_tx_fee_loop()
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
function calculate_estimated_tx_fee_loop(){
    var gas_price = web3.utils.toWei($('#input_gas_price').val(), 'gwei')
    gas_price = parseFloat(web3.utils.fromWei(web3.utils.toBN(gas_price), 'ether'));
    var tx_amount = $('#input_amount').val();
    var estimated_fee = Math.round(21000*gas_price*10000000)/10000000;
    if(!isNaN(parseFloat(tx_amount)) && isFinite(tx_amount)){
        var estimated_fee_percentage = Math.round(estimated_fee/tx_amount*100000)/100000*100;
    }else{
        var estimated_fee_percentage = 0;
    }
    $('.fee_estimation').text("Estimated fee per tx: "+estimated_fee+" or "+estimated_fee_percentage+"%")
    setTimeout(calculate_estimated_tx_fee_loop, 1000);
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
function getSumPendingTransactionsCost(){
    var total_amount = web3.utils.toBN(0);
    pending_send_transactions.forEach(function(tx){
        var gas_cost = web3.utils.toBN(tx.gas).mul(web3.utils.toBN(tx.gasPrice))
        total_amount = total_amount.add(web3.utils.toBN(tx.value)).add(web3.utils.toBN(gas_cost))
    });
    return total_amount;
}
var pending_send_transactions = [];
function add_transaction_to_block_from_form(){

    var amount =$('#input_amount').val();
    var to = $('#input_to').val();

    to = getAddressFromAutocompleteStringIfExist(to);

    var gas_price =$('#input_gas_price').val();
    var total_gas = parseInt($('#input_total_gas').val());

    if(!(validateInputs(amount, 'tx_amount') === true)){
        alertify.error(validateInputs(amount, 'tx_amount'));
        return false;
    }
    if(!(validateInputs(gas_price, 'gas_price') === true)){
        alertify.error(validateInputs(gas_price, 'gas_price'));
        return false;
    }
    if(!(validateInputs(total_gas, 'total_gas') === true)){
        alertify.error(validateInputs(total_gas, 'total_gas'));
        return false;
    }

    if(!(validateInputs(to, 'wallet_address') === true)){
        alertify.error(validateInputs(to, 'wallet_address'));
        return false;
    }

    amount = web3.utils.toWei(amount.toString(), 'ether');
    gas_price = web3.utils.toWei(gas_price.toString(), 'gwei');

    var transaction = {
                    from: sending_account.address,
                    to: to,
                    value: amount,
                    gas: total_gas.toString(),
                    gasPrice: gas_price,
                }

    pending_send_transactions.push(transaction);

    refresh_pending_transaction_table();

    $('#input_amount').val("").trigger("change");
    $('#input_to').val("").trigger("change");
    //updateInputLabels();
   // console.log(pending_send_transactions);
    return true;

}
function getAutocompleteStringFromAddressIfExist(address){
    if(address in contact_address_to_name_lookup){
        return contact_address_to_name_lookup[address] + " <" + address + ">";
    }else{
        return address
    }
}
function refresh_pending_transaction_table(table_id, include_delete_button){
    if(table_id === undefined){
        table_id = "multiple_transaction_list";
    }
    if(include_delete_button === undefined){
        include_delete_button = true;
    }

    var tableRef = document.getElementById(table_id).getElementsByTagName('tbody')[0];

    //clear all rows
    tableRef.innerHTML = "";

    for (var i = 0; i < pending_send_transactions.length; i++) {
        var transaction = pending_send_transactions[i];
        var index = i;
        var to_shortened = getAutocompleteStringFromAddressIfExist(transaction.to);
        var amount_shortened = numerical.roundD(parseFloat(web3.utils.fromWei(transaction.value, 'ether')), 10);

        var row = tableRef.insertRow(tableRef.rows.length);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        if(include_delete_button){
            cell1.innerHTML = "<img src='dist/assets/icon/x.png' class='delete_transaction pr-1' style='width: 4%;' data-index=" + index + ">"+to_shortened;
        }else{
            cell1.innerHTML = to_shortened;
        }

        cell2.innerHTML = amount_shortened;
        cell3.innerHTML = web3.utils.fromWei(transaction.gasPrice, 'gwei'); //show in gwei
        cell4.innerHTML =transaction.gas; //show in wei
    }
}
var clear_vars = function(include_account = false){
    if (include_account){
        deleteAllOnlineWallets();
        deleteAllOfflineWallets();
        sending_account = null;
        available_offline_accounts = {};
        available_online_accounts = {};
        online_wallet_to_id_lookup = {};
        online_wallet_to_name_lookup = {};
    }
    pending_send_transactions = [];
    document.getElementById("multiple_transaction_list").getElementsByTagName('tbody')[0].innerHTML = "";
};
function validateInputs(value, type){
    try {
        switch (type) {
            case "password":
                if (value === undefined || value === '') {
                    return "Password cannot be left blank";
                }
                if (value.length < 16) {
                    return "Password must be at least 16 characters long";
                }
                break;
            case "email":
                if (value === undefined || value === '') {
                    return "Email cannot be left blank";
                }
                if (!validateEmail(value)) {
                    return "Invalid email";
                }
                break;
            case "username":
                if (value === undefined || value === '') {
                    return "Username cannot be left blank";
                }
                break;
            case "wallet_name":
                if (value === undefined || value === '') {
                    return "Wallet name cannot be left blank";
                }
                break;
            case "contact_name":
                if (value === undefined || value === '') {
                    return "Contact name cannot be left blank";
                }
                if (value.length > 50) {
                    return "Contact name can be a maximum of 50 characters in length.";
                }
                break;
            case "wallet_address":
                if (value === undefined || value === '') {
                    return "Wallet address cannot be left blank";
                }
                if (!web3.utils.isAddress(value.toLowerCase())) {
                    if (!(value in contact_autocomplete_list_to_address_lookup)) {
                        return "The given wallet address is not a valid address or contact.";
                    }
                }
                break;
            case "tx_amount":
                if (value === undefined || value === '') {
                    return "Transaction amount cannot be left blank";
                }
                if (Number(value) === value && value % 1 === 0) {
                    //intiger
                    if (!web3.utils.toWei(web3.utils.toBN(value), 'ether').gt(web3.utils.toBN(1))) {
                        return "Transaction amount must be at least 1 wei.";
                    }
                } else {
                    //need to convert to wei
                    value = web3.utils.toWei(value.toString(), 'ether');
                    if (!web3.utils.toWei(web3.utils.toBN(value), 'ether').gt(web3.utils.toBN(1))) {
                        return "Transaction amount must be at least 1 wei.";
                    }
                }


                break;
            case "gas_price":
                if (value === undefined || value === '') {
                    return "Transaction gas price cannot be left blank";
                }
                if (!web3.utils.toWei(web3.utils.toBN(value), 'gwei').gt(web3.utils.toBN(1))) {
                    return "Transaction gas price must be at least 1 wei.";
                }
                break;
            case "total_gas":
                if (value === undefined || value === '') {
                    return "Transaction total gas cannot be left blank";
                }
                if (!Number.isInteger(value)) {
                    return "Transaction total gas must be an integer";
                }
                break;
            case "two_factor_code":
                if (value.trim().length > 6) {
                    return "Two factor must be less than 6 characters long.";
                }
                break;
        }
    }catch(err){
        return "An error has occurred: "+err;
    }
    return true;
}

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

function isPrivateKey(privateKey) {
    // check if it has the basic requirements of a private key
    if (!/^(0x)?[0-9a-f]{64}$/i.test(privateKey)) {
        return false;
        // If it's ALL lowercase or ALL upppercase
    }
    return true
}