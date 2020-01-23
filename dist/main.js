var loginApp = angular.module('loginApp', []);
loginApp.controller("loginController", function ($scope, $http) {
    $scope.submitLoginForm = function () {
        $scope.username = $scope.user.username;
        $scope.password = $scope.user.password;
        if($scope.username == ""){
            alertify.error("Username cannot be left blank.");
        }else if($scope.password == ""){
            alertify.error("Password cannot be left blank.");
        }else{
            server.signIn($scope.username, $scope.password, "")
            .then(function(response){
                if(response !== false && "success" in response) {
                    sessionStorage.setItem("username", $scope.username);
                    sessionStorage.setItem("password", $scope.password);
                    var online_keystores = response['keystores'];
                    sessionStorage.setItem("online_keystores", online_keystores);
                    window.location.href = "./dashboard.html";
                }else{
                    if(response.error == "4000" && response.error_description == "Two factor authentication code mismatch."){
                        sessionStorage.setItem("username", $scope.username);
                        sessionStorage.setItem("password", $scope.password);
                        window.location.href = "./2fa.html";
                    }else if(response.error_description == "Invalid username or password."){
                        $scope.user.username = '';
                        $scope.user.password = '';
                        alertify.error(response.error_description);
                    }else{
                        alertify.error("HTTP Request Error");
                    }
                    
                }
            });
        }
    };
});
var registerApp = angular.module('registerApp', []);
registerApp.controller("registerController", function ($scope, $http) {

    $scope.submitRegisterForm = function () {
        
        $scope.username = $scope.user.username;
        $scope.email = $scope.user.email;
        $scope.password = $scope.user.password;
        $scope.cpassword = $scope.user.cpassword;
        if($scope.username == ""){
            alertify.error("Username should not blank.");
        }else if($scope.email == ""){
            alertify.error("Email should not blank.");
        }else if($scope.password == ""){
            alertify.error("Password should not blank.");
        }else if($scope.password !== $scope.cpassword){
            alertify.error("Confirm password and password should not match.");
        }else{
            var new_wallet = web3.eth.accounts.create();
            var keystore = web3.eth.accounts.encrypt(new_wallet.privateKey, $scope.password);
            server.newUser($scope.username, $scope.email, $scope.password, $scope.keystore)
                .then(function(response){
                if(response !== false && "success" in response) {
                    if(response !== false && "success" in response) {
                        setCookie("username",$scope.username,365);
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
                }else{
                    if(response.error == "4000" && response.error_description == "Two factor authentication code mismatch."){
                        sessionStorage.setItem("username", $scope.username);
                        sessionStorage.setItem("password", $scope.password);
                        window.location.href = "./2fa.html";
                    }else if(response.error_description){
                        $scope.user.username = '';
                        $scope.user.email = '';
                        $scope.user.password = '';
                        $scope.user.cpassword = '';
                        alertify.error(response.error_description);
                        
                    }else{
                        alertify.error("HTTP Request Error");
                    }
                }
            });
        }
    };
    $scope.resetForm = function () {
        $scope.student = angular.copy($scope.OriginalStudent);
    };
});
var faApp = angular.module('2faApp', []);
faApp.controller("2faController", function ($scope, $http) {
    $scope.submit2faForm = function () {
        $scope.fa = $scope.user.fa;
        $scope.username = sessionStorage.getItem("username");
        $scope.password = sessionStorage.getItem("password");
        if($scope.fa == ""){
            alertify.error("2fa should not blank.");
        }else{
            server.signIn($scope.username, $scope.password, $scope.fa)
            .then(function(response){
                if(response !== false && "success" in response) {
                    sessionStorage.setItem("username", $scope.username);
                    sessionStorage.setItem("password", $scope.password);
                    var online_keystores = response['keystores'];
                    sessionStorage.setItem("online_keystores", online_keystores);
                    window.location.href = "./dashboard.html";
                }else{
                    if(response.error == "4000" && response.error_description == "Two factor authentication code mismatch."){
                        $scope.user.fa = '';
                        alertify.error(response.error_description);
                    }else  if(response.error == "2010" && response.error_description == "Invalid username or password."){
                        $scope.user.fa = '';
                        alertify.error(response.error_description);
                    }else{
                        alertify.error("HTTP Request Error");
                    }
                    
                }
            });
        }
    };
});
var dashboardApp = angular.module('dashboardApp', []);
dashboardApp.controller("dashboardController", function ($scope, $http) {
    $scope.username = sessionStorage.getItem("username");
});
$(document).on("click",".logout",function(e){
    e.preventDefault();
    logout();
});
function logout(){
    server.killSession();
    //switchToPage('frontpage_page')
    window.location.href = './login.html';
    // clear_vars(true);
    // resize_initial_background();
}