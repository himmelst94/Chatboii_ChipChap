//var fs = require('fs');
//var options = {
//		  key: fs.readFileSync('alt1-key.pem'),
//		  cert: fs.readFileSync('alt1-cert.pem')
//		};
//
var express = require('express')
,   app = express()
,	tls = require('tls')
,   conf = require('./config.json')
,	https = require('https')
//,	start = tls.createServer(options, app).listen(conf.port)
,   server = require('http').createServer(app)
,   io = require('socket.io').listen(server)
,	users = {}
,	usernames=[];

var cloudant = {
        url : "https://b927f661-bdfc-47bf-849d-68da02cf7f2d-bluemix:01323be4d0be2388e925965cc448da23eeaf556cb11dbd172bb1d085f7ecc2d0@b927f661-bdfc-47bf-849d-68da02cf7f2d-bluemix.cloudant.com"                  
};
var nano = require("nano")(cloudant.url),
db = nano.db.use("user");



var getPassword;
var dataPassword;
var Userloggedin;
// Webserver
//https.createServer(options, app).listen(conf.port, function () {
//	   console.log('Started!');
//	});

server.listen(conf.port);

app.configure(function(){
	// return files
	app.use(express.static(__dirname + '/public'));
});

app.get('/', function (req, res) {
	res.sendfile(__dirname + '/public/index.html');
});

// Websocket
io.sockets.on('connection', function (socket) {
	console.log('test Github');
	console.log('log: in socket');
	socket.emit('chat', { time: new Date(), name: 'Server', text: 'Welcome! You are now connected to the server.' });
	// user sends a message
	socket.on('chat', function (data) {
		// distributing the message to other users

		if(data.messageTo ==''){
			if(data.text == '/list'){
				var onlineUsers='';
				for(var i=0; i<usernames.length;i++){
					onlineUsers+=usernames[i];
					onlineUsers+= ', ';
				}
				socket.emit('chat', { time: new Date(), name: 'Server', text: 'Currently online user : ' + onlineUsers, messageTo:''});
				
			}else{
			console.log('log: in messages');
			io.sockets.emit('chat', { time: new Date(), name: data.name, text: data.text, messageTo:'' });
			}
		}
		else if(data.messageTo in users){
			users[data.messageTo].emit('pmFrom', { time: new Date(), name: data.name, text: data.text });
			users[data.name].emit('pmTo', { time: new Date(), name: data.messageTo, text: data.text });
		}
		else{
			window.alert('Username does not exist');
		}
	});
	
	socket.on('new user', function(data, callback){
		
		db.get(data.name, function(err, dataGet) {
			if (!err){
			getPassword =dataGet.password;
			dataPassword = data.password;
			if(getPassword == dataPassword){
				if(data.name =='Server' || data.name=='server' || data.name=='Admin' || data.name=='admin' || data.name==''){
					Userloggedin=true;
					callback(false);
					
				}
				else if (data.name in users){
					callback(false);
					Userloggedin=true;
				}
				else {
					socket.nickname = data.name;
					users[socket.nickname] = socket;
					usernames.push(data.name);
					callback(true);
				}
			}else{
				callback(false);
			}
			}
			else{
				callback(false);
			}
		});
		
	});
	

	
	socket.on('register', function(data, callback){
		var checkUsername=false;
		var username = data.name;
		console.log(username + " USERNAME------------------");
		db.get(username, function(err, dataGet) {
			if (!err){
				  callback(false);
			  }
			else{
				if(data.password==""){
					callback(false);
				}
				else if(data.name =='Server' || data.name=='server' || data.name=='Admin' || data.name=='admin' || data.name==''){
					callback(false);
				}
				else if (data.name in users){
					callback(false);
				}
				else{ 
					
					callback(true);
					socket.nickname = data.name;
					users[socket.nickname] = socket;
					usernames.push(data.name);
					var user = nano.use('user');
					console.log(data.name);
					console.log(data.password);
					db.insert({ _id: data.name, password: data.password  }, function(err, body) {
					  if (!err){
						  console.log(body);
					  }
					});
				
				}
			}
			
		});
		
			
		
		
//	}
});

	socket.on('disconnect', function(data){ 	
		io.sockets.emit('disconnection', {name: socket.nickname});	
		console.log('server '+ socket.nickname);
		usernames.splice(usernames.indexOf(socket.nickname),1);
		delete users[socket.nickname];
		});
	
});


console.log('The server is now running...');
