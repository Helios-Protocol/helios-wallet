$( document ).ready(function() {

    $('body').on('click', '#frontpage_sign_in_submit', function(e) {
        var username = $('#input_sign_in_username').val();
        var password = $('#input_sign_in_password').val();
        if(!(validateInputs(username, 'username') === true)){
            popup(validateInputs(username, 'username'));
            return;
        }

        loaderPopup();
        server.signIn(username, password)
        .then(function(response){
            if(response !== false && "success" in response) {
                //success
                set_username_status(username);
                var online_keystores = response['keystores'];
                populateOnlineKeystores(online_keystores, password);
                close_popup();
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
        var password_repeat = $('#input_new_user_password_repeat').val();

        if(!(validateInputs(username, 'username') === true)){
            popup(validateInputs(username, 'username'));
            return;
        }
        if(!(validateInputs(password, 'password') === true)){
            popup(validateInputs(username, 'password'));
            return;
        }
        if(password != password_repeat){
            popup("The two passwords must match");
            return;
        }

        var new_wallet = web3.eth.accounts.create();
        var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);

        server.newUser(username, email, password, keystore)
        .then(function(response){
            if(response !== false && "success" in response) {
                //success
                popup("Your account has been created successfully.<br> You are now logged into your new account.<br><br> Enjoy! :)")
                server.signIn(username, password)
                    .then(function(response){
                        if(response !== false && "success" in response) {
                            //success
                            set_username_status(username);
                            refreshOnlineWallets()
                            .then(function(){
                                switchToPage('#main_page');
                            });
                        }else{
                            //fail
                            var popup_content = "Sign in to begin using your new account!<br><br> Enjoy! :)";
                            popup(popup_content, 500);
                        }
                    });
            }else{
                //fail
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                popup(popup_content, 500);
            }
        });
    });




});