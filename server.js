var app = require('http').createServer(onRequest);
var io = require('socket.io').listen(app);
var fs = require('fs');

app.listen(80);

function onRequest(request, response) {
	//serve the chat html
	fs.readFile(__dirname + '/index.htm', function (error, data) {
		if (error) {
			response.writeHead(500);
			return response.end('Error loading index.htm');
		}
		response.writeHead(200);
		response.end(data);
	});
}

io.sockets.on('connection', function (socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
		console.log(data);
	});
});