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

    fs.writeFile(name + '.cpp', request.body.code, 'utf8', err => {
  		if (err) return console.error(err);
   		else {
    		var compile = spawn('g++',['-o', name + '.out', name + '.cpp']);
			var res = {
				output: '',
				err: '',
			};
	
			compile.stdout.on('data', data => {
    			console.log('stdout: ' + data);
			});
			compile.stderr.on('data', data => {
				res.err += data;		
			});
			compile.on('close', data => {
				fs.unlink(name + '.cpp', err => {
					if (err) return console.error(err);
					console.log(name + '.cpp deleted');
				});
    			if (data === 0) {
        			var run = spawn('./' + name + '.out', []);

        			setTimeout(() => {console.log(name + '.out killed'); run.kill()}, 5000);

					if(request.body.input != '') {
						run.stdin.write(request.body.input);
						run.stdin.end();
					}
        			run.stdout.on('data', output => {
            			res.output += output;
        			});
        			run.stderr.on('data', output => {
            			res.err += output;
        			});
        			run.on('close', output => {
            			response.json(res);
						fs.unlink(name + '.out', err => {
							if (err) return console.error(err);
							console.log(name + '.out deleted');
						});
        			})
    			} else response.json(res);
			})
		}
	});
}

app.get('/', OnRequest).listen(app.get('port'));

app.post('/compile', OnCompile);
