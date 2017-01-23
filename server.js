var express    = require('express');
var app        = express();
var path       = require("path");
var bodyParser = require('body-parser')
var spawn      = require('child_process').spawn;
var fs         = require('fs');

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

function OnRequest(request, response){
    response.sendFile(path.join(__dirname+'/index.html'));
}

function OnCompile(request, response) {
    fs.writeFile('temp.cpp', request.body.code, function(err) {
  		if (err) {
      		return console.error(err);
   		} else {
    		var compile = spawn('gcc',['temp.cpp']);
	
			compile.stdout.on('data', function (data) {
    			console.log('stdout: ' + data);
			});
			compile.stderr.on('data', function (data) {
    			console.log(String(data));
			});
			compile.on('close', function (data) {
    			if (data === 0) {
        			var run = spawn('./a.exe', []);
        	
        			run.stdout.on('data', function (output) {
            			console.log(String(output));
            			response.send(output);
        			});
        			run.stderr.on('data', function (output) {
            			console.log(String(output));
        			});
        			run.on('close', function (output) {
            			console.log('stdout: ' + output);
        			})
    			}
			})
		}
	});
	
    response.send('OK');
}

app.get('/', OnRequest).listen(app.get('port'));

app.post('/compile', OnCompile);