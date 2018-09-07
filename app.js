var express = require('express');
var app = express();
var serv = require('http').Server(app);
var colors = require('colors/safe');
var middleware = require('socketio-wildcard')();


var debug = typeof v8debug === 'object' || /--debug/.test(process.execArgv.join(' '));

console.log(colors.green("[Snake] Starting server..."));
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

//---------- Server settings ----------
var MAX_SOCKET_ACTIVITY_PER_SECOND = 1000;
var fps = 4;

var MAP_WIDTH = 500;
var MAP_HEIGHT = 500;
//-------------------------------------

var port = process.env.PORT || 80;
if(process.env.PORT == undefined) {
	console.log(colors.blue("[Snake] No port defined using default (80)"));
}

serv.listen(port);
var io = require("socket.io")(serv, {});
io.use(middleware);

console.log(colors.green("[Snake] Socket started on port " + port));

var SOCKET_LIST = {};
var SOCKET_ACTIVITY = {};
var PLAYER_LIST = {};
var FOOD_LIST = {};

var Food = function(x, y) {
	var self = {
		x:x,
		y:y
	}
	return self;
}


// Directions: 0 = up (-y), 1 = right (+x), 2 = down = (+y), 3 = left (-x)
var Player = function(id) {
	var self = {
		id:id,
		direction:0,
		x:MAP_WIDTH / 2,
		y:MAP_HEIGHT / 2,
		score:0,
		trail:[],
		inGame:false
	}

	self.update = function() {
		self.trail.push(new Trail(self.x, self.y));
		while(self.score < self.trail.length) {
			console.log("self.trail.pop();");
			delete self.trail.pop();
		}
		switch(self.direction) {
			case 0:
				self.y--;
				break;
			case 1:
				self.x++;
				break;
			case 2:
				self.y++;
				break;
			case 3:
				self.x--;
				break;
			default:
				break;
		}

		for(let p in PLAYER_LIST) {
			let player = PLAYER_LIST[p];
			for(let t in player.trail) {
				let ptrail = player.trail[t];
				if(self.x == ptrail.x && self.y == ptrail.y) {
					self.die();
					player.score+=(self.score / 2);
				}
			}
		}
	}

	self.die = function() {
		self.inGame = false;
		self.deleteTrail;
	}

	self.deleteTrail = function() {
		for (let i = self.trail.length; i > 0; i--) {
			self.trail.pop();
		}
	}

	self.spawn = function() {
		self.x = Math.floor(Math.random() * (MAP_WIDTH - 20)) + 10;
		self.y = Math.floor(Math.random() * (MAP_WIDTH - 20)) + 10;
		self.score = 0;
		self.inGame = true;
	}
	return self;
}

var Trail = function(x, y, playerId) {
	var self = {
		x:x,
		y:y,
		playerId:playerId
	}
	return self;
}

function update() {
	let playerPack = [];
	let trailPack = [];

	for (let p in PLAYER_LIST) {
		let player = PLAYER_LIST[p];

		if(player.inGame) {
			player.update();
			console.log(player.id + " x: " + player.x + " y: " + player.y);
			playerPack.push({
				id:player.id,
				x:player.x,
				y:player.y
			});
			for(let t in player.trail) {
				let trail = player.trail[t];
				trailPack.push({
					x:trail.x,
					y:trail.y
				});
			}
		}
	}
}

setInterval(function() {
	update();
}, 1000 / fps);

PLAYER_LIST[1337] = new Player(1337);
PLAYER_LIST[1337].spawn();
PLAYER_LIST[1337].score = 4;

function disconnectSocket(id) {
	SOCKET_LIST[id].disconnect();
	delete SOCKET_LIST[id];
	delete SOCKET_ACTIVITY[id];
}

io.sockets.on("connection", function(socket) {
	socket.id = Math.random();
	if(SOCKET_ACTIVITY[socket.id] == undefined) {
		SOCKET_ACTIVITY[socket.id] = 0;
	}
	SOCKET_LIST[socket.id] = socket;
	let player = Player(socket.id);
	PLAYER_LIST[socket.id] = player;
	console.log(colors.cyan("[Snake] Socket connection with id " + socket.id));
	socket.emit("id", {
		id:socket.id
	});
	
	socket.on("disconnect", function() {
		try {
			delete PLAYER_LIST[socket.id];
			console.log(colors.cyan("[Snake] Player with id " + socket.id + " disconnected"));
			disconnectSocket(socket.id);
		} catch(err) {
			if(debug) {
				throw err;
			}
		}
	});

	socket.on('keyPress',function(data){
		try {
			if(data.inputId === 'up')
				player.direction = 0;
			else if(data.inputId === 'right')
				player.direction = 1;
			else if(data.inputId === 'down')
				player.direction = 2;
			else if(data.inputId === 'left')
				player.direction = 3;
		} catch(err) {
			if(debug) {
				throw err;
			}
		}
	});

	socket.on("*", function(data) {
		try {
			SOCKET_ACTIVITY[socket.id]++;
			//console.log(data);
		} catch(err) {
			if(debug) {
				throw err;
			}
		}
	});
});

console.log(colors.green("[Snake] Server started "));
if(debug) {
	console.log("Running in debug mode");
}