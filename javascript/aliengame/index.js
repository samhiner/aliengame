var config = {
	type: Phaser.AUTO,
	width: 20000,
	height: 800,
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
	//this.load.image('sky', 'assets/sky.png');
	this.load.image('ground', 'assets/platform.png');
	this.load.image('star', 'assets/star.png');
	this.load.image('bomb', 'assets/bomb.png');
	this.load.spritesheet('mainChar', 'assets/dude.png', {frameWidth: 30, frameHeight: 30});
}

function create() {
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

	stars = this.physics.add.group({
		key: 'star',
		repeat: 11,
		setXY: { x: 12, y: 0, stepX: 70 }
	});

	this.physics.add.collider(player, platforms);
	this.physics.add.collider(stars, platforms);
	this.physics.add.overlap(player, stars, collectStar, null, this);

	scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

	this.animTime = 0
	this.didJump = false
	this.airJumped = false //TODO: rename

	this.lastShip = 0;

	var endArea = this.physics.add.sprite(19900,0,'ground').setOrigin(0,0).setScale(25);
	endArea.body.moves = false
	this.gameOver = false;
}

function update() {
	//center camera around player
	this.cameras.main.scrollX = player.x - 500

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
		console.log(this.lastShip)
		this.lastShip = makeShip(this.lastShip)
		console.log(this.lastShip)
	}

	if (cursors.down.isDown) {
		console.log('X Coordinate: ' + String(player.x))
	}

	if (player.x > 19910 && this.gameOver == false) {
		winGame();
		this.gameOver = true;
	} else if (player.y > 800 && this.gameOver == false) {
		loseGame();
		this.gameOver = true;
	}
}

//make a new ship 300 pixels to the right of the last ship 
//and return the x-value of its right side so it can be used as lastShip next time this is run
function makeShip(lastShip) {
	var shipSize = Math.ceil(Math.random() * 5);
	var distance = Math.ceil(Math.random() * 500) + 500;
	platforms.create(lastShip + distance, Math.ceil(Math.random() * 300) + 350, 'ground').setOrigin(0, 0).setScale(shipSize).refreshBody();
	var newLastShip = (lastShip + distance) + (shipSize * 400);
	return newLastShip;
}

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
	alert('You Lose. Press OK to Restart.')
	location.reload();
}