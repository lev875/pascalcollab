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
   			try {
    			var compile = spawn('/app/.apt/usr/bin/fpc-2.6.2', [name + '.pas']);
    		}
    		catch (err) {
    			console.error(err)
    		}
			var res = {
				output: '',
				err: '',
				ErrorsParse: function (name) {
					var x = this.err.split('\n')
					var i
	
					for (i = 0; i < x.length; i++) {
						if(x[i].search(name + '.pas\\(') === -1) {
							x.splice(i,1)
							i--;
						}
				  	}
					for (i = 0; i < x.length; i++) {
						x[i] = x[i].slice(name.length + 4)
					}
					this.err = x.join('\n')
				}
			};
	
			compile.stdout.on('data', data => {
    			console.log('stdout: ' + data);
				res.err += data;
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
						//res.ErrorsParse(name)
						response.json(res)
						fs.unlink(name, err => {
							if (err) return console.error(err);
							console.log(name + ' deleted');
						});
        			})
    			} else {
					//res.ErrorsParse(name)
					response.json(res)
				}
			})
		}
	});
}

app.get('/', OnRequest).listen(app.get('port'))

app.get('/assets/styles.css', (request, response) => {
	response.sendFile(path.join(__dirname+'/assets/styles.css'))
})

app.get('/assets/scripts.js', (request, response) => {
	response.sendFile(path.join(__dirname+'/assets/scripts.js'))
})

app.post('/compile', OnCompile)
