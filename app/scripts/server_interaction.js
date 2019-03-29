const superagent = require('superagent');
const bcrypt = require('bcryptjs');


// When changning password, force user to backup all online wallets first, and let them know that it is encrypted with
// their existing password, so they should write it down in case re-encryption fails for any reason.

class Server {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.saltRounds = 11;
        this.superagent = superagent.agent();
        this.use_localStorage = false;
        this.queryResponseTimeout = 4000; //Time till server responds
        this.queryResponseDeadline = 8000; //Allowed time for page to load
    }

    error(errorName, extraData){
        if(errorName === undefined){
            errorName = "unknown";
        }
        console.log("helios-wallet-serverside error "+errorName);
        if(!(extraData === undefined)){
            console.log(extraData);
        }
        return {'error': true, 'error_description': errorName};
    }

    saveSession(session_hash, username){
        console.log('Saving session');
        if (typeof window !== 'undefined' && this.use_localStorage) {
            window.localStorage.setItem("session_hash", session_hash);
            if(!(username === undefined)) {
                window.localStorage.setItem("username", username);
            }
        }else{
            this.session_hash = session_hash;
            if(!(username === undefined)) {
                this.username = username;
            }
        }
    }

    loadSession(){
        if (typeof window !== 'undefined' && this.use_localStorage) {
            var session_hash = window.localStorage.getItem("session_hash");
            var username = window.localStorage.getItem("username");
            return {'session_hash':session_hash, 'username':username};
        }else{
            return {'session_hash':this.session_hash, 'username':this.username};
        }
    }

    killSession(){
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem("session_hash");
            window.localStorage.removeItem("username");
        }else{
            this.session_hash = '';
            this.username = '';
        }
    }

    async renewSession(){
        console.log("Renewing session");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'renew_session', username: session['username'], session_hash: session['session_hash']};
            var response = await this.queryServer(query);
            if(response !== false && "success" in response) {
                return true;
            } else{
                this.killSession();
            }
        }
        return false;
    }

    async getOnlineWallets(){
        console.log("Getting online wallets");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'get_wallets', username: session['username'], session_hash: session['session_hash']};
            return await this.queryServer(query);
        }
        return false;
    }

    async addOnlineWallet(keystore, name){
        console.log("Adding online wallet");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'add_keystore',
                username: session['username'],
                session_hash: session['session_hash'],
                keystore:JSON.stringify(keystore),
                wallet_name: name};
            return await this.queryServer(query);
        }
        return false;
    }

    async renameOnlineWallet(wallet_id, previous_wallet_name, new_wallet_name){
        console.log("Renaming online wallet");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'rename_keystore',
                username: session['username'],
                session_hash: session['session_hash'],
                wallet_id:wallet_id,
                previous_wallet_name: previous_wallet_name,
                new_wallet_name: new_wallet_name};
            return await this.queryServer(query);
        }
        return false;
    }

    async deleteOnlineWallet(id, name){
        console.log("Deleting online wallet");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'delete_keystore',
                username: session['username'],
                session_hash: session['session_hash'],
                wallet_id:id,
                wallet_name: name};
            return await this.queryServer(query);
        }
        return false;
    }

    async getContacts(){
        console.log("Getting contacts");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'get_contacts', username: session['username'], session_hash: session['session_hash']};
            return await this.queryServer(query);
        }
        return false;
    }

    async getNew2FASecret(){
        console.log("Getting new 2FA secret");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'get_new_2fa_secret', username: session['username'], session_hash: session['session_hash']};
            return await this.queryServer(query);
        }
        return false;
    }

    async is2FAEnabled(){
        console.log("Checking if 2FA enabled");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'is_2fa_enabled', username: session['username'], session_hash: session['session_hash']};
            return await this.queryServer(query);
        }
        return false;
    }

    async delete2FASecret(){
        console.log("Deleting 2FA secret");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'delete_2fa_secret', username: session['username'], session_hash: session['session_hash']};
            return await this.queryServer(query);
        }
        return false;
    }

    async save2FASecret(secret, code){
        console.log("Saving 2FA secret");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'save_new_2fa_secret', secret: secret, code: code, username: session['username'], session_hash: session['session_hash']};
            return await this.queryServer(query);
        }
        return false;
    }

    async addContact(contact_name, contact_address){
        console.log("Adding contacts");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'add_contact',
                username: session['username'],
                session_hash: session['session_hash'],
                contact_name: contact_name,
                contact_address: contact_address};
            return await this.queryServer(query);
        }
        return false;
    }

    async deleteContact(id){
        console.log("Deleting contact");
        var session = this.loadSession();
        if(!(session['session_hash'] === undefined)) {
            var query = {action: 'delete_contact',
                username: session['username'],
                session_hash: session['session_hash'],
                contact_id:id};
            return await this.queryServer(query);
        }
        return false;
    }

    async signIn(username, password, tfa_code){
        // Sign wallets with password. But we hide that password from the server by hashing it here with bcrypt.
        // Then in order to stop pass the hash attacks, the server side will also hash the hash with bcrypt.
        // Then the keystore encryption keys and login information are both safe.

        var query = {action: 'get_salt', username: username};
        var salt_response = await this.queryServer(query);
        var salt_for_verification = salt_response['salt'];
        var password_hash_for_verification = bcrypt.hashSync(password, salt_for_verification);

        var new_salt = bcrypt.genSaltSync(this.saltRounds);
        var new_password_hash = bcrypt.hashSync(password, new_salt);

        query = {   action: 'sign_in',
                    username: username,
                    two_factor_code: tfa_code,
                    password_hash_for_verification: password_hash_for_verification,
                    new_password_hash: new_password_hash,
                    new_salt: new_salt};
        var response = await this.queryServer(query);
        if('session_hash' in response){
            this.saveSession(response['session_hash'], username);
        }
        return response;
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

    async queryServer(query){
        return await superagent.get(this.serverUrl)
        .timeout({
            response: this.queryResponseTimeout,
            deadline: this.queryResponseDeadline,
        })
        .query(query)
        .then(res => {
            try {
                var json_response = JSON.parse(res.text);
            } catch(e) {
                return this.error('Malformed JSON Response', [res.status, res.text]);
            }
            console.log("Successful response from server")
            console.log(json_response);
            if('session_hash' in json_response){
                this.saveSession(json_response['session_hash']);
            }
            // check for invalid session
            if('error' in json_response){
                if(json_response['error'] == 2020){
                    if(typeof window.logout !== 'undefined' && typeof window.popup !== 'undefined'){
                        console.log("Session expired");
                        window.logout();
                        window.popup("Your session has expired. Please log in again to continue.");
                    }
                }
            }
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