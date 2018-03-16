var express = require("express");
var app = express();
var path = require('path')
require('dotenv').config();

app.use(express.static(path.join(__dirname, "build")));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });

app.listen(process.env.PORT || 8080, () => {
    var curPort = process.env.port;
    if (curPort === undefined) {
        curPort = "localhost://8080"
    }
    console.log(`listening on ${curPort}`)
})
