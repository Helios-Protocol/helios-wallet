var requests = require("../connection");
var request = require("request");
exports.a = 'https://login.windexsms.com/api/sendhttp.php?authkey=11438AvRLGxwFK5ca61e18&mobiles=8511284148&message=hii&sender=INSCOM&route=4';
exports.ip = async (req) => {
    return req.connection.remoteAddress;
};
exports.SP = async (spName,json) => {
    var sql = 'exec '+ spName + ' ';
    Object.keys(json).forEach(function(key) {
        sql += ' @'+ key +'="'+ json[key] +'",';
    });
    var sql = sql.substring(0, sql.lastIndexOf(","));
    return new Promise((resolve, reject) => {
        requests.query(sql, function (err, result){
            if (err){
                reject(err);
            }
            resolve(result);
        })
    })
};
exports.selectquery = async (tablename,where,select='',jointable='',orderby='') => {
    var sql = "select ";
    if(select.length > 0){
        sql += select.join();
    }else{
        sql +="*";
    }
    sql +=" from "+ tablename ;
    if(Object.keys(jointable).length > 0 ){
        
        Object.keys(jointable).forEach(function(key) {
            sql +=" "+ key +" on "+ jointable[key];
        });
       
    }
    var count = Object.keys(where).length;
    if(count){
        sql += " where ";
        Object.keys(where).forEach(function(key) {
            sql +=" "+ key +"='"+ where[key] +"' and";
        });
    }
    var sql = sql.substring(0, sql.lastIndexOf("and"));

    if(orderby != ""){
        sql += " "+ orderby ;
    }
    console.log(sql);
    return new Promise((resolve, reject) => {
        requests.query(sql, function (err, result){
            if (err){
                reject(err);
            }
            resolve(result);
        })
    })
};
exports.onlyselectquery = async (sql) => {
   
    return new Promise((resolve, reject) => {
        requests.query(sql, function (err, result){
            if (err){
                reject(err);
            }
            resolve(result);
        })
    })
};
exports.insertquery = async (tablename,value) => {
    var sql = "insert into "+ tablename ;
    var count = Object.keys(value).length;
    var keys='',values = '';
    if(count){
        Object.keys(value).forEach(function(key) {
            keys += key +",";
            values += "'" + value[key] + "',";
        });
    }
    var keys = keys.substring(0, keys.lastIndexOf(","));
    var values = values.substring(0, values.lastIndexOf(","));
    sql += "(" + keys + ") values (" + values + ")";
    return new Promise((resolve, reject) => {
        requests.query(sql, function (err, result){
            if (err){
                reject(err);
            }
            resolve(result);
        })
    })
};
exports.updatequery = async (tablename,set,where = '') => {
    var sql = "update "+ tablename ;
    var count = Object.keys(set).length;
    
    if(count){
        sql += " set ";
        Object.keys(set).forEach(function(key) {
            sql +=" "+ key +"='"+ set[key] +"' ,";
        });
    }
    var sql = sql.substring(0, sql.lastIndexOf(","));
    if(where){
        sql += " where "
        Object.keys(where).forEach(function(key) {
            sql +=" "+ key +"='"+ where[key] +"' and";
        });
    }
    var sql = sql.substring(0, sql.lastIndexOf("and"));
    console.log(sql);
    return new Promise((resolve, reject) => {
        requests.query(sql, function (err, result){
            if (err){
                reject(err);
            }
            resolve(result);
        })
    })
};
exports.sendemail = async (Email,Subject,Content) =>{
    var helper = require('sendgrid').mail;
    var fromEmail = new helper.Email('info@shoppyworld.co','ShoppyWorld');
    var toEmail = new helper.Email(Email);
    var subject = Subject;
    var content = new helper.Content('text/html', Content);
    var mail = new helper.Mail(fromEmail, subject, toEmail, content);
    var sg = require('sendgrid')("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");
    var request = sg.emptyRequest({
       method: 'POST',
       path: '/v3/mail/send',
       body: mail.toJSON()
    });
    sg.API(request, async function (error, response) {
       if (error) {
          console.log(error);
       } else {
          
       }
    });
};
exports.sendsms = async (mobileno,msg) => {
    request('https://login.windexsms.com/api/sendhttp.php?authkey=11438AvRLGxwFK5ca61e18&mobiles='+mobileno+'&message='+msg+'&sender=AKANXA&route=4', async function (error, response, body) {
    });
};




