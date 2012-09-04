window.onload = function () {
	button = document.getElementById("dclick");
	room = document.getElementById("roomName");
	room.addEventListener("keyup", ent, false);
	button.addEventListener("click", go, false);
};

function go() {
	var name = document.getElementById("roomName").value;
	if(name !== "") {
		window.location.replace("/?" + name);
	}
}

function ent(event) {
	if (event.keyCode === 13) {
		//the enter key was pressed, submit the message
		var name = document.getElementById("roomName").value;
		if(name !== "") {
			window.location.replace("/?" + name);
		}
	}
}