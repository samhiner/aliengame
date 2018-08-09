var config = {
	type: Phaser.AUTO,
	physics: {
	default: 'arcade',
		arcade: {
			gravity: { y: 2400 },
			//debug: true
		}
	},
	scene: {
		preload: preload,
		create: create,
		update: update
	}
};

var game = new Phaser.Game(config);

var score = 0;
var scoreText;

function preload() {
	this.load.image('ground', 'assets/platform.png');
	this.load.image('star', 'assets/star.png');
	this.load.image('alien', 'assets/alien.png')
	this.load.image('bomb', 'assets/bomb.png');
	this.load.spritesheet('mainChar', 'assets/dude.png', {frameWidth: 30, frameHeight: 30});
}

function create() {
	resize();
	window.addEventListener("resize", resize, false);

	platforms = this.physics.add.staticGroup();

	player = this.physics.add.sprite(400, 0, 'mainChar');

	this.anims.create({
		key: 'left',
		frames: this.anims.generateFrameNumbers('mainChar', { start: 0, end: 3 }),
		frameRate: 10,
		repeat: -1
	});
	this.anims.create({
		key: 'turn',
		frames: [ { key: 'mainChar', frame: 4 } ],
		frameRate: 20
	});
	this.anims.create({
		key: 'right',
		frames: this.anims.generateFrameNumbers('mainChar', { start: 5, end: 8 }),
		frameRate: 10,
		repeat: -1,
	});
	this.anims.create({
		key: 'double',
		frames: [{key: 'mainChar', frame: 9}],
		frameRate: 20,
	});

	cursors = this.input.keyboard.createCursorKeys();

	stars = this.physics.add.group();
	aliens = this.physics.add.group(); //TODO: make aliens always be facing you.

	this.physics.add.collider(player, platforms);
	this.physics.add.collider(stars, platforms);
	this.physics.add.collider(aliens, platforms)
	this.physics.add.overlap(player, stars, collectStar, null, this);

	scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#ffffff' });

	this.animTime = 0
	this.didJump = false
	this.airJumped = false //TODO: rename

	this.lastShip = 0;

	var endArea = this.physics.add.sprite(19900,0,'ground').setOrigin(0,0).setScale(25);
	endArea.body.moves = false
	this.gameOver = false;
}

function update() {
	if (this.gameOver) {
		return;
	}

	//center camera around player
	this.cameras.main.scrollX = player.x - 500
	scoreText.x = player.x - 475;

	if (cursors.left.isDown) {
		player.setVelocityX(-700);
		player.anims.play('left', true);
	} else if (cursors.right.isDown) {
		player.setVelocityX(700);
		player.anims.play('right', true);
	} else {
		player.setVelocityX(0);
		player.anims.play('turn');
	}

	//jumping from the ground
	if (cursors.up.isDown && player.body.touching.down) {
		player.setVelocityY(-1000);
	}

	//reset doublejump vars when you touch the ground
	if (player.body.touching.down) {
		if (this.allowJump) {
			this.allowJump = false;
		}

		if (this.airJumped) {
			this.airJumped = false;
		}

		if (this.animTime != 0) {
			this.animTime = 0;
		}
	}

	//make sure they have released key while in the air before you allow double jumping
	if (!player.body.touching.down && !cursors.up.isDown && !this.airJumped) {
		this.airJumped = true;
		this.allowJump = true;
	}

	//double jump
	if (cursors.up.isDown && !player.body.touching.down && this.allowJump) {
		player.setVelocityY(-1000);
		this.animTime = 1;
		this.allowJump = false;
	}

	//show double jump animation for 10 frames then stop showing it
	if (this.animTime > 10) {
		this.animTime = 0;
	} else if (this.animTime > 0) {
		this.animTime += 1;
		player.anims.play('double');
	}

	//make new ship if player is nearing end of current ship
	if (player.x >= this.lastShip - 1000) {
		this.lastShip = makeShip(this.lastShip);
	}

	if (cursors.down.isDown) {
		console.log('X Coordinate: ' + String(player.x));
	}

	//TODO: figure out how to put game wins and losses into function
	if (player.x > 19910) {
		this.cameras.main.scrollX = 0;
		winGame();
		this.gameOver = true;
	} else if (player.y > 800) {
		this.cameras.main.scrollX = 0;
		loseGame();
		this.gameOver = true;
	}

}

function resize() {
	var canvas = document.querySelector("canvas");
	var windowWidth = window.innerWidth;
	var windowHeight = window.innerHeight;
	var windowRatio = windowWidth / windowHeight;
	var gameRatio = game.config.width / game.config.height;
	if (windowRatio < gameRatio) {
		canvas.style.width = windowWidth + "px";
		canvas.style.height = (windowWidth / gameRatio) + "px";
	} else {
		canvas.style.width = (windowHeight * gameRatio) + "px";
		canvas.style.height = windowHeight + "px";
	}
}

//make a new ship 300 pixels to the right of the last ship 
//and return the x-value of its right side so it can be used as lastShip next time this is run
function makeShip(lastShip) {
	var distance = Math.ceil(Math.random() * 500) + 500;
	console.log('Platform generated at ' + String(lastShip + distance) + ' pixels.');
	var shipSize = Math.ceil(Math.random() * 5);
	platforms.create(lastShip + distance, Math.ceil(Math.random() * 300) + 350, 'ground').setOrigin(0, 0).setScale(shipSize).refreshBody();
	var newLastShip = (lastShip + distance) + (shipSize * 400);
	makeEntities(shipSize, lastShip + distance, newLastShip);
	return newLastShip;
}

//put starts and aliens at random point along the ship
function makeEntities(num,left,right) {
	let lastStar = left;
	let entities = [stars, aliens];
	let entityImages = ['star', 'alien'];
	for (y = 0; y < entities.length; y++) {
		for (x = 0; x < num; x++) {
			let position = Math.ceil(Math.random() * (right - left)) + left;
			if (position > 19900) {
				return
			}
			entities[y].create(position, 0 , entityImages[y]);
		}
	}
}

function fireGun() {
	let bullet = bullets.create();

	//get x and y distances between bullet and player
	let xDist = player.x - bullet.x;
	let yDist = player.y - bullet.y;

	//find the absolute distance between the player and bullet
	let totalDist = Math.sqrt(xDist^2 + yDist^2)

	//find out what the distances need to be multiplied by to make absolute distance 10000
	let distConstant = 10000/totalDist;

	//make the speed of x and y the distance times the constant
	//this makes the total speed equal to 10000 while also having the bullet move in the correct direction
	let xSpeed = xDist * distConstant;
	let ySpeed = yDist * distConstant;

	//make velocity along each dimension equal to 1000
	bullet.setVelocityX(xSpeed);
	bullet.setVelocityY(ySpeed);

	//TODO: use object pooling
	this.time.delayedCall(3000, deleteBullet(bullet), [], this);
}

function deleteBullet(bullet) {
	bullet.destroy();
}

//increase score when stars are collected
function collectStar(player, star) {
	star.disableBody(true, true);

	score += 10;
	scoreText.setText('Score: ' + score);
}

function winGame() {
	alert('You Win! Press OK to Restart.');
	location.reload();
}

function loseGame() {
	alert('You Lose. Press OK to Restart.');
	location.reload();
}