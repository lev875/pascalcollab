var express    = require('express');
var app        = express();
var path       = require("path");
var bodyParser = require('body-parser')

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

function OnRequest(request, response){
    response.sendFile(path.join(__dirname+'/index.html'));
}

function OnCompile(request, response) {
    console.log(request.body.code)
    response = "OK";
}

app.get('/', OnRequest).listen(app.get('port'));

app.post("/compile", OnCompile);