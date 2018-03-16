var express = require("express");
var app = express();
var path = require('path')
require('dotenv').config();
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

const saltRounds = 10;

app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "build")));

var db;

function verifyToken(req, res, next) {
    var token = req.body.token;
    if (token) {
        jwt.verify(token, "Secret", (err, decode) => {
            if (err) {
                res.send("Wrong token")
            } else {
                res.locals.decode = decode
                next();
            }
        })
    } else {
        res.send("No token")
    }
}

MongoClient.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ds115219.mlab.com:15219/grocery-app`, (err, client) => {
    if (err) return console.log(err)
    db = client.db("grocery-app") // whatever your database name is
    app.listen(process.env.PORT || 8080, () => {
        var curPort = process.env.PORT;
        if (curPort === undefined) {
            curPort = "localhost://8080"
        }
        console.log(`listening on ${curPort}`)
    })
})

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.post('/sign-up', (req, res) => {
    if (req.body.username.length && req.body.password.length) {
        db.collection('users').find({ username: req.body.username }).toArray((err, dataMatch) => {
            if (!dataMatch.length) {
                bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
                    // Store hash in your password DB.
                    db.collection('users').save({ username: req.body.username, password: hash, work: req.body.work }, (err, result) => {
                        if (err) {
                            res.json("Failed")
                            return console.log(err);
                        } else {
                            res.json("Sign Up Successful")
                            console.log('saved to database');
                        }
                    });
                });
            } else {
                res.json('This username already exists')
            }
        })
    } else {
        res.json(`Error: username or password can't be blank`)
    }
});

app.post("/sign-in", (req, res) => {
    db.collection("users").find({ username: req.body.username }).toArray((err, user) => {
        if (!user.length) {
            res.json({
                message: "Username/Password doesn't match"
            });
        } else if (err) {
            res.json({
                message: err
            });
        } else {
            bcrypt.compare(req.body.password, user[0].password, function (err, resolve) {
                if (resolve === true) {
                    var token = jwt.sign(req.body.username, ('chicago'), {
                    });
                    console.log(`user: "${req.body.username}" has logged in at ${new Date()}`)
                    res.json({
                        message: "Login successful!",
                        myToken: token
                    });
                } else if (resolve === false) {
                    console.log(`user: "${req.body.username}" has failed a login in at ${new Date()}`)
                    res.json({
                        message: "Username/Password doesn't match",
                    })
                }
            });
        }
    })
});
