var express    = require('express');
var app        = express();
var path       = require('path');
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
			var buf = '';
	
			compile.stdout.on('data', (data) => {
    			console.log('stdout: ' + data);
			});
			compile.stderr.on('data', (data) => {
				fs.unlink('temp.cpp', (err) => {
					if (err) return console.error(err);
					console.log('temp.cpp deleted (error)');
				})	
				console.log(String(data));
				buf += data;		
			});
			compile.on('close', (data) => {
    			if (data === 0) {
        			var run = spawn('./a.out', []);

					if(request.body.input != '') {
						run.stdin.write(request.body.input);
						run.stdin.end();
					}
        	
        			run.stdout.on('data', (output) => {
            			console.log(String(output));
            			buf += output;
        			});
        			run.stderr.on('data', (output) => {
            			console.log(String(output));
            			buf += output;
        			});
        			run.on('close', (output) => {
            			console.log('stdout: ' + output);
            			response.send(buf);
						fs.unlink('temp.cpp', (err) => {
							if (err) return console.error(err);
							console.log('temp.cpp deleted');
						});
						fs.unlink('a.out', (err) => {
							if (err) return console.error(err);
							console.log('a.out deleted');
						});
        			})
    			} else {
					response.send(String(buf));
				}
			})
		}
	});
}

app.get('/', OnRequest).listen(app.get('port'));

app.post('/compile', OnCompile);
