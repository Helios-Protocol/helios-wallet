var express = require("express");
var bodyParser = require('body-parser');
const router = express.Router();
var async = require('async');
var requests = require("../connection");
var multer = require("multer");
const browser = require('browser-detect');
const Controller = require('../Controller/controller');
var web3_main = require('../web3.js');
var HeliosUtils = require('helios-utils');
var helios_web3 = web3_main.web3;
var ConnectionMaintainer = HeliosUtils.ConnectionMaintainer;
var getNodeMessageFromError = HeliosUtils.getNodeMessageFromError;
var KeystoreServer = HeliosUtils.KeystoreServer;
var availableNodes = [
    "wss://bootnode.heliosprotocol.io:30304",
    "wss://bootnode2.heliosprotocol.io:30304",
    "wss://bootnode3.heliosprotocol.io:30304",
    "wss://masternode1.heliosprotocol.io:30304"
];
var connectionMaintainer = new ConnectionMaintainer(helios_web3, availableNodes);
connectionMaintainer.startNetworkConnectionMaintainerLoop();

var onlineKeystoreServerUrl = 'https://heliosprotocol.io/wallet-serverside/';

var server = new KeystoreServer(onlineKeystoreServerUrl);
var memeberid = 0;
router.use(async function (req, res, next) {
    if (req.session.mid == "undefined") {
        memeberid = 0;
    } else {
        memeberid = req.session.mid;
    }
    next();
});
router.get('/', function (req, res, next) {
    if (memeberid) {
        res.redirect("/dashboard");
    } else {
        res.redirect("../login");

    }
});
router.get('/logout', function (req, res, next) {
    req.session.mid = null;
    req.session.destroy(function (result, error) {
        res.redirect('../login');
    })
});
router.get('/dashboard', function (req, res, next) {
    if (memeberid) {
        res.render("dashboard");
    } else {
        res.redirect('../login');
    }
});
router.get('/transactions', function (req, res, next) {
    res.render("transactions");
});
router.get('/login', function (req, res, next) {
    res.render("login");
});
router.post('/logindata', function (req, res, next) {
    session = req.session;
    var uername = String(req.body.username);
    var password = String(req.body.password)
    server.signIn(uername, password, "").then(function (response) {
        if (response.success !== false && "success" in response) {
            console.log(response.keystores[0].id);
            session.mid = response.keystores[0].id;
            res.send({ "status": "success", data: response });
            // //success
            // set_username_status(username);
            // var online_keystores = response['keystores'];
            // populateOnlineKeystores(online_keystores, password);
            // close_popup();
            // switchToPage('main_page');
            // var tfa_enabled = (response['2fa_enabled'] === 'true');
            // set_two_factor_authentication_status(tfa_enabled);
            // afterLoginInit();
        } else {
            console.log(response);
            res.send({ "status": "error", data: "Invalid username or password." });
            //fail
            // res.send({"status":"error","msg":response.error_description});
            //var popup_content = "Oops, something went wrong:<br><br>" + response['error_description'];
            // popup(popup_content, 500);
            //console.log(popup_content);
        }
    });
    console.log("END Event");
});
router.get('/2fa', function (req, res, next) {
    res.render("2fa");
});
router.get('/register', function (req, res, next) {
    res.render("register");
});
router.get('*', function (req, res, next) {
    res.redirect('/dashboard');
});


module.exports = router;