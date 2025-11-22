const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 0.7
let gamePaused = false
let animationId

const background = new Sprite({
  position: { x: 0, y: 0 },
  imageSrc: './img/background1.png'
})

const player = new Fighter({
  position: { x: 100, y: 10 },
  velocity: { x: 0, y: 0 },
  offset: { x: 0, y: 0 },
  imageSrc: './img/samuraiMack/Idle.png',
  framesMax: 8,
  scale: 2.5,
  offset: { x: 215, y: 200 },
  sprites: {
    idle: { imageSrc: './img/samuraiMack/Idle.png', framesMax: 8 },
    run: { imageSrc: './img/samuraiMack/Run.png', framesMax: 8 },
    jump: { imageSrc: './img/samuraiMack/Jump.png', framesMax: 2 },
    fall: { imageSrc: './img/samuraiMack/Fall.png', framesMax: 2 },
    attack1: { imageSrc: './img/samuraiMack/Attack1.png', framesMax: 6 },
    takeHit: { imageSrc: './img/samuraiMack/Take Hit - white silhouette.png', framesMax: 4 },
    death: { imageSrc: './img/samuraiMack/Death.png', framesMax: 6 }
  },
  attackBox: { offset: { x: 100, y: 50 }, width: 160, height: 50 }
})

const enemy = new Fighter1({
  position: { x: 800, y: 0 },
  velocity: { x: 0, y: 0 },
  color: 'blue',
  offset: { x: -50, y: 0 },
  imageSrc: './img/kenji1/Idle.png',
  framesMax: 10,
  scale: 2.5,
  offset: { x: 215, y: 135 },
  sprites: {
    idle: { imageSrc: './img/kenji1/Idle.png', framesMax: 10 },
    run: { imageSrc: './img/kenji1/Run.png', framesMax: 8 },
    jump: { imageSrc: './img/kenji1/Jump.png', framesMax: 3 },
    fall: { imageSrc: './img/kenji1/Fall.png', framesMax: 3 },
    attack1: { imageSrc: './img/kenji1/Attack.png', framesMax: 13 },
    takeHit: { imageSrc: './img/kenji1/Take hit.png', framesMax: 3 },
    death: { imageSrc: './img/kenji1/Death.jpg', framesMax: 10000 }
  },
  attackBox: { offset: { x: -350, y: 50 }, width: 350, height: 50 }
})

console.log(player)

const keys = {
  a: { pressed: false },
  d: { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft: { pressed: false }
}

decreaseTimer()

function animate() {
  animationId = window.requestAnimationFrame(animate)

  if (gamePaused) return  // Stop updates while paused

  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)
  background.update()

  c.fillStyle = 'rgba(255, 255, 255, 0.15)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  player.update()
  enemy.update()

  player.velocity.x = 0
  enemy.velocity.x = 0

  // PLAYER MOVEMENT
  if (keys.a.pressed && player.lastKey === 'a') {
    player.velocity.x = -5
    player.switchSprite('run')
  } else if (keys.d.pressed && player.lastKey === 'd') {
    player.velocity.x = 5
    player.switchSprite('run')
  } else {
    player.switchSprite('idle')
  }

  if (player.velocity.y < 0) player.switchSprite('jump')
  else if (player.velocity.y > 0) player.switchSprite('fall')

  // ENEMY MOVEMENT
  if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
    enemy.velocity.x = -6
    enemy.switchSprite('run')
  } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
    enemy.velocity.x = 6
    enemy.switchSprite('run')
  } else {
    enemy.switchSprite('idle')
  }

  if (enemy.velocity.y < 0) enemy.switchSprite('jump')
  else if (enemy.velocity.y > 0) enemy.switchSprite('fall')

  // COLLISION - PLAYER ATTACKS ENEMY
  if (rectangularCollision({ rectangle1: player, rectangle2: enemy }) &&
      player.isAttacking && player.framesCurrent === 4) {
    enemy.takeHit()
    player.isAttacking = false
    gsap.to('#enemyHealth', { width: enemy.health + '%' })
  }

  if (player.isAttacking && player.framesCurrent === 4) {
    player.isAttacking = false
  }

  // COLLISION - ENEMY ATTACKS PLAYER
  if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) &&
      enemy.isAttacking && enemy.framesCurrent === 2) {
    player.takeHit()
    enemy.isAttacking = false
    gsap.to('#playerHealth', { width: player.health + '%' })
  }

  if (enemy.isAttacking && enemy.framesCurrent === 2) {
    enemy.isAttacking = false
  }

  // CHECK WINNER
  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId })
  }
}

animate()

// --------------------------
//      KEY LISTENERS
// --------------------------

window.addEventListener('keydown', (event) => {
  // PAUSE GAME
  if (event.key === 'p') {
    gamePaused = true
    return
  }

  // RESUME GAME
  if (event.key === 'o') {
    if (gamePaused) {
      gamePaused = false
      // animation loop resumes automatically
    }
    return
  }

  if (!player.dead && !gamePaused) {
    switch (event.key) {
      case 'd':
        keys.d.pressed = true
        player.lastKey = 'd'
        break
      case 'a':
        keys.a.pressed = true
        player.lastKey = 'a'
        break
      case 'w':
        player.velocity.y = -20
        break
      case ' ':
        player.attack()
        break
    }
  }

  if (!enemy.dead && !gamePaused) {
    switch (event.key) {
      case 'ArrowRight':
        keys.ArrowRight.pressed = true
        enemy.lastKey = 'ArrowRight'
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        enemy.lastKey = 'ArrowLeft'
        break
      case 'ArrowUp':
        enemy.velocity.y = -20
        break
      case 'ArrowDown':
        enemy.attack()
        break
    }
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd': keys.d.pressed = false; break
    case 'a': keys.a.pressed = false; break
    case 'ArrowRight': keys.ArrowRight.pressed = false; break
    case 'ArrowLeft': keys.ArrowLeft.pressed = false; break
  }
})
