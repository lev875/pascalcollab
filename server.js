var express = require('express');
var app     = express();
var path    = require("path");

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname+'/index.html'));
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});

app.post("/", function (req, res) {
    console.log(req.body.user.name)
});