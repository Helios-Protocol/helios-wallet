var express = require("express");
var app = express();
var http = require("http").Server(app).listen(8001);
var io = require('socket.io')(http);
const path = require('path');
const routers = require('./Router/router');
const bodyparser = require('body-parser');
var Promise = require('promise');
var async = require('async');

var request = require('request');
var sessions = require('express-session');
var multer = require('multer');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(sessions({
    secret: 'poussixthetruefighteroftheparadise',
    saveUninitialized: true,
    resave: true
}));
app.use("/assets", express.static("./assets"));
app.use("/login_assets", express.static("./login_assets"));


app.set('view engine', 'ejs');
// app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));

var memeberid = 0;
var ip;
app.get("/", routers);
app.get("/dashboard", routers);
app.get("/transactions", routers);
app.get("/login", routers);
app.post("/logindata", routers);
app.get("/2fa", routers);
app.get("/register", routers);
app.get("/logour", routers);
// app.post("/logindata",function(req,res,next){
//     e.preventDefault();
//     var username = req.body.mno;
//     var password = req.body.mno;
//     var tfa_code = $('#input_sign_in_two_factor_authentication').val();
//     // if(!(validateInputs(username, 'username') === true)){
//     //     popup(validateInputs(username, 'username'));
//     //     return;
//     // }
//     // if(!(validateInputs(tfa_code, 'two_factor_code') === true)){
//     //     popup(validateInputs(tfa_code, 'two_factor_code'));
//     //     return;
//     // }

//     loaderPopup();
//     server.signIn(username, password, tfa_code)
//     .then(function(response){
//         if(response !== false && "success" in response) {
//             //success
//             set_username_status(username);
//             var online_keystores = response['keystores'];
//             populateOnlineKeystores(online_keystores, password);
//             close_popup();
//             switchToPage('main_page');
//             var tfa_enabled = (response['2fa_enabled'] === 'true');
//             set_two_factor_authentication_status(tfa_enabled);
//             afterLoginInit();
//         }else{
//             //fail
//             var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
//             popup(popup_content, 500);
//         }
//     });
// });
app.get('*', routers);
