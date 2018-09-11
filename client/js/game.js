var MAP_WIDTH = 500;
var MAP_HEIGHT = 500;

var PIXEL_SIZE = 10;

var PLAYER_ID = -1;


var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'snake', {create:create});
var socket = io();

var cameraFollow;

var players;
var tails;
var food;
var map;


function preUpdate() {
}

function create() {
	game.world.setBounds(0, 0, MAP_WIDTH * PIXEL_SIZE, MAP_HEIGHT * PIXEL_SIZE);
	game.stage.backgroundColor = "#FFFFFF";

	cameraFollow = game.add.sprite(game.world.centerX, game.world.centerY);

	players = game.add.group();
	tails = game.add.group();
	food = game.add.group();
	map = game.add.group();

	game.camera.follow(cameraFollow, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);

	let g = game.add.graphics(0, 0);

	g.beginFill(0x222222, 1);
	g.drawRect(0, 0, MAP_WIDTH * PIXEL_SIZE, PIXEL_SIZE);
	g.drawRect(0, 0, PIXEL_SIZE, MAP_HEIGHT * PIXEL_SIZE);

	g.drawRect(0, (MAP_HEIGHT - 1) * PIXEL_SIZE, MAP_WIDTH * PIXEL_SIZE, MAP_HEIGHT * PIXEL_SIZE);
	g.drawRect((MAP_WIDTH - 1) * PIXEL_SIZE, 0, (MAP_HEIGHT) * PIXEL_SIZE, MAP_HEIGHT * PIXEL_SIZE);
	g.endFill();
	
	map.add(g);
}

socket.on("id", function(data) {
	PLAYER_ID = data.id;
	console.log("Your id is " + PLAYER_ID);
});

socket.on("gamestate", function(data) {
	if(players == undefined || tails == undefined || food == undefined) {
		console.log("Waiting for groups to load");
		return;
	}

	players.removeAll();
	tails.removeAll();
	food.removeAll();
	
	for(let i = 0; i < data.food.length; i++) {
		let foodObj = data.food[i];
		let g = game.add.graphics(foodObj.x * PIXEL_SIZE, foodObj.y * PIXEL_SIZE); 
    	g.beginFill(0x000077, 1);
    	g.drawRect(0, 0, PIXEL_SIZE, PIXEL_SIZE);
    	g.endFill();
    	food.add(g);
	}

	for(let i = 0; i < data.playerTails.length; i++) {
		let tail = data.playerTails[i];
		let g = game.add.graphics(tail.x * PIXEL_SIZE, tail.y * PIXEL_SIZE); 
    	g.beginFill(0x000000, 1);
    	g.drawRect(0, 0, PIXEL_SIZE, PIXEL_SIZE);
    	g.endFill();
    	tails.add(g);
	}

	for(let i = 0; i < data.players.length; i++) {
		let player = data.players[i];
		let g = game.add.graphics(player.x* PIXEL_SIZE, player.y * PIXEL_SIZE); 

		let color = 0x770000;

		if(player.id == PLAYER_ID) {
			color = 0x007700;
			cameraFollow.x = (player.x * PIXEL_SIZE);
			cameraFollow.y = (player.y * PIXEL_SIZE);
			//game.camera.x = (player.x * PIXEL_SIZE) - (game.width / 2);
			//game.camera.y = (player.y * PIXEL_SIZE) - (game.height / 2);
		}

    	g.beginFill(color, 1);
    	g.drawRect(0, 0, PIXEL_SIZE, PIXEL_SIZE);
    	g.endFill();
    	players.add(g);
		//players.add(new Phaser.Rectangle((data.playerTails[i].x - (PIXEL_SIZE / 2)) * PIXEL_SIZE, (data.playerTails[i].y - (PIXEL_SIZE / 2)) * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE));
	}
});

$(document).keydown(function(e) { 
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