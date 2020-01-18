// document.head.appendChild('<script type="text/javascript" src="./dist/helios_js/helios_web3.js" ></script>');
// document.head.appendChild('<script type="text/javascript" src="./dist/helios_js/helios-wallet-master.js" ></script>');
// var imported = document.createElement('script');
// imported.src = './dist/helios_js';
// document.head.appendChild(imported);
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    var a= document.cookie;
    alert(a);
  }
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}



$(document).on("click",".btnlogin",function(e){
    e.preventDefault();
    var username = $(".username").val();
    var password = $(".password").val();
    
    server.signIn(username, password, "")
    .then(function(response){
        if(response !== false && "success" in response) {
           // $.cookie("username", "sagar", '100');
            //Cookies.set('username',username);
            //setCookie("username",username,365);
           // document.cookie = 'cross-site-cookie=bar; SameSite=None';
            //document.cookie = "username="+ username;
            window.location.href = "./dashboard.html";
        }else{
            if(response.error == "4000" && response.error_description == "Two factor authentication code mismatch."){
                localStorage.setItem("username", username);
                localStorage.setItem("password", password);
                window.location.href = "./2fa.html";
            }else  if(response.error == "2010" && response.error_description == "Invalid username or password."){
                $(".username").val('');
                $(".password").val('');
                alertify.error(response.error_description);
                
            }else{
                alertify.error("HTTP Request Error");
            }
            
        }
    });
});
$(document).on("click",".2falogin",function(e){
    e.preventDefault();
    var username = localStorage.getItem("username");
    var facode = $(".facode").val();
    var password = localStorage.getItem("password");
    
    server.signIn(username, password, facode)
    .then(function(response){
        if(response !== false && "success" in response) {
            window.location.href = "./dashboard.html";
        }else{
            if(response.error == "4000" && response.error_description == "Two factor authentication code mismatch."){
                alertify.error(response.error_description);
            }else  if(response.error == "2010" && response.error_description == "Invalid username or password."){
                alertify.error(response.error_description);
            }else{
                alertify.error("HTTP Request Error");
            }
            
        }
    });
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