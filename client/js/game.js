let MAP_WIDTH = 500;
let MAP_HEIGHT = 500;

const PIXEL_SIZE = 10;
const CAMERA_SPEED = 0.15;

var PLAYER_ID = -1;

var game;
var socket = io();

var cameraFollow;

var players;
var tails;
var food;
var map;
var names;

/* Server ping */
var startTime;

setInterval(function () {
	startTime = Date.now();
	socket.emit('ping2');
}, 2000);

socket.on('pong2', function () {
	let latency = Date.now() - startTime;
	if (latency < 100) {
		$("#ping-badge").removeClass("badge-danger");
		$("#ping-badge").addClass("badge-success");
	} else {
		$("#ping-badge").removeClass("badge-success");
		$("#ping-badge").addClass("badge-danger");
	}
	$("#server-ping").html(latency);
});


/* Init game engine*/
function preload() {
	game.load.image('background', '/client/img/game/background.png');
}

function create() {
	game.world.setBounds(0, 0, MAP_WIDTH * PIXEL_SIZE, MAP_HEIGHT * PIXEL_SIZE);
	game.add.tileSprite(0, 0, game.width * PIXEL_SIZE, game.height * PIXEL_SIZE, "background");

	game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
	game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;
	game.scale.parentIsWindow = true;

	cameraFollow = game.add.sprite(game.world.centerX, game.world.centerY);

	players = game.add.group();
	tails = game.add.group();
	food = game.add.group();
	map = game.add.group();
	names = game.add.group();

	game.camera.x = game.world.centerX;
	game.camera.y = game.world.centerY;
	game.camera.roundPx = false;
	game.camera.follow(cameraFollow, Phaser.Camera.FOLLOW_LOCKON, (CAMERA_SPEED / PIXEL_SIZE), (CAMERA_SPEED / PIXEL_SIZE));

	let g = game.add.graphics(0, 0);

	g.beginFill(0x222222, 1);
	g.drawRect(0, 0, MAP_WIDTH * PIXEL_SIZE, PIXEL_SIZE);
	g.drawRect(0, 0, PIXEL_SIZE, MAP_HEIGHT * PIXEL_SIZE);

	g.drawRect(0, (MAP_HEIGHT - 1) * PIXEL_SIZE, MAP_WIDTH * PIXEL_SIZE, MAP_HEIGHT * PIXEL_SIZE);
	g.drawRect((MAP_WIDTH - 1) * PIXEL_SIZE, 0, (MAP_HEIGHT) * PIXEL_SIZE, MAP_HEIGHT * PIXEL_SIZE);
	g.endFill();

	map.add(g);
}

/* Socket events */
socket.on("id", function (data) {
	PLAYER_ID = data.id;
	console.log("Your id is " + PLAYER_ID);
});

socket.on("death", function (data) {
	$("#total-score").html(data.score);
	$("#final-score").show();
	setTimeout(function () {
		$("#menu").fadeIn(1000);
		$("#player-info").fadeOut(1000);
		$("#btn_play").focus();
	}, 1000);
});

socket.on("spawn", function (data) {
	$("#menu").fadeOut(500);
	$("#player-info").fadeIn(500);
	try {
		game.camera.follow(null, Phaser.Camera.FOLLOW_LOCKON, 1, 1);
		game.camera.x = data.x * PIXEL_SIZE;
		game.camera.y = data.y * PIXEL_SIZE;
		game.camera.follow(cameraFollow, Phaser.Camera.FOLLOW_LOCKON, (CAMERA_SPEED / PIXEL_SIZE), (CAMERA_SPEED / PIXEL_SIZE));
	} catch (err) {
		console.log(err);
	}
});

socket.on("gamestate", function (data) {
	if (players == undefined || tails == undefined || food == undefined || names == undefined) {
		console.log("Waiting for engine to start...");
		return;
	}

	players.removeAll();
	tails.removeAll();
	food.removeAll();
	names.removeAll();

	let leaderboardcontent = "";
	while (data.leaderboard.length > 0) {
		let entry = data.leaderboard.pop();
		leaderboardcontent += '<div class="lb-entry ' + ((entry.id == PLAYER_ID) ? "lb-entry-self" : "") + '">' + (entry.place + 1) + ': ' + encodeHTML(entry.name) + '</div>';
	}

	$("#leaderboard-content").html(leaderboardcontent);

	for (let i = 0; i < data.food.length; i++) {
		let foodData = data.food[i];
		let g = game.add.graphics(foodData.x * PIXEL_SIZE, foodData.y * PIXEL_SIZE);
		g.beginFill(hslToHex(foodData.color, 100, 35), 1);
		g.drawRect(0, 0, PIXEL_SIZE, PIXEL_SIZE);
		g.endFill();
		food.add(g);
	}

	for (let i = 0; i < data.playerTails.length; i++) {
		let tail = data.playerTails[i];
		let g = game.add.graphics(tail.x * PIXEL_SIZE, tail.y * PIXEL_SIZE);
		g.beginFill(hslToHex(tail.color, 100, 25), 1);
		g.drawRect(0, 0, PIXEL_SIZE, PIXEL_SIZE);
		g.endFill();
		tails.add(g);
	}

	for (let i = 0; i < data.players.length; i++) {
		let player = data.players[i];
		let g = game.add.graphics(player.x * PIXEL_SIZE, player.y * PIXEL_SIZE);

		if (player.id == PLAYER_ID) {
			cameraFollow.x = (player.x * PIXEL_SIZE);
			cameraFollow.y = (player.y * PIXEL_SIZE);
			$("#player-score").html(player.score);
			$("#position").html("X: " + player.x + " Y: " + player.y);
		}

		g.beginFill(hslToHex(player.color, 100, 50), 1);
		g.drawRect(0, 0, PIXEL_SIZE, PIXEL_SIZE);
		g.endFill();
		players.add(g);

		let t = game.add.text(player.x * PIXEL_SIZE, (player.y * PIXEL_SIZE) - 10, player.name, { fill: "#000000", fontSize: "15px" });
		t.anchor.setTo(0.5);
		names.add(t);
	}
});

/* Functions */
function encodeHTML(s) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function hslToHex(h, s, l) {
	let rgb = Phaser.Color.HSLtoRGB(h / 360, s / 100, l / 100);
	return "0x" + componentToHex(rgb.r) + componentToHex(rgb.g) + componentToHex(rgb.b);
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function play() {
	socket.emit("spawn", { name: $("#name").val() });
}

/* Load */
$(document).ready(function () {
	try {
		let conf = JSON.parse($.ajax({
			async: false,
			cache: false,
			type: "GET",
			url: "/config"
		}).responseText);

		MAP_WIDTH = conf.MAP_WIDTH;
		MAP_HEIGHT = conf.MAP_HEIGHT;
		$("#name").attr('maxlength', conf.MAX_NAME_LENGTH);
	} catch (err) {
		console.log(err);
	}
	$("#final-score").hide();
	$("#btn_play").click(function () {
		play();
	});

	$("form").on('submit', function (e) {
		e.preventDefault();
		play();
	});

	$("#name").change(function () {
		setCookie("MultiplayerSnake-name", $("#name").val(), 365);
	});

	$("#name").focus();

	game = new Phaser.Game(800, 600, Phaser.CANVAS, 'snake-game', { preload: preload, create: create });

	try {
		let name = getCookie("MultiplayerSnake-name");
		if (name.length > 0 && name.length <= 16) {
			console.log("Loaded name from cookie: " + name);
			$("#name").val(name);
		}
	} catch (err) {
		console.log(err);
	}
});

/* Key listener */
$(document).keydown(function (e) {
	var key = 0;
	if (e == null) {
		key = event.keyCode;
	} else {
		key = e.which;
	}

	if ((key === 68 || key === 39)) { //d
		socket.emit('keyPress', {
			inputId: 'right',
			state: true
		});
	} else if ((key === 83 || key === 40)) { //s
		socket.emit('keyPress', {
			inputId: 'down',
			state: true
		});
	} else if ((key === 65 || key === 37)) { //a
		socket.emit('keyPress', {
			inputId: 'left',
			state: true
		});
	} else if ((key === 87 || key === 38)) { // w
		socket.emit('keyPress', {
			inputId: 'up',
			state: true
		});
	}
});