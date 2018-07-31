var config = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	physics: {
	default: 'arcade',
		arcade: {
			gravity: { y: 2400 },
			debug: false
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
var scoreText

function preload() {
	this.load.image('sky', 'assets/sky.png');
	this.load.image('ground', 'assets/platform.png');
	this.load.image('star', 'assets/star.png');
	this.load.image('bomb', 'assets/bomb.png');
	this.load.spritesheet('mainChar', 'assets/dude.png', {frameWidth: 32, frameHeight: 48});
}

function create() {
	this.add.image(0, 0, 'sky').setOrigin(0,0);

	platforms = this.physics.add.group({gravityY: -2400});
	makeShip(400, 568, 'ground')//.setScale(2).refreshBody();
	makeShip(600, 400, 'ground');
	makeShip(50, 250, 'ground');
	makeShip(750, 220, 'ground');

	player = this.physics.add.sprite(400, 300, 'mainChar');
	player.setCollideWorldBounds(true);

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
		repeat: -1
	});
	this.anims.create({
		key: 'double',
		frames: [{key: 'mainChar', frame: 9}],
		frameRate: 20,
	});

	cursors = this.input.keyboard.createCursorKeys();

	/*stars = this.physics.add.group({
		key: 'star',
		repeat: 11,
		setXY: { x: 12, y: 0, stepX: 70 }
	});*/

	this.physics.add.collider(player, platforms);
	//this.physics.add.collider(stars, platforms);
	//this.physics.add.overlap(player, stars, collectStar, null, this);

	scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

	this.animTime = 0
	this.didJump = false
	this.airJumped = false
}

function update() {
	if (cursors.left.isDown) {
		platforms.setVelocityX(700);
		player.anims.play('left', true);
	} else if (cursors.right.isDown) {
		platforms.setVelocityX(-700);
		player.anims.play('right', true);
	} else {
		platforms.setVelocityX(0);
		player.anims.play('turn');
	}

	//jumping
	if (cursors.up.isDown && player.body.touching.down) {
		player.setVelocityY(-1000);
	}

	//reset doublejump vars when you touch the ground
	if (player.body.touching.down) {
		if (this.allowJump) {
			this.allowJump = false				
		}

		if (this.airJumped) {
			this.airJumped = false
		}

		if (this.animTime != 0) {
			this.animTime = 0
		}
	}

	//make sure they have released key while in the air before you allow double jumping
	if (!player.body.touching.down && !cursors.up.isDown && !this.airJumped) {
		this.airJumped = true
		this.allowJump = true
	}

	//double jump
	if (cursors.up.isDown && !player.body.touching.down && this.allowJump) {
		player.setVelocityY(-1000);
		this.animTime = 1
		this.allowJump = false
	}

	//show double jump animation for 10 frames then stop showing it
	if (this.animTime > 10) {
		this.animTime = 0
	} else if (this.animTime > 0) {
		this.animTime += 1
		player.anims.play('double')
	}

	console.log()

}

function makeShip(len,width,texture) {
	var ship = platforms.create(len,width,texture)
	ship.body.immovable = true;
}

function collectStar (player, star) {
	star.disableBody(true, true);

	score += 10;
	scoreText.setText('Score: ' + score);
}
