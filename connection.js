var mysql = require('mysql');

// give the info need to connect
var sqlConnect = mysql.createConnection({
    host: "localhost",
    port: 8889,
    user: "root",
    password: "root", 
    database: 'bamazon'
});

// make the connection to bamazon db
sqlConnect.connect(err => {
    if (err) throw err;
});

module.exports = sqlConnect;