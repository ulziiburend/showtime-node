


exports.ar=function(req,res){
	console.log(res);

	var COLOR = [0, 255, 0]; 
	var cv =require('opencv');
	cv.readImage('images/6.jpg',function(err, im) {
		var tempImg;
		if (err) throw err;
		var width,height=0;
		if (im.width() < 1 || im.height() < 1) throw new Error('Image has no size');
		cv.readImage('images/7.jpg',function(err,temp){
			if (err) throw err;
			width=temp.width()-1;
			height=temp.height()-1;
			tempImg=temp;
		});


		var output = im.matchTemplate("images/7.jpg",3);
	// output.save('images/test1.jpg');

	var threshold=output.threshold(output, 0.94, 1., 3);
	var res  = output.minMaxLoc(im);
	console.log(res);

	var thresholdPoint=0.94;

	var tl=res.maxLoc;


	if(res.maxVal >= thresholdPoint){
		im.rectangle([tl.x, tl.y], [width,  height], COLOR, 2);
		im.save('images/test.jpg');
	}else{
		console.log("Matching image not found");
	}


});

}



exports.login = function(req, res) {

	var password = req.body.password;
	var email = req.body.email;
	req.getConnection(function(err, connection) {
		connection.query("SELECT id,name,profile_img FROM user where email=? and password=?", [email, password], function(err, rows) {
			if (err) 
				console.log(err);
			if(rows.length>0){
				res.send({response:1,name:rows[0].name,profile_img:rows[0].profile_img});
			}
			else{
				res.send({response:0});
			}


		});
	});
}
exports.explore = function(req, res) {
	var mode = req.body.mode;
	var query= "SELECT * from ar ";
	if(mode==1)
		query=query+"order by views desc;"
	req.getConnection(function(err, connection) {
		connection.query(query, function(err, rows) {
			if (err) 
				console.log(err);
			if(rows.length>0){
				res.send({response:1,data:rows});
			}
			else{
				res.send({response:0});
			}


		});
	});
}
exports.signUp = function(req, res) {
	var email = req.body.email;
	var password = req.body.password;
	var name = req.body.name;
	req.getConnection(function(err, connection) {
		connection.query("INSERT INTO user VALUES(null,?,?,?,?,CURRENT_TIMESTAMP)", [name, password ,email, "profile_img"], function(err, rows) {
			if (err) {
				console.log(err);
				if (err.errno == 1062) {

					connection.query("Select id,name,profile_img  from user where name=? and password=?", [name,password], function(err, rows) {
						if (err)
							console.log(err);
						res.send({response:2,name:rows[0].name,profile_img:rows[0].profile_img});
					});


				} else {
					res.send({
						response: 0
					});
				}
			} else {
				connection.query("Select id,name,profile_img  from user where name=? and password=?", [name,password], function(err, rows) {
					if (err)
						console.log(err);

					res.send({response:1,name:rows[0].name,profile_img:rows[0].profile_img});
				});
			}


		});

	});
}



exports.create = function(req, res) {


	var user_id = req.body.user_id;
	var name = req.body.title;

	var ar_target_path = 'public/ar/' ;
	var content_target_path = 'public/content/';
	if (typeof req.files.ar != 'undefined' && typeof req.files.content != 'undefined') {
		addFile(req.files.content,content_target_path,function(isContentUpload,cont_path){
			if(isContentUpload){
				addFile(req.files.ar,ar_target_path,function(isArUpload,ar_path){
					if(isArUpload){
						addToArTable(req,res,name,user_id,ar_path,cont_path);
					}
					else{
						res.send({
							response: 0
						});
					}
				});
			}
			else{
				res.send({
					response: 0
				});
			}

		});

} else {
	res.send({
		response: 0
	});
}
}
function addFile(file,target_path,callback){
	var fs = require('fs');
	var mkdirp = require('mkdirp');
	var tmp_path = file.path;
	var file_name = file.name;
	mkdirp(target_path, function(err) {
		if (err) {
			console.log(err);
			fs.unlink(tmp_path, function() {});
		}
	});
	fs.rename(tmp_path, target_path + file_name, function(err) {
		if (err) {
			console.log(err);
		}
		fs.unlink(tmp_path, function() {
			if (err) {
				console.log(err);

			} else {
				target_path=target_path.replace('public/','');
				callback(true,target_path + file_name);
			}
		});
	});
}
function addToArTable(req, res, name,user_id, ar_path, content_path) {
	console.log(name+user_id+ar_path+content_path);
	req.getConnection(function(err, connection) {
		connection.query("INSERT INTO ar VALUES(null,?,?,?,?,CURRENT_TIMESTAMP,0)", [name,user_id, content_path, ar_path], function(err, rows) {
			if (err) {
				console.log(err);
				res.send({
					response: 2
				});
			} else {
				res.send({
					response: 1
				});
			}
		});

	});
}



