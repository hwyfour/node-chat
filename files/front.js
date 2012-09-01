var socket = io.connect('http://192.168.1.221');
var output;
var userMsg;
var userNick;

function writeMsg(message) {
	var pre = document.createElement("p");
	pre.innerHTML = message;
	output.appendChild(pre);
}

socket.on('connect', function () {
	socket.emit('clientURL', {data: document.URL});
	writeMsg("Connected");
});

socket.on('serverMessage', function (data) {
	writeMsg(data.nick + ": " + data.data);
});

function userTyping(event) {
	if(event.keyCode === 13) {
		//the enter key was pressed, submit the message
		var msg = userMsg.value;
		socket.emit('clientMessage', {data: msg});
		//clear the input for re-use
		userMsg.value = "";
	}
}

function nickTyping(event) {
	if(event.keyCode === 13) {
		//the enter key was pressed, submit the message
		var nick = userNick.value;
		socket.emit('clientNick', {data: nick});
		//lock the input
		userNick.disabled = true;
	}
}

window.onload = function () {
	output = document.getElementById("screen");
	userMsg = document.getElementById("userMsg");
	userNick = document.getElementById("userNick");
	userMsg.addEventListener("keydown", userTyping, false);
	userNick.addEventListener("keydown", nickTyping, false);
};