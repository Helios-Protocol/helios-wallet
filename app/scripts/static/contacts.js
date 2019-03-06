$( document ).ready(function() {

    $('#add_contact_form').submit(function (e) {
        e.preventDefault();
        loaderPopup();
        var contact_name = $("#add_contact_form_name").val();
        var contact_address = $("#add_contact_form_address").val();
        if(!(validateInputs(contact_name, 'contact_name') === true)){
            popup(validateInputs(contact_name, 'contact_name'));
            return;
        }
        if(!(validateInputs(contact_address, 'wallet_address') === true)){
            popup(validateInputs(contact_address, 'wallet_address'));
            return;
        }

        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.addContact(contact_name, contact_address)
        .then(function(response){
            if(response !== false && "success" in response) {
                refreshContactList();
                popup("New contact added successfully.");
            }else{
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                popup(popup_content, 500);
            }
        });

    });

    $('body').on('click', '.delete_contact', function(e) {
        var contact_id = $(this).data('id');
        //Need to sign in to confirm their username and password is correct before encrypting the keystore.
        server.deleteContact(contact_id)
        .then(function(response){
            if(response !== false && "success" in response) {
                refreshContactList();
                popup("Contact deleted successfully.");
            }else{
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                popup(popup_content, 500);
            }
        });
    });
});

async function refreshContactList(){

    var tableRef = document.getElementById('contact_list').getElementsByTagName('tbody')[0];

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

function getAutocompleteStringFromAddressIfExist(address){
    if(address in contact_address_to_name_lookup){
        return contact_address_to_name_lookup[address] + " <" + address + ">";
    }else{
        return address
    }
}
