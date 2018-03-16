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
        jwt.verify(token, "chicago", (err, decode) => {
            if (err) {
                res.send("Wrong token")
                console.log(`wrong token`)
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
    db = client.db("grocery-app")
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

app.post('/signup', (req, res) => {
    if (req.body.username.length && req.body.password.length) {
        db.collection('users').find({ username: req.body.username }).toArray((err, dataMatch) => {
            if (!dataMatch.length) {
                bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
                    // Store hash in your password DB.
                    db.collection('users').save({ username: req.body.username, password: hash, items: [] }, (err, result) => {
                        if (err) {
                            res.json({
                                message: `${err}`
                            })
                            return console.log(err);
                        } else {
                            res.json({
                                message: "Sign Up Successful!\nPlease log in",
                                check: true
                            })
                            console.log('saved to database');
                        }
                    });
                });
            } else {
                res.json({
                    message: 'This username already exists'
                })
            }
        })
    } else {
        res.json({
            message: `Error: username or password can't be blank`
        })
    }
});

app.post("/login", (req, res) => {
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
                        myToken: token,
                        check: true
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

app.post("/submit", verifyToken, (req, res) => {
    db.collection("users").find({ username: req.body.username }).toArray((err, user) => {
        db.collection("users").update(
            { username: req.body.username },
            {
                $push: {
                    items: [req.body.item]
                }
            }
        )
    })
    db.collection("users").find({ username: req.body.username }).toArray((err, user) => {
        res.json({
            message: `success retrieve`,
            item: user
        })
    })
})

app.post("/remove", verifyToken, (req, res) => {
    db.collection("users").find({ username: req.body.username }).toArray((err, user) => {
        db.collection("users").update(
            { username: req.body.username },
            {
                $pull: {
                    items: {
                        $in:
                        [req.body.item]
                    }
                }
            }
        )
    })
    db.collection("users").find({ username: req.body.username }).toArray((err, user) => {
        res.json({
            message: `success retrieve`,
            item: user
        })
    })
})
