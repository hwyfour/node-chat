var app		= require('http').createServer(onRequest);
var path	= require('path');
var io		= require('socket.io').listen(app);
var fs		= require('fs');

app.listen(80);

function route(response, file) {
	var extension = path.extname(file);
	var contentType = 'text/html';
	switch (extension) {
		case '.js':
			contentType = 'application/javascript';
			break;
		case '.css':
			contentType = 'text/css';
			break;
	}
	console.log("Request handler " + file + " was called: " + extension);
	fs.readFile(__dirname + file, function (error, data) {
		if (error) {
			console.log(" " + error);
			response.writeHead(500);
			response.end();
		} else {
			console.log(file + " " + contentType);
			response.writeHead(200, { 'Content-Type': contentType });
			response.end(data);
		}
	});
}

/* Handles any http request that comes down the line. */
function onRequest(request, response) {
	//this is the pathname after .com
	var file = request.url;
	if (file === "/") {
		file = "/index.htm"
	}
	request.setEncoding("utf8");
	request.addListener("end", function() {
		console.log("route in");
		route(response, file);
		console.log("route out");
	});
}

io.sockets.on('connection', function (socket) {
	console.log("connected");
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log(data);
	});
});