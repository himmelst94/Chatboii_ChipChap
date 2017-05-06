var fs = require('fs');
//var CookieParser = require('cookie-parser');
//var redis = require('redis');
//var SECRET = 'hellonihao';
//var COOKIENAME = 'hello';
//var bodyParser = require('body-parser');
//var ExpressSession = require('express-session');
//var connectRedis = require('connect-redis');
//var RedisStore = connectRedis(ExpressSession);
//var rClient = redis.createClient();
//var sessionStore = new RedisStore({client: rClient});



var express = require('express')
,   app = express()
,	tls = require('tls')
,   conf = require('./config.json')
,	http = require('http')
,   server = http.createServer(app)
,   io = require('socket.io').listen(server)
,	users = {}
,	usernames=[];
//URL to our CLoudant DB
var cloudant = {
        url : "https://b927f661-bdfc-47bf-849d-68da02cf7f2d-bluemix:01323be4d0be2388e925965cc448da23eeaf556cb11dbd172bb1d085f7ecc2d0@b927f661-bdfc-47bf-849d-68da02cf7f2d-bluemix.cloudant.com"
};
//Connection to the db
var nano = require("nano")(cloudant.url),
db = nano.db.use("user");

var passwordHash = require('password-hash');
//var cookieParser = CookieParser(SECRET);
//
//var session = ExpressSession({
//	  store: sessionStore,
//	  secret: SECRET,
//	  resave: true,
//	  saveUninitialized: true
//	});
//
//app.use(cookieParser);
//app.use(express.session({store:sessionStore, key:'jsessionid', secret:'your secret here'}));

//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser);
//app.use(session)

var getPassword;
var dataPassword;
var Userloggedin;


server.listen(conf.port);
app.enable('trust proxy');
app.use(function (req, res, next) {
	console.log("USE Function");
    if (req.secure) {
            // request was via https, so do no special handling
            next();
    } else {
            // request was via http, so redirect to https
            res.redirect('https://' + req.headers.host + req.url);
    }
});

//fixed of some issues of the dynamic test
var helmet = require('helmet');

//Sets "X-XSS-Protection: 1; mode=block".
app.use(helmet.xssFilter());
//var xssFilter = require('x-xss-protection');
//app.use(xssFilter());
//app.use(xssFilter({ setOnOldIE: true }));

app.configure(function(){
	// return files
	app.use(express.static(__dirname + '/public'));
});

app.get('/', function (req, res) {
	res.setHeader("Content-Security-Policy");
	res.sendfile(__dirname + '/public/index.html');
});
//app.use(cookieParser);
//app.use(express.session({store:sessionStore, key:'jsessionid', secret:'your secret here'}));
// Websocket
io.sockets.on('connection', function (socket) {
	console.log('log: in socket');
	socket.emit('chat', { time: new Date(), name: 'Server', text: 'Welcome! You are now connected to the server.' });
	// user sends a message
	socket.on('chat', function (data) {
		// distributing the message to other users

		if(data.messageTo ===''){
			if(data.text === '/list'){
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
	
	
//	A user wants to login
	socket.on('new user', function(data, callback){
//		check if the username exist in our DB, when the user is not in the DB, a error occurs
		db.get(data.name, function(err, dataGet) {
			if (!err){
			getPassword =dataGet.password;
			dataPassword = data.password;
			
			if(passwordHash.verify(dataPassword, getPassword)===true){
				if(data.name ==='Server' || data.name==='server' || data.name==='Admin' || data.name==='admin' || data.name===''){
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
	

//a User wants to create a new User 	
	socket.on('register', function(data, callback){
		var checkUsername=false;
		var username = data.name;
//		check if the username exist in our DB, when the user is not in the DB, a error occurs
		db.get(username, function(err, dataGet) {
			if (!err){
				  callback(false);
			  }
			else{
				if(data.password===""){
					callback(false);
				}
				else if(data.name ==='Server' || data.name==='server' || data.name==='Admin' || data.name==='admin' || data.name===''){
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
					var hashedPassword = passwordHash.generate(data.password);
//					The new user gets inserted in our DB
					db.insert({ _id: data.name, password: hashedPassword  }, function(err, body) {
					  if (!err){
						  console.log(body);
					  }
					});
				
				}
			}
			
		});
		
			
		
		
//	}
});
//if a user disconnects from the server
	socket.on('disconnect', function(data){ 	
		io.sockets.emit('disconnection', {name: socket.nickname});	
		console.log('server '+ socket.nickname);
		usernames.splice(usernames.indexOf(socket.nickname),1);
		delete users[socket.nickname];
		});
	
});


console.log('The server is now running...');
