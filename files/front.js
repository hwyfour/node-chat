var socket = io.connect('http://192.168.1.221');
var output;
var userMsg;
var userNick;
var currentlyTyping = false;

function writeMsg(data) {
	var pre = document.createElement("p");
	pre.innerHTML = data.data.timeStamp + " " + data.data.nick + ": " + data.data.msg;
	var red = document.createElement("div");
	red.className = "message";
	red.id = data.data.id;
	red.appendChild(pre);
	output.appendChild(red);

	//a fix to keep the page scrolled to the bottom
	window.scrollTo(0, document.getElementById("write").clientHeight + 5000);
}

function writeConnect() {
	var temp = document.getElementById("status");
	temp.className = "connected";
	temp.firstChild.innerHTML = "Connected";
}

function writeTyping(nick) {
	var pre = document.createElement("p");
	pre.innerHTML = nick + " is currently typing.";
	var red = document.createElement("div");
	red.className = "message";
	red.id = nick;
	red.appendChild(pre);
	output.appendChild(red);

	//a fix to keep the page scrolled to the bottom
	window.scrollTo(0, document.getElementById("write").clientHeight + 5000);
}

function stopTyping(nick) {
	var pre = document.getElementById(nick);
	output.removeChild(pre);
}

socket.on('connect', function () {
	socket.emit('clientURL', {data: document.URL});
	writeConnect();
});

socket.on('serverMessage', function (data) {
	writeMsg(data);
});

socket.on('nickMessage', function (data) {
	userNick.placeholder = data.data;
});

socket.on('typingMessage', function (data) {
	writeTyping(data.nick);
});

socket.on('stopTypingMessage', function (data) {
	stopTyping(data.nick);
});

function userInput(event) {
	if (event.keyCode === 13) {
		//the enter key was pressed, submit the message
		var msg = userMsg.value;
		if (msg !== "") {
			socket.emit('clientMessage', {data: msg});
			//clear the input for re-use
			userMsg.value = "";
			currentlyTyping = false;
			socket.emit('clientNotTyping', {data: 0});
		}
	}
}

function userTyping(event) {
	if (userMsg.value !== "") {
		if (!currentlyTyping) {
			currentlyTyping = true;
			socket.emit('clientTyping', {data: 0});
		}
	} else {
		currentlyTyping = false;
		socket.emit('clientNotTyping', {data: 0});
	}
}

function nickInput(event) {
	if (event.keyCode === 13) {
		//the enter key was pressed, submit the message
		var nick = userNick.value;
		if (nick !== "") {
			socket.emit('clientNick', {data: nick});
			//lock the input
			userNick.disabled = true;
		}
	}
}

window.onload = function () {
	output = document.getElementById("screen");
	userMsg = document.getElementById("userMsg");
	userNick = document.getElementById("userNick");
	var width = document.getElementById("rooms").clientWidth;
	document.getElementById('write').style.paddingLeft = width + 40 + "px";
	userMsg.addEventListener("keydown", userInput, false);
	userMsg.addEventListener("input", userTyping, false);
	userNick.addEventListener("keydown", nickInput, false);
};