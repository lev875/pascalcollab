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

    fs.writeFile(name + '.pas', request.body.code, 'utf8', err => {
  		if (err) return console.error(err);
   		else {
    		var compile = spawn('fpc', [name + '.pas']);
			var res = {
				output: '',
				err: '',
			};
	
			compile.stdout.on('data', data => {
    			console.log('stdout: ' + data);
				res.output += data;
			});
			compile.stderr.on('data', data => {
				res.err += data;		
			});
			compile.on('close', data => {
				fs.unlink(name + '.pas', err => {
					if (err) return console.error(err);
					console.log(name + '.pas deleted');
				});
				fs.unlink(name + '.o', err => {
					if (err) return console.error(err);
					console.log(name + '.o deleted');
				});
    			if (data === 0) {
        			var run = spawn('./' + name, []);

        			setTimeout(() => {console.log(name + ' killed'); run.kill()}, 5000);

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
            			response.json(res)
						console.log(res)
						fs.unlink(name, err => {
							if (err) return console.error(err);
							console.log(name + ' deleted');
						});
        			})
    			} else {
					response.json(res);
					console.log(res)
				}
			})
		}
	});
}

app.get('/', OnRequest).listen(app.get('port'));

app.get('/assets/styles.css', (request, response) => {
	response.sendFile(path.join(__dirname+'/assets/styles.css'));
})

app.get('/assets/scripts.js', (request, response) => {
	response.sendFile(path.join(__dirname+'/assets/scripts.js'));
})

app.post('/compile', OnCompile);
