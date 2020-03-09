
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
                            sessionStorage.setItem("facode", false);
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
                    sessionStorage.setItem("facode", false);
                    var keystores = JSON.stringify(response['keystores']);
                    storemenu(response['keystores'],password);
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
                    var tfa_enabled = (response['2fa_enabled'] === 'true');
                    sessionStorage.setItem("facode", tfa_enabled);
                    var keystores = JSON.stringify(response['keystores']);
                    storemenu(response['keystores'],password);
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
    $("#local_logout").on("click", function () {
        window.location.href = "./login.html";
        // sessionStorage.removeItem("username");
        // sessionStorage.removeItem("password");
        // sessionStorage.removeItem("online_keystores");
    });
    function storemenu(keystores,password){
        if(keystores.length > 0){
            var walletmenu = {};
            for(var i = 0; i < keystores.length - 1; i++){
                var keystore = keystores[i]['keystore'];
                var wallet_id = keystores[i]['id'];
                var wallet_name = keystores[i]['name'];
                // var new_wallet = web3.eth.accounts.decrypt(JSON.parse(keystore), password);
                var j = JSON.parse(keystore);
                var wallet_name_short = wallet_name.substr(0,15);
                if(wallet_name.length > 25){
                    wallet_name_short = wallet_name_short + "...";
                }
                if(i === 0) {
                   walletmenu[wallet_id]="<li class='local_remove' id='"+wallet_id+"'><a class='edit_online_wallet'>"+wallet_name_short+"</a><label class='switch' id='switch_wallet_link'  data-keystore='"+JSON.stringify(j)+"' data-keystores='"+JSON.stringify(keystores[i])+"' data-name='"+wallet_name+"' data-wallet_id='"+wallet_id+"'><input type='checkbox' name='live_wallet_btn[1][]'><span class='slider1 round1'></span></label></li>";
                }else{
                   walletmenu[wallet_id]="<li class='local_remove' id='"+wallet_id+"'><a class='edit_online_wallet'>"+wallet_name_short+"</a><label class='switch' id='switch_wallet_link'  data-keystore='"+JSON.stringify(j)+"' data-keystores='"+JSON.stringify(keystores[i])+"' data-name='"+wallet_name+"' data-wallet_id='"+wallet_id+"'><input type='checkbox' name='live_wallet_btn[1][]'><span class='slider1 round1'></span></label></li>";
                }
            }
            sessionStorage.setItem("walletmenu", JSON.stringify(walletmenu));
            return true;
        }
    }
   
});


