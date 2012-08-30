var app		= require('http').createServer(onRequest);
var io		= require('socket.io').listen(app);
var nostat	= require('node-static');
var file	= new nostat.Server('./files', { cache: 0 });

app.listen(80);

/* Handles any http request that comes down the line. */
function onRequest(request, response) {
	//if the request is for /, change the request to index.htm
	if(request.url === "/")
		request.url = "/index.htm";
	request.addListener('end', function () {
		file.serve(request, response);
	});
}

io.sockets.on('connection', function (socket) {
	//when a client connects
	socket.on('clientMessage', function (clientData) {
		//emit the message back to the client
		socket.emit('serverMessage', {data: clientData.data});
	});
});