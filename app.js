"use strict";
var express = require('express');
var fs=require('fs');


//upload
var multer = require('multer');
var UPLOAD_PATH = "images/";

var fileUploadCompleted = false;
var uploadedPath='';

//glob file directory path finder 

var glob = require("glob")
//openCV
var cv =require('opencv');

var path = require('path');
var http = require('http');
var data = require('./routes/data');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//multipart 
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var mysql = require('mysql');
var app = express();

var appDir = path.dirname(require.main.filename);
console.log(appDir);
app.engine('html', require('hogan-express'));
app.enable('view cache');

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));

app.use(bodyParser.urlencoded({'extended':'true'}));            

app.use(bodyParser.json());         
app.use(express.static(path.join(__dirname, 'public')));
var data = require('./routes/data');
var myConnection = require('express-myconnection'), 
dbOptions = {
	host: 'localhost',
	user: 'root',
	password: '',
	port: 3306,
	database: 'showtime'
};
//upload
var findFiles = multer({ dest: UPLOAD_PATH,
	rename: function (fieldname, filename) {
		return filename;
	},
	onFileUploadStart: function (file) {
		console.log("Started upload of: " + file.originalname);
	},
	onFileUploadComplete: function (file) {
		console.log("Finished upload of: " + file.fieldname + " to: " + file.path);
		uploadedPath=file.path;
		fileUploadCompleted = true;
	}
});

app.use(myConnection(mysql, dbOptions, 'request'));
app.post('/mobile/login', multipartMiddleware, data.login);
app.post('/mobile/signUp', multipartMiddleware, data.signUp);
app.post('/mobile/explore', multipartMiddleware, data.explore);
app.post('/mobile/create',multipartMiddleware,data.create);
app.post('/mobile/Ar',findFiles,function(req,res){
	if(fileUploadCompleted){
		fileUploadCompleted = false;
		
		var options,foundImgPath;
		glob("public/ar/**/*.*", options, function (er, files) {
			console.log(files);
			var found=false;
			for(var i=0;i<files.length;i++){
				cv.readImage(uploadedPath,function(err, im) {
					if (err) console.log (err);
					var width,height=0;
					if (im.width() < 1 || im.height() < 1) console.log('Image has no size');
					cv.readImage(files[i],function(err,temp){
						if (err) console.log (err);
						width=temp.width()-1;
						height=temp.height()-1;	
					});
					var output = im.matchTemplate(files[i],3);
					var threshold=output.threshold(output, 0.96, 1., 3);
					var res  = output.minMaxLoc(im);
					var thresholdPoint=0.96;
					if(res.maxVal >= thresholdPoint){
						var COLOR = [0, 255, 0]; 
							 var tl=res.maxLoc;
						im.rectangle([tl.x, tl.y], [width,  height], COLOR.RED, 2);
						im.save('public/content/test.jpg');
						console.log("Matching image  found");
						found=true;
						foundImgPath=files[i];
					}else{
						console.log("Matching image not found");
					}
				});
				if(found)break;
			}
			if(found){
				var content=foundImgPath.split('/')[2];
				res.send(
				{
					response:1,
					content:"public/content/"+content,
					cascade:"public/haar/"+content+".xml",
				}
				);
			}
			else
				res.send({response:0});
		})
}
});



http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

