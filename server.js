var app					= require('http').createServer(onRequest);
var io					= require('socket.io').listen(app);
var nostat				= require('node-static');
var parser				= require('url');
var file				= new nostat.Server('./files', { cache: 0 });
var clients 			= {};
var roomAssociations	= {};

app.listen(80);

/* Handles any http request that comes down the line. */
function onRequest(request, response) {
	if(parser.parse(request.url).query != undefined) {
		request.url = "/";
	}
	//if the request is for /, change the request to index.htm
	if(request.url === "/")
		request.url = "/index.htm";
	request.addListener('end', function () {
		file.serve(request, response);
	});
}

io.sockets.on('connection', function (socket) {
	//when a client connects, push it onto stack of connected clients
	var room = "default";
	clients[socket.id] = socket;
	
	//the initial message from the client with the current URL
	socket.on('clientURL', function (clientData) {
		var query = parser.parse(clientData.data).query;
		if(query != undefined) {
			room = query;
		}
		roomAssociations[socket.id] = room;
	});

	//the server receives a message from any client
	socket.on('clientMessage', function (clientData) {
		//emit the message back to every client in the same room
		for(var x in clients) {
			if(roomAssociations[clients[x].id] === room) {
				clients[x].emit('serverMessage', {data: clientData.data});
			}
		}
	});

	socket.on('disconnect', function () {
		delete clients[socket.id];
		delete roomAssociations[socket.id];
	});
});