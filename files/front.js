var socket = io.connect('http://192.168.1.221');
var output;

function writeMsg(message) {
	var pre = document.createElement("p");
	pre.innerHTML = message;
	output.appendChild(pre);
}

socket.on('connect', function () {
	writeMsg("Connected");
});

socket.on('message', function (data) {
	writeMsg(data.hello);
});

window.onload = function () {
    output = document.getElementById("screen");
};