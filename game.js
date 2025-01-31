// DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('gameOver');
const backgroundMusic = document.getElementById('backgroundMusic');

// Game variables
let mario = { x: 50, y: 300, width: 30, height: 40, dx: 0, dy: 0, jumpPower: -15, isJumping: false, frame: 0, direction: 'right', isInvincible: false };
let gravity = 0.5;
let keys = {};
let platforms = [];
let enemies = [];
let coins = [];
let score = 0;
let level = 1;
let isGameOver = false;
let isPaused = false;

// Load assets
const marioSprite = new Image();
marioSprite.src = 'assets/mario.png';
const jumpSound = new Audio('assets/jump.mp3');
const coinSound = new Audio('assets/coin.mp3');
const enemySound = new Audio('assets/enemy.mp3');

// Start background music
backgroundMusic.volume = 0.3;
backgroundMusic.play();

// Event listeners for controls
document.getElementById('left').addEventListener('touchstart', () => keys['ArrowLeft'] = true);
document.getElementById('left').addEventListener('touchend', () => keys['ArrowLeft'] = false);

document.getElementById('right').addEventListener('touchstart', () => keys['ArrowRight'] = true);
document.getElementById('right').addEventListener('touchend', () => keys['ArrowRight'] = false);

document.getElementById('jump').addEventListener('touchstart', () => keys['Space'] = true);
document.getElementById('jump').addEventListener('touchend', () => keys['Space'] = false);

document.getElementById('pause').addEventListener('click', togglePause);
document.getElementById('reset').addEventListener('click', resetGame);
document.getElementById('invincible').addEventListener('click', toggleInvincibility);

// Collision detection
function collide(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

// Circle collision detection
function circleCollide(circle, rect) {
  let distX = Math.abs(circle.x - rect.x - rect.width / 2);
  let distY = Math.abs(circle.y - rect.y - rect.height / 2);

  if (distX > (rect.width / 2 + circle.radius)) return false;
  if (distY > (rect.height / 2 + circle.radius)) return false;

  if (distX <= (rect.width / 2)) return true;
  if (distY <= (rect.height / 2)) return true;

  let dx = distX - rect.width / 2;
  let dy = distY - rect.height / 2;
  return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

// Draw Mario
function drawMario() {
  let frameWidth = 30, frameHeight = 40;
  let frameIndex = Math.floor(mario.frame) % 3; // 3 frames per row
  let sx = frameIndex * frameWidth;
  let sy = mario.direction === 'right' ? 0 : frameHeight;
  ctx.drawImage(marioSprite, sx, sy, frameWidth, frameHeight, mario.x, mario.y, mario.width, mario.height);
}

// Generate platforms
function generatePlatforms() {
  platforms = [];
  for (let i = 0; i < 3; i++) {
    let platform = {
      x: Math.random() * (canvas.width - 100),
      y: 100 + i * 100,
      width: 100,
      height: 10
    };
    platforms.push(platform);
  }
}

// Game loop
function gameLoop() {
  if (isGameOver || isPaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw platforms
  ctx.fillStyle = "green";
  platforms.forEach(platform => {
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  });

  // Draw coins
  ctx.fillStyle = "yellow";
  coins.forEach(coin => {
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });

  // Draw enemies
  ctx.fillStyle = "red";
  enemies.forEach(enemy => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Mario movement and physics
  if (keys['ArrowRight']) {
    mario.dx = 3;
    mario.direction = 'right';
    mario.frame += 0.2;
  } else if (keys['ArrowLeft']) {
    mario.dx = -3;
    mario.direction = 'left';
    mario.frame += 0.2;
  } else {
    mario.dx = 0;
  }

  mario.x += mario.dx;
  mario.dy += gravity;
  mario.y += mario.dy;

  // Platform collision
  let onGround = false;
  platforms.forEach(platform => {
    if (collide(mario, platform) && mario.dy >= 0) {
      mario.dy = 0;
      mario.y = platform.y - mario.height;
      onGround = true;
    }
  });

  mario.isJumping = !onGround;

  // Jump logic
  if (keys['Space'] && !mario.isJumping) {
    mario.dy = mario.jumpPower;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }

  // Keep Mario inside canvas
  if (mario.x < 0) mario.x = 0;
  if (mario.x + mario.width > canvas.width) mario.x = canvas.width - mario.width;
  if (mario.y > canvas.height) {
    isGameOver = true;
    gameOverScreen.style.display = 'block';
    backgroundMusic.pause();
  }

  // Enemy movement and collision
  enemies.forEach((enemy, index) => {
    enemy.x += enemy.dx;
    if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) enemy.dx *= -1;

    if (!mario.isInvincible && collide(mario, enemy)) {
      isGameOver = true;
      gameOverScreen.style.display = 'block';
      backgroundMusic.pause();
      enemySound.play();
    }
  });

  // Coin collection
  coins = coins.filter(coin => {
    if (circleCollide(coin, mario)) {
      score += 10;
      coinSound.currentTime = 0;
      coinSound.play();
      return false;
    }
    return true;
  });

  // Level progression
  if (coins.length === 0) {
    level++;
    generatePlatforms();
    enemies.push({ x: Math.random() * (canvas.width - 50), y: 330, width: 30, height: 30, dx: 2 });
    coins.push({ x: Math.random() * (canvas.width - 20), y: Math.random() * 200 + 50, radius: 10 });
  }

  // Draw score and level
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Level: ${level}`, 10, 60);

  // Draw Mario
  drawMario();

  requestAnimationFrame(gameLoop);
}

// Toggle pause
function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    backgroundMusic.pause();
  } else {
    backgroundMusic.play();
  }
}

// Reset game
function resetGame() {
  location.reload();
}

// Toggle invincibility
function toggleInvincibility() {
  mario.isInvincible = !mario.isInvincible;
}

// Start the game loop
generatePlatforms();
marioSprite.onload = gameLoop;