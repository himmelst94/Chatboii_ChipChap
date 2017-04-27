$(document).ready(function(){
	// WebSocket

	var socket = io.connect();
	var name;



	
	$('#content').hide();
	socket.on('disconnection', function(data) {
		console.log('client');
		socket.emit('chat', { name: 'Server', text: 'User '+data.name+' has left the chatroom.', messageTo:'' });		
	});
	// new message
	socket.on('pmFrom', function(data){
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
	
	socket.on('pmTo', function(data){
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
		socket.on('chat', function (data) {
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
			socket.emit('chat', { name: name, text: text, messageTo:messageTo});
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
		
		socket.emit('new user', {name:name, password:password}, function(data){
			console.log(data + "Data in cvlient");
			console.log(data.callback + "Data.callback in client");
			if(data==true){
				console.log("In if in client");
				$('#username').hide();
				$('#content').show();  
				socket.emit('chat', { name: 'Server', text: 'User '+name+' has entered the chatroom.', messageTo:''});
			}
			else{
				window.alert("Username or Password not valid.");
			}
		});
		
	}
//	register to the chatroom
	function register(){
		// reading input
		name = $('#name').val();
		var password = $('#password').val();
		
		socket.emit('register', { name: name, password: password},  function(data){
			if(data==true){
				$('#username').hide();
				$('#content').show();  
				socket.emit('chat', { name: 'Server', text: 'User '+name+' has entered the chatroom.', messageTo:''});	
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