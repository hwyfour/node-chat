window.onload = function () {
	button = document.getElementById("dclick");
	room = document.getElementById("roomName");
	room.addEventListener("keyup", ent, false);
	button.addEventListener("click", go, false);
};

/* One way to go to the new room is by clicking the button.
 * This replaces the current page location with the root +
 * the room name.
 */
function go() {
	var name = document.getElementById("roomName").value;
	if(name !== "") {
		window.location.replace("/?" + name);
	}
}

/* Another way to go to the new room after inputting a name for it
 * is to just hit the enter key. This is keycode '13' and will bounce
 * the user to their new room.
 */
function ent(event) {
	if (event.keyCode === 13) {
		//the enter key was pressed, submit the message
		var name = document.getElementById("roomName").value;
		if(name !== "") {
			window.location.replace("/?" + name);
		}
	}
}