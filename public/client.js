$(document).ready(function(){
	// WebSocket
	
	var tls = require('tls');
	var fs = require('fs');
	var conf = require('./config.json');
	var socket = io.connect();
	var name;

	var options = {
	   key  : fs.readFileSync('server.key'),
	   cert : fs.readFileSync('server.cert')
	};

	var client = tls.connect(conf.port, options, function () {
	   console.log(client.authorized ? 'Authorized' : 'Not authorized');
	});

	
	$('#content').hide();
	client.on('disconnection', function(data) {
		console.log('client');
		client.emit('chat', { name: 'Server', text: 'User '+data.name+' has left the chatroom.', messageTo:'' });		
	});
	// new message
	client.on('pmFrom', function(data){
		var time = new Date(data.time);
		$('#content').append(
			$('<li></li>').append(
				// Timestamp
				$('<span>').text('[' +
					(time.getHours() < 10 ? '0' + time.getHours() : time.getHours())
					+ ':' +
					(time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes())
					+ '] PM from '
				),
				// Name
				$('<b>').text(typeof(data.name) != 'anonymous' ? data.name + ': ' : ''),
				// Text
				$('<span>').text(data.text))
		);
		// scrollable
		$('body').scrollTop($('body')[0].scrollHeight);
	});
	
	client.on('pmTo', function(data){
		var time = new Date(data.time);
		$('#content').append(
			$('<li></li>').append(
				// Timestamp
				$('<span>').text('[' +
					(time.getHours() < 10 ? '0' + time.getHours() : time.getHours())
					+ ':' +
					(time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes())
					+ '] PM to '
				),
				// Name
				$('<b>').text(typeof(data.name) != 'anonymous' ? data.name + ': ' : ''),
				// Text
				$('<span>').text(data.text))
		);
		// scrollable
		$('body').scrollTop($('body')[0].scrollHeight);
	});
		client.on('chat', function (data) {
		var time = new Date(data.time);
		$('#content').append(
			$('<li></li>').append(
				// Timestamp
				$('<span>').text('[' +
					(time.getHours() < 10 ? '0' + time.getHours() : time.getHours())
					+ ':' +
					(time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes())
					+ '] '
				),
				// Name
				$('<b>').text(typeof(data.name) != 'anonymous' ? data.name + ': ' : ''),
				// Text
				$('<span>').text(data.text))
		);
		// scrollable
		$('body').scrollTop($('body')[0].scrollHeight);
	});
	// sending message
	function send(){
		// reading input
		var messageTo = $('#messageTo').val();
		var text = $('#text').val();
		
		if(text==='' || text===' '){
			window.alert('No empty messages allowed');
		}
		else {
			// Socket send
			client.emit('chat', { name: name, text: text, messageTo:messageTo});
			// clear input
			
			$('#text').val('');
			$('#messageTo').val('');
			
		}
	}
	//entering the chatroom
	function send_name(){
		// reading input
		name = $('#name').val();
		password = $('#password').val();
		
		client.emit('new user', {name:name, password:password}, function(data){
			console.log(data + "Data in cvlient");
			console.log(data.callback + "Data.callback in client");
			if(data==true){
				console.log("In if in client");
				$('#username').hide();
				$('#content').show();  
				client.emit('chat', { name: 'Server', text: 'User '+name+' has entered the chatroom.', messageTo:''});
			}
			else{
				window.alert("Username or Password not valid.");
			}
		});
		
	}
	
	function register(){
		// reading input
		name = $('#name').val();
		var password = $('#password').val();
		
		client.emit('register', { name: name, password: password},  function(data){
			if(data==true){
				$('#username').hide();
				$('#content').show();  
				client.emit('chat', { name: 'Server', text: 'User '+name+' has entered the chatroom.', messageTo:''});	
			}
			else{
				window.alert("Username is already taken.");
			}
		});
		
	}
	
	

	
	// onclick
	$('#send_message').click(send);
	$('#send_name').click(send_name);
	$('#register').click(register);
	// on enter-button
	$('#text').keypress(function (e) {
		if (e.which == 13) {
			send();
		}
	});
	
	
});