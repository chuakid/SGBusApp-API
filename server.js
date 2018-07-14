const mysql = require("mysql");
const bodyParser = require("body-parser");
const express = require('express');
const crypto = require("crypto");
const password = require("./password").password;
const app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


app.listen('3000', () => {
    console.log('Server has started on port 3000');
})

//Server
app.use(function (req, res, next) {
    res.locals.connection = mysql.createConnection({
        host: "127.0.0.1",
        user: "kelvin",
        password: password,
        database: 'SGBusApp'
    })
    next();
})

//Local testing
// app.use(function (req, res, next) {
//     res.locals.connection = mysql.createConnection({
//         host: "127.0.0.1",
//         user: "root",
//         password: "",
//         database: 'sgbusapp'
//     })
//     next();
// })

//Get Account Information
app.get("/api/v1/account/", (req, res) => {
    if (req.get("token")) {
        res.locals.connection.query('SELECT name,email,mobile from accounts where token=?', [req.get("token")], function (error, results, fields) {
            if (error) {
                res.status(400);
                res.json({
                    "error": error,
                })
            }
            else {
                res.json({
                    "status": 200,
                    "error": null,
                    "response": results
                })
            }
        });
    }
    else {
        res.status(400);
        res.json({
            "error": "Token not found",
        })
    }
});

//Login
app.post("/api/v1/account/login", (req, res) => {
    let email = req.body.email,
        password = crypto.createHash("md5").update((req.body.password)).digest('hex');
    res.locals.connection.query('SELECT id FROM accounts WHERE email=? AND password =?', [email, password], (error, results, fields) => {
        results = results.length == 0 ? "No such login" : results
        if (error) {
            res.status(400);
            res.json({
                "error": error,
            })
        }
        else {
            var token = crypto.randomBytes(20).toString('hex');
            res.locals.connection.query("UPDATE accounts SET token = ? WHERE email = ?", [token, email], (error, results, fields) => {
                if (error) {
                    res.status(400);
                    res.json({
                        "error": error,
                    })
                } else {
                    res.json({
                        "status": 200,
                        "error": null,
                        "response": { "token": token }
                    })
                }
            })
        }
    })
});

//Logout
app.post("/api/v1/account/logout", (req, res) => {
    if (req.get("token")) {
        res.locals.connection.query('SELECT * FROM accounts WHERE token=?', [req.get("token")], (error, results, fields) => {
            if (results.length > 0) {
                res.locals.connection.query("UPDATE accounts SET token = null WHERE token = ?", [req.get("token")], (error, results, fields) => {
                    res.json({
                        "response": "Success"
                    })
                })
            }
            else {
                res.json({
                    "response": "Failed"
                })
            }
        });
    } else {
        res.json({
            "error": "Token not found"
        })
    }
})

//Create account
app.post("/api/v1/account", (req, res) => {
    let name = req.body.name,
        email = req.body.email,
        password = crypto.createHash("md5").update((req.body.password)).digest('hex'),
        mobile = req.body.mobile;

    res.locals.connection.query('SELECT * FROM accounts WHERE email=?', [email], (error, results, fields) => {
        if (error) {
            res.status(400);
            res.json({
                "error": error,
            })
        }
        else {
            if (results.length > 0) {
                res.status(400);
                res.json({
                    "error": "Email in use"
                })
            }
            else {
                res.locals.connection.query('INSERT INTO accounts (name,email,password,mobile) VALUES(?,?,?,?)', [name, email, password, mobile], (error, results, fields) => {
                    if (error) {
                        res.status(400);
                        res.json({
                            "error": error,
                        })
                    }
                    else {
                        res.json({
                            "status": 200,
                            "error": null,
                            "response": "Registration success"
                        })
                    }
                })

            }
        }
    })
});

//Edit Account
app.post("/api/v1/account/update", (req, res) => {
    let name = req.body.name,
        token = req.get("token"),
        mobile = req.body.mobile;
    if (token == undefined) {
        res.status(400);
        res.json({
            "error": "Token not found",
        })
    }
    else {
        res.locals.connection.query('UPDATE accounts SET name=?,mobile=? WHERE token=?', [name, mobile, token], (error, results, fields) => {
            if (error) {
                res.status(400);
                res.json({
                    "error": error,
                })
            }
            else {
                res.json({
                    "error": null,
                    "response": "Update success"
                })
            }
        })
    }
});