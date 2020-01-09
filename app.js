const http = require("http");
const url = require("url");
const fs = require("fs");
// var path = require('path');
var NodeSession = require('node-session');
session = new NodeSession({ secret: 'Q3UBzdH9GEfiRCTKbi5MTPyChpzXLsTD' });
var web3_main = require("./web3.js");
var HeliosUtils = require('helios-utils');
const { parse } = require('querystring');
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

http.createServer(async function (request, response, next) {
  var parsedURL = url.parse(request.url, true);
  var filePath = parsedURL.pathname;
  let qs = parsedURL.query;
  let headers = request.headers;
  let method = request.method.toLowerCase();
  let body = '';
  request.on("data", chunk => {
    body += chunk;
  });
  request.on("end", function () {
    //we will use the standardized version of the path
    let route =
      typeof routes[filePath] !== "undefined" ? routes[filePath] : routes[""];
    let data = {
      path: filePath,
      queryString: qs,
      headers: headers,
      method: method,
      bodyi: body
    };
    route(data, request, response);
  });

}).listen(1234, function () {
  console.log("Listening on port 1234");
});
let routes = {
  "/login": function (data, req, res) {
    var bodys = parse(data.bodyi);
    server.signIn(bodys.username, bodys.password, "")
      .then(function (res1) {
        if (res1 !== false && "success" in res1) {
          session.mid = res1.keystores[0].id;
          res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
          res.end('Yes');
        } else if(res1 !== false && res1.error == '4000' ){
          session.username = bodys.username;
          session.password = bodys.password;
          res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
          res.end('2fa');
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
          res.end(res1.error_description);
        }

      });
  },
  "/logout": function (data, req, res) {
    session.mid = null;
    res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
    res.end('Yes');
  },
  "/checklogin": function (data, req, res) {
    console.log(session.mid);
    if(session.mid > 0){
      res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
      res.end('Yes');
    }else{
      res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
      res.end('No');
    }
  },
  "/2fa": function (data, req, res) {
    if(session.username != null && session.username != null){
      var bodys = parse(data.bodyi);
      server.signIn(session.username, session.password, String(bodys.fa))
        .then(function (res1) {
          if (res1 !== false && "success" in res1) {
            session.mid = res1.keystores[0].id;
            session.username = null;
            session.password = null;
            res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
            res.end('Yes');
          } else if(res1 !== false && res1.error == '4000' ){
            
            res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
            res.end(res1.error_description);
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
            res.end(res1.error_description);
          }

        });
    }else{
      res.writeHead(200, { 'Content-Type': 'application/json','Access-Control-Allow-Origin' : '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE' });
      res.end('No');
    }

  },
  "": function (data, req, res) { 
    // fs.readFile('./login.html', function (error, content) {
    //   if (error) {
    //     if (error.code == 'ENOENT') {
    //       fs.readFile('./' + filePath + '.html', function (error, content) {
    //         res.writeHead(404, { 'Content-Type': 'text/html' });
    //         res.end(content, 'utf-8');
    //       });
    //     }
    //     else {
    //       res.writeHead(500);
    //       res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
    //     }
    //   }
    //   else {
    //     res.writeHead(200, { 'Content-Type': 'text/html' });
    //     res.end(content, 'utf-8');
    //   }
    // });
  }
};