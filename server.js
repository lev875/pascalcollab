var express    = require('express');
var app        = express();
var path       = require('path');
var bodyParser = require('body-parser')
var spawn      = require('child_process').spawn;
var fs         = require('fs');
var shortid    = require('shortid');

app.set('port', (process.env.PORT || 8080));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

function OnRequest(request, response){
    response.sendFile(path.join(__dirname+'/index.html'));
}

function OnCompile(request, response) {
	var name = shortid.generate();

    fs.writeFile(name + '.cpp', request.body.code, 'utf8', (err) => {
  		if (err) return console.error(err);
   		else {
    		var compile = spawn('g++',['-o', name + '.out', name + '.cpp', '-Werror']);
			var res = {
				output: '',
				errors: ''
			};
	
			compile.stdout.on('data', (data) => {
    			console.log('stdout: ' + data);
			});
			compile.stderr.on('data', (data) => {
				console.log(String(data));
				res.errors += data;		
			});
			compile.on('close', (data) => {
				fs.unlink(name + '.cpp', (err) => {
					if (err) return console.error(err);
					console.log(name + '.cpp deleted');
				});
    			if (data === 0) {
        			var run = spawn('./' + name + '.out', []);
        			setTimeout(function(){console.log(name + '.out killed'); run.kill()}, 5000);

					if(request.body.input != '') {
						run.stdin.write(request.body.input);
						run.stdin.end();
					}        	
        			run.stdout.on('data', (output) => {
            			console.log(String(output));
            			res.output += output;
        			});
        			run.stderr.on('data', (output) => {
            			console.log(String(output));
            			res.errors += output;
        			});
        			run.on('close', (output) => {
            			console.log('stdout: ' + output);
            			response.send(JSON.stringify(res));
						fs.unlink(name + '.out', (err) => {
							if (err) return console.error(err);
							console.log(name + '.out deleted');
						});
        			})
    			} response.send(JSON.stringify(res));
			})
		}
	});
}

app.get('/', OnRequest).listen(app.get('port'));

app.post('/compile', OnCompile);
