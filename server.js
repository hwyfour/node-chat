var app	= require('http').createServer(onRequest);
var url	= require("url");
var io	= require('socket.io').listen(app);
var fs	= require('fs');

app.listen(80);

function route(response, path) {
	console.log("Request handler " + path + " was called.");
	fs.readFile(__dirname + path, function (error, data) {
		if (error) {
			//the file could not be found
			response.writeHead(500);
			return response.end('Error loading ' + path);
		}
		response.writeHead(200);
		response.end(data);
	});
}

function onRequest(request, response) {
	//serve the chat html
	var path = url.parse(request.url).pathname;

	request.setEncoding("utf8");

	request.addListener("end", function() {
		route(response, path);
	});
}

io.sockets.on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log(data);
	});
});