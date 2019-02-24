const superagent = require('superagent');
var request = require('request-promise-native');
const bcrypt = require('bcryptjs');
var tough = require('tough-cookie');


// When changning password, force user to backup all online wallets first, and let them know that it is encrypted with
// their existing password, so they should write it down in case re-encryption fails for any reason.

class Server {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.saltRounds = 11;
        this.superagent = superagent.agent();
    }

    error(errorName, extraData){
        if(errorName === undefined){
            errorName = "unknown";
        }
        console.log("helios-wallet-serverside error "+errorName);
        if(!(extraData === undefined)){
            console.log(extraData);
        }
        return {'error': true, 'error_description': 'Malformed JSON Response'};
    }

    async signIn(username, password){
        // Sign wallets with password. But we hide that password from the server by hashing it here with bcrypt.
        // Then in order to stop pass the hash attacks, the server side will also hash the hash with bcrypt.
        // Then the keystore encryption keys and login information are both safe.

        var query = {action: 'get_salt', username: username};
        var salt_response = await this.queryServer(query);
        var salt_for_verification = salt_response['salt'];
        console.log("salt_response = ");
        console.log(salt_response);
        var password_hash_for_verification = bcrypt.hashSync(password, salt_for_verification);

        var new_salt = bcrypt.genSaltSync(this.saltRounds);
        var new_password_hash = bcrypt.hashSync(password, new_salt);

        // console.log("debug");
        // console.log(username);
        // console.log(password);
        // console.log(password_hash);
        query = {   action: 'sign_in',
                    username: username,
                    password_hash_for_verification: password_hash_for_verification,
                    new_password_hash: new_password_hash,
                    new_salt: new_salt};
        return await this.queryServer(query);
    }

    async newUser(username, email, password, new_wallet_keystore){
        var salt = bcrypt.genSaltSync(this.saltRounds);
        var password_hash = bcrypt.hashSync(password, salt);
        var query = {   action: "new_user",
                        username: username,
                        email: email,
                        password_hash: password_hash,
                        salt: salt,
                        new_wallet_keystore: JSON.stringify(new_wallet_keystore)};
        return await this.queryServer(query);
    }

    // async queryServer(query){
    //
    //     var _include_headers = function(body, response, resolveWithFullResponse) {
    //       return {'response':response, 'headers': response.headers, 'text': body};
    //     };
    //
    //     var options = {
    //         uri: 'https://google.com',
    //         headers: {
    //             'User-Agent': 'Request-Promise'
    //         },
    //         transform: _include_headers,
    //     };
    //     return await request(options)
    //     .then(res => {
    //         console.log('debug');
    //         console.log(res.headers);
    //         console.log(res.text);
    //         var rawcookies = res.response.headers['set-cookie'];
    //         console.log(rawcookies);
    //
    //
    //     })
    //     .catch(err => {
    //         return this.error("HTTP Request Error", [err.message, err.response]);
    //     });
    //
    // }

    // async queryServer(query){
    //
    //     var _include_headers = function(body, response, resolveWithFullResponse) {
    //       return {'response':response, 'headers': response.headers, 'text': body};
    //     };
    //
    //     var options = {
    //         uri: this.serverUrl,
    //         qs: query,
    //         headers: {
    //             'User-Agent': 'Request-Promise'
    //         },
    //         transform: _include_headers,
    //     };
    //     return await request(options)
    //     .then(res => {
    //         console.log('debug');
    //         console.log(res.headers);
    //         console.log(res.text);
    //         var rawcookies = res.response.headers['set-cookie'];
    //         console.log(rawcookies);
    //         try {
    //             var json_response = JSON.parse(res.text);
    //         } catch(e) {
    //             return this.error('Malformed JSON Response', res.text);
    //         }
    //         return json_response;
    //
    //     })
    //     .catch(err => {
    //         return this.error("HTTP Request Error", [err.message, err.response]);
    //     });
    //
    // }
    //
    async queryServer(query){
        return await superagent.get(this.serverUrl)
        .withCredentials()
        .query(query)
        .then(res => {
            try {
                var json_response = JSON.parse(res.text);
            } catch(e) {
                return this.error('Malformed JSON Response', [res.status, res.text]);
            }
            var cookie = res.header['set-cookie']
            console.log('successful response from serverside');
            console.log(res.headers);
            console.log('cookies');
            console.log(cookie);
            console.log(json_response);
            return json_response;

        })
        .catch(err => {
            return this.error("HTTP Request Error", [err.message, err.response]);
        });

    }

}

module.exports = {
    Server: Server
};