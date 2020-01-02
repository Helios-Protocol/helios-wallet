var sql =require("mssql");
sql.connect('Data Source=192.3.124.227,1188;Initial Catalog=hash_akanxa;Persist Security Info=True;User ID=hash_akanxa;Password=cvxnrqdjlkyhogzm9fsi', function (err) {
    if (err){
        console.log(err);
    } else{
        console.log("connect");
    }
});


module.exports= new sql.Request();
