
$(document).ready(function(){
    web3 = helios_web3;
    $(".btnreg").on("click", function (e) {
        e.preventDefault();
        var username = $(".username").val();
        var email = $(".email").val();
        var password = $(".password").val();
        var cpassword = $(".cpassword").val();
        if(username == ""){
            alertify.error("Username cannot be left blank.");
        }else  if(email == ""){
            alertify.error("Email cannot be left blank.");
        }else if(password == ""){
            alertify.error("Password cannot be left blank.");
        }else if(password !== cpassword){
            alertify.error("Confirm Password does not match password.");
        }else{
            var new_wallet = web3.eth.accounts.create();
            var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, password);
            server.newUser(username, email, password, keystore)
                .then(function(response){
                if(response !== false && "success" in response) {
                    server.signIn(username, password)
                    .then(function(response){
                        if(response !== false && "success" in response) {
                            sessionStorage.setItem("username", username);
                            sessionStorage.setItem("password", password);
                            var online_keystores = response['keystores'];
                            sessionStorage.setItem("online_keystores", online_keystores);
                            window.location.href = "./dashboard.html";
                        }else{
                            if(response.error == "4000" && response.error_description == "Two factor authentication code mismatch."){
                                sessionStorage.setItem("username", $scope.username);
                                sessionStorage.setItem("password", $scope.password);
                                window.location.href = "./2fa.html";
                            }else if(response.error_description != ""){
                                $scope.user.username = '';
                                $scope.user.password = '';
                                alertify.error(response.error_description);
                            }else{
                                alertify.error("HTTP Request Error");
                            }
                        }
                    });

                }else{
                    if(response.error == "4000" && response.error_description == "Two factor authentication code mismatch."){
                        sessionStorage.setItem("username", $scope.username);
                        sessionStorage.setItem("password", $scope.password);
                        window.location.href = "./2fa.html";
                    }else if(response.error_description){
                        $(".username").val("");
                        $(".email").val("");
                        $(".password").val("");
                        $(".cpassword").val("");
                        alertify.error(response.error_description);
                        
                    }else{
                        alertify.error("HTTP Request Error");
                    }
                }
            });
          
        }
    });
    $("#btnlogin").on("click", function (e) {
        e.preventDefault();
        var username = $(".username").val();
        var password = $(".password").val();
        if(username == ""){
            alertify.error("Username cannot be left blank.");
        }else if(password == ""){
            alertify.error("Password cannot be left blank.");
        }else{
            server.signIn(username, password, "")
            .then(function (response) {
                if (response !== false && "success" in response) {
                    sessionStorage.setItem("username", username);
                    sessionStorage.setItem("password", password);
                    var keystores = JSON.stringify(response['keystores']);
                    sessionStorage.setItem("online_keystores", keystores);
                    window.location.href = "./dashboard.html";
                } else {
                    if (response.error == "4000" && response.error_description == "Two factor authentication code mismatch.") {
                        sessionStorage.setItem("username", username);
                        sessionStorage.setItem("password", password);
                        window.location.href = "./2fa.html";
                    } else if (response.error_description == "Invalid username or password.") {
                        $(".username").val('');
                        $(".password").val('');
                        alertify.error(response.error_description);
                    } else {
                        alertify.error("HTTP Request Error");
                    }

                }
            });
        }
    });
    $(".2fa").on("click", function (e) {
        e.preventDefault();
        var facode = $(".facode").val();
        var username = sessionStorage.getItem("username");
        var password = sessionStorage.getItem("password");
        if(facode == ""){
            alertify.error("2FA code cannot be left blank.");
        }else if(username == ""){
            alertify.error("Username cannot be left blank.");
        }else if(password == ""){
            alertify.error("Password cannot be left blank.");
        }else{
            server.signIn(username, password, facode)
            .then(function(response){
                if(response !== false && "success" in response) {
                    sessionStorage.setItem("username", username);
                    sessionStorage.setItem("password", password);
                    var keystores = JSON.stringify(response['keystores']);
                    sessionStorage.setItem("online_keystores", keystores);
                    window.location.href = "./dashboard.html";
                }else{
                    if(response.error == "4000" && response.error_description == "Two factor authentication code mismatch."){
                        $(".facode").val('');
                        alertify.error(response.error_description);
                    }else  if(response.error == "2010" && response.error_description == "Invalid username or password."){
                        $(".facode").val('');
                        alertify.error(response.error_description);
                    }else{
                        alertify.error("HTTP Request Error");
                    }
                    
                }
            });
        }
    });
    $("#logout").on("click", function () {
        window.location.href = "./login.html";
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("password");
        sessionStorage.removeItem("online_keystores");
    });
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
            // console.log(response);
            if(response !== false && "success" in response) {
               //refreshContactList();
                alertify.error("New contact added successfully.");
            }else{
                var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
                alertify.error(popup_content);
            }
        });

    });
});


