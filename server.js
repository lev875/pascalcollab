var express    = require('express');
var app        = express();
var path       = require("path");
var bodyParser = require('body-parser')
var spawn      = require('child_process').spawn;
var fs         = require('fs');

app.set('port', (process.env.PORT || 8080));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

function OnRequest(request, response){
    response.sendFile(path.join(__dirname+'/index.html'));
}

function OnCompile(request, response) {
    fs.writeFile('temp.cpp', request.body.code, (err) => {
  		if (err) return console.error(err);
   		else {
    		var compile = spawn('g++',['temp.cpp']);
	
			compile.stdout.on('data', function (data) {
    			console.log('stdout: ' + data);
			});
			compile.stderr.on('data', function (data) {
    			console.log(String(data));
			});
			compile.on('close', function (data) {
    			if (data === 0) {
        			var run = spawn('./a.out', []);
        	
        			run.stdout.on('data', function (output) {
            			console.log(String(output));
            			response.send(output);
        			});
        			run.stderr.on('data', function (output) {
            			console.log(String(output));
            			response.send(output);
        			});
        			run.on('close', function (output) {
            			console.log('stdout: ' + output);
						fs.unlink('temp.cpp', (err) => {
							if (err) return console.error(err);
							console.log('temp.cpp');
						});
						fs.unlink('a.out', (err) => {
							if (err) return console.error(err);
							console.log('a.out');
						});
        			})
    			}
			})
		}
	});
}

app.get('/', OnRequest).listen(app.get('port'));

app.post('/compile', OnCompile);
