/* A client receives:
 *
 * connect				A connection confirmation message
 * roomInfo				The current room that the client belongs to
 * chatMessage			A regular chat message that we write to the screen
 * roomAdd				Room details that we add to the room list
 * roomDel				A room ID that we remove from the room list
 * nickMessage			An initial message that provides this client with a nickname
 * typingMessage		An alert that some client is writing a message
 * stopTypingMessage	An alert that some client stopped writing
 * clientJoin			An alert that some client joined the room
 * clientLeave			An alert that some client left the room
 * otherNickChange		An alert that some client changed its nickname
 *
 * A client sends:
 *
 * clientURL			The current URL of this client. This is the current room identifier
 * clientMessage		A chat message sent by this client
 * clientTyping			An alert that this client is typing
 * clientNotTyping		An alert that this client stopped typing
 * clientNick			A message with a new nickname that the server stores for this client
 *
 */

var socket;
var output;
var userMsg;
var userNick;
var roomPanel;
var currentRoom;
var currentlyTyping = false;	//flag to control when a 'currently typing' message is emitted

/* Listener initialization, then we push the chat panel to the right to clear the
 * room panel in a graphically pleasing manner. After this, we initialize the socket
 * connection and its subsequent message handlers.
 */
window.onload = function () {
	output = document.getElementById("screen");
	userMsg = document.getElementById("userMsg");
	userNick = document.getElementById("userNick");
	roomPanel = document.getElementById("rooms");

	userMsg.addEventListener("keydown", userInput, false);
	userMsg.addEventListener("input", userTyping, false);
	userNick.addEventListener("keydown", nickInput, false);

	//push the chat panel to the right so it clears the room list.
	document.getElementById('write').style.paddingLeft = roomPanel.clientWidth + 40 + "px";

	//initialize the socket after the dom has loaded to force a linear execution order
	socket = io.connect('216.19.181.111');

	/* When a client first connects, we send the current URL
	 * back to the server to be used as the current chatroom.
	 * We also update the status div to show that we are connected.
	 */
	socket.on('connect', function () {
		//change the status div to 'connected'
		var temp = document.getElementById("status");
		temp.className = "connected";
		temp.firstChild.innerHTML = "Connected";

		socket.emit('clientURL', {data: document.URL});
	});

	/* When a client sends its URL, it is returned this value which is its current room
	 * as known by the server.
	 */
	socket.on('roomInfo', function (data) {
		currentRoom = data.data;
		if (currentRoom === undefined) {
			currentRoom = "";
		}
	});

	/* When a client receives a message, we write it to the chat
	 * panel and then scroll to the very bottom of the page to
	 * keep the conversation focused on this last chat message.
	 */
	socket.on('chatMessage', function (data) {
		var pre = document.createElement("p");
		pre.innerHTML = data.data.timeStamp + " " + data.data.nick + ": " + data.data.msg;
		var red = document.createElement("div");
		red.className = "message";
		red.appendChild(pre);
		output.appendChild(red);

		//a fix to keep the page scrolled to the bottom
		window.scrollTo(0, document.getElementById("write").clientHeight + 5000);
	});

	/* Every time the server sends us an update that says a new
	 * room has been created, this function writes the particulars
	 * to the room list. When a client first connects, this function
	 * will be called numerous times to populate the room list with
	 * all available rooms.
	 */
	socket.on('roomAdd', function (data) {
		var query = data.data;
		var pre = document.createElement("span");
		var red = document.createElement("article");
		var out = document.createElement("a");
		//if this is the default room, apply the correct styling
		if (query === "") {
			pre.innerHTML = "Default";
			out.href = "/";
			out.id = "room-" + query;
		} else {
			pre.innerHTML = query.split("%20").join("&nbsp;");
			out.href = "?" + query;
			out.id = "room-" + query;
		}
		//if the room query matches the current URL, make this one selected
		if (query === currentRoom) {
			red.className = "selected";
		}
		var id = out.id;
		red.appendChild(pre);
		out.appendChild(red);
		var last = document.getElementById("addition");
		out.style.display = "none";
		roomPanel.insertBefore(out, last);
		document.getElementById(id).getAttribute("style");		//Render fix
		document.getElementById(id).removeAttribute("style");	//Render fix
		document.getElementById('write').style.paddingLeft = roomPanel.clientWidth + 40 + "px";
	});

	/* Remove a room from the list of active rooms. This function is called
	 * when the server alerts us that a room is empty.
	 */
	socket.on('roomDel', function (data) {
		var pre = document.getElementById("room-" + data.data);
		roomPanel.removeChild(pre);
		//resize the chat panel so it displays with the proper padding against the room panel.
		document.getElementById('write').style.paddingLeft = roomPanel.clientWidth + 40 + "px";
	});

	/* This function is called when the server responds that the user
	 * has changed their nickname. The function serves as an affirmative
	 * response that the nickname has been changed successfully on the server.
	 * To visualize that the server has indeed assigned a nickname to the client,
	 * the nickname placeholder is updated with this new nickname.
	 */
	socket.on('nickMessage', function (data) {
		userNick.placeholder = data.data;
	});

	/* When a different client starts typing, the server is alerted
	 * which in turn alerts all other clients connected to the same
	 * room. This alert is then written to the chat panel just like
	 * a regular chat message. This function handles the alert we
	 * received from the server.
	 */
	socket.on('typingMessage', function (data) {
		var pre = document.createElement("p");
		pre.innerHTML = data.nick + " is currently typing";
		var red = document.createElement("div");
		red.className = "alert yellow";
		red.id = data.nick;
		red.appendChild(pre);
		output.appendChild(red);

		//a fix to keep the page scrolled to the bottom
		window.scrollTo(0, document.getElementById("write").clientHeight + 5000);
	});

	/* Remove the message that shows that a different client is typing.
	 * Generally, this is called when that client erases all of
	 * their input or submits a message to the server. In either
	 * case, there is no more typing happening, so we are alerted to this.
	 */
	socket.on('stopTypingMessage', function (data) {
		var pre = document.getElementById(data.nick);
		output.removeChild(pre);
	});

	/* When a client joins the room, we receive this message.
	 * Just like a 'currently typing' message, we write this to the chat panel.
	 */
	socket.on('clientJoin', function (data) {
		var pre = document.createElement("p");
		pre.innerHTML = data.nick + " has joined the room";
		var red = document.createElement("div");
		red.className = "alert green";
		red.appendChild(pre);
		output.appendChild(red);

		//a fix to keep the page scrolled to the bottom
		window.scrollTo(0, document.getElementById("write").clientHeight + 5000);
	});

	/* When a client leaves the room, we receive this message.
	 * Just like a 'currently typing' message, we write this to the chat panel.
	 */
	socket.on('clientLeave', function (data) {
		var pre = document.createElement("p");
		pre.innerHTML = data.nick + " has left the room";
		var red = document.createElement("div");
		red.className = "alert orange";
		red.appendChild(pre);
		output.appendChild(red);

		//a fix to keep the page scrolled to the bottom
		window.scrollTo(0, document.getElementById("write").clientHeight + 5000);
	});

	/* When a client changes their nickname, we receive this message.
	 * Just like a 'currently typing' message, we write this to the chat panel.
	 */
	socket.on('otherNickChange', function (data) {
		var pre = document.createElement("p");
		pre.innerHTML = data.old + " is now known as " + data.changed;
		var red = document.createElement("div");
		red.className = "alert blue";
		red.appendChild(pre);
		output.appendChild(red);

		//a fix to keep the page scrolled to the bottom
		window.scrollTo(0, document.getElementById("write").clientHeight + 5000);
	});
};

/* When a user presses enter in the input box, we run this code.
 * If the input box isn't empty, we send the input to the server as a
 * message and then clear the input box.
 */
function userInput(event) {
	if (event.keyCode === 13) {
		//the enter key was pressed, submit the message
		var msg = userMsg.value.replace(/<\/?[^>]+(>|$)/g, "");
		if (msg !== "") {
			socket.emit('clientMessage', {data: msg});
			//clear the input for re-use
			userMsg.value = "";
			//because the message has been sent, the client is no longer typing.
			currentlyTyping = false;
			socket.emit('clientNotTyping', {data: 0});
		}
	}
}

/* When a user hits any key in the input box, this function is called.
 * If the box isn't empty, alert the server that the user is typing.
 * If the box is empty, the user is not typing anything anymore and
 * the server is alerted to this.
 */
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

/* When a user presses enter in the nickname box, we run this code.
 * If the box isn't empty, we send the nickname to the server and
 * lock the nickname box so the user can't change their new nickname.
 */
function nickInput(event) {
	if (event.keyCode === 13) {
		//the enter key was pressed, submit the message
		var nick = userNick.value.replace(/<\/?[^>]+(>|$)/g, "");
		if (nick !== "") {
			socket.emit('clientNick', {data: nick});
			//lock the input
			userNick.disabled = true;
		}
	}
}