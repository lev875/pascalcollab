var express = require("express");
var app     = express();


app.get('/',function(req,res){
  res.sendFile(path.join('/index.html'));
});

app.listen(8080);

console.log("Running at Port 8080");