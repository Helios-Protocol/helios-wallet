$( document ).ready(function() {

    // Check for existing session and just refresh it
    var session_hash = getCookie('session_hash');
    console.log("SESSION HASH");
    console.log(session_hash);

    $('body').on('click', '#frontpage_sign_in_submit', function(e) {
        var username = $('#input_sign_in_username').val();
        var password = $('#input_sign_in_password').val();
        server.signIn(username, password)
        .then(function(response){
            if(response != false && "success" in response) {
                //success
                set_username_status(username);
                switchToPage('#main_page');
            }else{
                //fail
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                popup(popup_content, 500);
            }
        });
    });

    $('body').on('click', '#frontpage_new_user_submit', function(e) {
        var username = $('#input_new_user_username').val();
        var email = $('#input_email_username').val();
        var password = $('#input_new_user_password').val();

        var new_wallet = web3.eth.accounts.create();
        var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);

        server.newUser(username, email, password, keystore)
        .then(function(response){
            if(response != false && "success" in response) {
                //success
                var popup_content = "Worked" + JSON.stringify(response);
                popup(popup_content, 500);
            }else{
                //fail
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                popup(popup_content, 500);
            }
        });
    });




});