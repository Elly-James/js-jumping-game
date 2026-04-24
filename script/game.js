const SETTINGS = {
  gravity:          0.55,   
  jumpStrength:    -13,    
  groundThickness:  4,      
  playerLeftEdge:   60,     
  startSpeed:       4,     
  speedGainPerLevel: 1.2,   
  pointsPerLevel:   200,    
  maxLevel:         5,     
  minSpawnDelay:    1100,   
  maxSpawnDelay:    2300,   
  scoreTickEvery:   100,    
  obstacleMinWidth: 28,     
  obstacleMaxWidth: 52,     
  obstacleMinHeight: 32,    
  obstacleMaxHeight: 72,
  
  
musicTracks: [
  'audio/level1.mp3',   
  'audio/level2.mp3',  
  'audio/level3.mp3',   
  'audio/level4.mp3',   
  'audio/level5.mp3',  
],
musicVolume: 0.4,         
};

const gameState = {
  isRunning:       false,   
  isPaused:        false,   
  score:           0,
  bestScore:       parseInt(localStorage.getItem('jumpRushBest') || '0', 10),
  lives:           3,
  level:           1,
  obstacleSpeed:   SETTINGS.startSpeed,
  jumpsUsed:       0,       
  jumpsAllowed:    1,       
  animFrameId:     null,
  spawnTimerId:    null,    
  scoreTimerId:    null,    
};
 
const player = {
  heightAboveGround: 0,   
  verticalSpeed:     0,   
  isOnGround:        true,
};
 
let activeObstacles = [];
 

const el = {

  gameScreen:       document.getElementById('game-screen'),
  playerChar:       document.getElementById('player'),
  groundLine:       document.getElementById('ground-line'),
  starLayer:        document.getElementById('star-layer'),
  cityLayer:        document.getElementById('city-layer'),
  pausedLabel:      document.getElementById('paused-label'),
 

  scoreDisplay:     document.getElementById('score-display'),
  bestScoreDisplay: document.getElementById('best-score-display'),
  livesDisplay:     document.getElementById('lives-display'),
  levelDisplay:     document.getElementById('level-display'),
  doubleJumpNotice: document.getElementById('double-jump-notice'),
 
  speedBars: [1, 2, 3, 4, 5].map(n => document.getElementById(`bar-${n}`)),
 
  helpButton:   document.getElementById('help-button'),
  pauseButton:  document.getElementById('pause-button'),
  quitButton:   document.getElementById('quit-button'),
 
  welcomePopup:  document.getElementById('welcome-popup'),
  pausePopup:    document.getElementById('pause-popup'),
  quitPopup:     document.getElementById('quit-popup'),
  gameOverPopup: document.getElementById('game-over-popup'),
 
  startButton:       document.getElementById('start-button'),
  resumeButton:      document.getElementById('resume-button'),
  openQuitButton:    document.getElementById('open-quit-button'),
  cancelQuitButton:  document.getElementById('cancel-quit-button'),
  confirmQuitButton: document.getElementById('confirm-quit-button'),
  playAgainButton:   document.getElementById('play-again-button'),
  showGuideButton:   document.getElementById('show-guide-button'),
 
  pausedScore: document.getElementById('paused-score'),
  pausedLevel: document.getElementById('paused-level'),
  pausedLives: document.getElementById('paused-lives'),

  quitScorePreview: document.getElementById('quit-score-preview'),
 

  finalScore:       document.getElementById('final-score'),
  finalBestScore:   document.getElementById('final-best-score'),
  finalLevel:       document.getElementById('final-level'),
  gameOverMessage:  document.getElementById('game-over-message'),
  newRecordMessage: document.getElementById('new-record-message'),

  bgMusic: document.getElementById('bg-music'),
  muteButton: document.getElementById('mute-button')
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getScreenWidth() {
  return el.gameScreen.offsetWidth;
}

function getPlayerSize() {
  const styles = getComputedStyle(document.documentElement);
  return {
    width:  parseInt(styles.getPropertyValue('--player-width'),  10),
    height: parseInt(styles.getPropertyValue('--player-height'), 10),
  };
}
 
function drawStars() {
  el.starLayer.innerHTML = '';
 
  for (let i = 0; i < 45; i++) {
    const star = document.createElement('div');
    star.className = 'star-dot';
    const size = randomBetween(1, 3);
 
    star.style.cssText = `
      width:              ${size}px;
      height:             ${size}px;
      left:               ${randomBetween(0, 100)}%;
      top:                ${randomBetween(4, 72)}%;
      animation-delay:    ${(Math.random() * 2).toFixed(2)}s;
      animation-duration: ${(1.4 + Math.random() * 1.2).toFixed(2)}s;
    `;
 
    el.starLayer.appendChild(star);
  }
}
 
function drawCityBuildings() {
  el.cityLayer.innerHTML = '';
  let xPosition = 0;
  const screenWidth = getScreenWidth();
 
  while (xPosition < screenWidth + 60) {
    const buildingWidth  = randomBetween(14, 40);
    const buildingHeight = randomBetween(20, 70);
 
    const building = document.createElement('div');
    building.className = 'city-building';
    building.style.cssText = `
      left:   ${xPosition}px;
      width:  ${buildingWidth}px;
      height: ${buildingHeight}px;
    `;
 
    el.cityLayer.appendChild(building);
    xPosition += buildingWidth + randomBetween(4, 16);
  }
}
 

function showScore() {
  el.scoreDisplay.textContent = gameState.score;
}
 
function showBestScore() {
  el.bestScoreDisplay.textContent = gameState.bestScore;
}

function showLives() {
  el.livesDisplay.textContent =
    gameState.lives > 0
      ? Array(gameState.lives).fill('♥').join(' ')
      : '—';
}
 
function showLevel() {
  el.levelDisplay.textContent = gameState.level;
}
 
function showSpeedBars() {
  el.speedBars.forEach((bar, index) => {
    bar.classList.toggle('is-active', index < gameState.level);
  });
}
 
function setHeaderButtonsActive(isActive) {
  el.pauseButton.disabled = !isActive;
  el.quitButton.disabled  = !isActive;
}
 
function calculateLevel() {
  return clampNumber(
    Math.floor(gameState.score / SETTINGS.pointsPerLevel) + 1,
    1,
    SETTINGS.maxLevel
  );
}
 
function checkAndApplyLevelUp() {
  const newLevel = calculateLevel();
  if (newLevel === gameState.level) return; 
 
  gameState.level         = newLevel;
  gameState.obstacleSpeed = SETTINGS.startSpeed + (newLevel - 1) * SETTINGS.speedGainPerLevel;
  gameState.jumpsAllowed  = newLevel >= 3 ? 2 : 1;
 
  showLevel();
  showSpeedBars();
  playMusicForLevel(gameState.level);   
 
  if (newLevel === 3) {
    showDoubleJumpNotice();
  }
}
 
function showDoubleJumpNotice() {
  el.doubleJumpNotice.classList.remove('is-invisible');
  setTimeout(() => {
    el.doubleJumpNotice.classList.add('is-invisible');
  }, 3000);
}


function playMusicForLevel(levelNumber) {
  const trackIndex = levelNumber - 1;                        
  const trackPath  = SETTINGS.musicTracks[trackIndex];
  if (el.bgMusic.src.endsWith(trackPath) && !el.bgMusic.paused) return;

  el.bgMusic.src    = trackPath;
  el.bgMusic.volume = SETTINGS.musicVolume;
  el.bgMusic.currentTime = 0;                                
  el.bgMusic.play().catch(() => {});
}

function pauseMusic() {
  if (!el.bgMusic.paused) {
    el.bgMusic.pause();
  }
}

function resumeMusic() {
  if (el.bgMusic.paused && el.bgMusic.src) {
    el.bgMusic.play().catch(() => {});
  }
}

function stopMusic() {
  el.bgMusic.pause();
  el.bgMusic.currentTime = 0;
  el.bgMusic.src = '';
}

function toggleMute() {
  el.bgMusic.muted = !el.bgMusic.muted;
  el.muteButton.textContent = el.bgMusic.muted ? '🔇' : '🔊';
}
 
function buildObstacleShape(shapeType, width, height, midX, colour) {
  if (shapeType === 0) {
    return `
      <rect x="${midX-5}"  y="0"            width="10" height="${height}"       rx="4" fill="${colour}" opacity="0.9"/>
      <rect x="${midX-15}" y="${height*0.3}" width="11" height="6"               rx="3" fill="${colour}" opacity="0.8"/>
      <rect x="${midX+4}"  y="${height*0.48}"width="11" height="6"               rx="3" fill="${colour}" opacity="0.8"/>
      <rect x="${midX-5}"  y="0"            width="10" height="${height}"       rx="4"
            fill="none" stroke="${colour}" stroke-width="1" opacity="0.4"/>
    `;
  }
 
  if (shapeType === 1) {
    return `
      <rect x="${midX-9}"  y="${height*0.18}" width="18" height="${height*0.82}" rx="4" fill="${colour}" opacity="0.9"/>
      <rect x="${midX-22}" y="${height*0.38}" width="15" height="8"              rx="3" fill="${colour}" opacity="0.8"/>
      <rect x="${midX+7}"  y="${height*0.33}" width="15" height="8"              rx="3" fill="${colour}" opacity="0.8"/>
      <rect x="${midX-5}"  y="0"             width="10" height="${height*0.28}" rx="3" fill="${colour}" opacity="0.85"/>
      <rect x="${midX-9}"  y="${height*0.18}" width="18" height="${height*0.82}" rx="4"
            fill="none" stroke="${colour}" stroke-width="1" opacity="0.4"/>
    `;
  }
 
  return `
    <rect x="${midX-17}" y="${height*0.14}" width="11" height="${height*0.86}" rx="4" fill="${colour}" opacity="0.9"/>
    <rect x="${midX+6}"  y="0"             width="11" height="${height}"       rx="4" fill="${colour}" opacity="0.9"/>
    <rect x="${midX-6}"  y="${height*0.48}" width="13" height="7"              rx="3" fill="${colour}" opacity="0.7"/>
  `;
}

function buildObstacleSVG(shapeType, width, height) {
  const colours = ['#ff2d78', '#f5e642', '#39ff14'];
  const colour  = colours[shapeType % colours.length];
  const midX    = width / 2;
  const glowFilter = `
    <filter id="glow-${shapeType}">
      <feGaussianBlur stdDeviation="2" result="blurred"/>
      <feMerge>
        <feMergeNode in="blurred"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
  const shape = buildObstacleShape(shapeType, width, height, midX, colour);
 
  return `
    <svg width="${width}" height="${height}"
         viewBox="0 0 ${width} ${height}"
         xmlns="http://www.w3.org/2000/svg">
      <defs>${glowFilter}</defs>
      <g filter="url(#glow-${shapeType})">${shape}</g>
    </svg>
  `;
}
 
function addObstacle() {
  if (!gameState.isRunning) return;
 
  const shapeType = randomBetween(0, 2);
  const width     = randomBetween(SETTINGS.obstacleMinWidth,  SETTINGS.obstacleMaxWidth);
  const height    = randomBetween(SETTINGS.obstacleMinHeight, SETTINGS.obstacleMaxHeight);
  const screenW   = getScreenWidth();
 
  const obstacleEl = document.createElement('div');
  obstacleEl.className = 'obstacle';
  obstacleEl.style.cssText = `width:${width}px; height:${height}px; right:-${width + 10}px;`;
  obstacleEl.innerHTML = buildObstacleSVG(shapeType, width, height);
 
  el.gameScreen.appendChild(obstacleEl);
 
  activeObstacles.push({
    element: obstacleEl,
    x:       screenW + width + 10, 
    width,
    height,
  });
}
 
function removeAllObstacles() {
  activeObstacles.forEach(obstacle => obstacle.element.remove());
  activeObstacles = [];
}
 
function makePlayerJump() {
  if (!gameState.isRunning || gameState.isPaused) return;
  if (gameState.jumpsUsed >= gameState.jumpsAllowed) return;
 
  player.verticalSpeed     = SETTINGS.jumpStrength;
  player.isOnGround        = false;
  gameState.jumpsUsed++;
  el.playerChar.classList.add('is-jumping');
}

function updatePlayerPosition() {
  if (player.isOnGround) return; 
 
  player.verticalSpeed      += SETTINGS.gravity;
  player.heightAboveGround  -= player.verticalSpeed;
 
  if (player.heightAboveGround <= 0) {
    player.heightAboveGround = 0;
    player.verticalSpeed     = 0;
    player.isOnGround        = true;
    gameState.jumpsUsed      = 0;
    el.playerChar.classList.remove('is-jumping');
  }
}
 

function renderPlayerPosition() {
  el.playerChar.style.bottom =
    (SETTINGS.groundThickness + player.heightAboveGround) + 'px';
}
 
function resetPlayer() {
  player.heightAboveGround = 0;
  player.verticalSpeed     = 0;
  player.isOnGround        = true;
  gameState.jumpsUsed      = 0;
  el.playerChar.classList.remove('is-jumping');
  renderPlayerPosition();
}
 
function moveObstaclesLeft() {
  const screenW = getScreenWidth();
 
  activeObstacles.forEach(obstacle => {
    obstacle.x -= gameState.obstacleSpeed;
    obstacle.element.style.right =
      (screenW - obstacle.x - obstacle.width) + 'px';
  });
}
 
function removeOffscreenObstacles() {
  const passed = activeObstacles.filter(o => o.x + o.width < 0);
 
  passed.forEach(obstacle => {
    obstacle.element.remove();
    showScorePopup(); 
  });
 
  activeObstacles = activeObstacles.filter(o => o.x + o.width >= 0);
}
 
function getPlayerBox() {
  const { width, height } = getPlayerSize();
  const screenH = el.gameScreen.offsetHeight;
  const shrink  = 7; 
 
  return {
    left:   SETTINGS.playerLeftEdge + shrink,
    right:  SETTINGS.playerLeftEdge + width - shrink,
    top:    screenH - SETTINGS.groundThickness - player.heightAboveGround - height + shrink,
    bottom: screenH - SETTINGS.groundThickness - player.heightAboveGround,
  };
}
 
function getObstacleBox(obstacle) {
  const screenH = el.gameScreen.offsetHeight;
 
  return {
    left:   obstacle.x,
    right:  obstacle.x + obstacle.width,
    top:    screenH - SETTINGS.groundThickness - obstacle.height,
    bottom: screenH - SETTINGS.groundThickness,
  };
}
 
function boxesOverlap(boxA, boxB) {
  return (
    boxA.left   < boxB.right  &&
    boxA.right  > boxB.left   &&
    boxA.top    < boxB.bottom &&
    boxA.bottom > boxB.top
  );
}
 

function checkForCollisions() {
  const playerBox = getPlayerBox();
 
  for (const obstacle of activeObstacles) {
    if (boxesOverlap(playerBox, getObstacleBox(obstacle))) {
      handlePlayerHit(obstacle);
      return; 
    }
  }
}
 
function showScorePopup() {
  const popup = document.createElement('div');
  popup.className   = 'score-popup';
  popup.textContent = '+1';
  popup.style.left   = `${SETTINGS.playerLeftEdge + 10}px`;
  popup.style.bottom = `${SETTINGS.groundThickness + player.heightAboveGround + 60}px`;
 
  el.gameScreen.appendChild(popup);
 
  setTimeout(() => popup.remove(), 900);
}
 
function handlePlayerHit(hitObstacle) {
  hitObstacle.element.remove();
  activeObstacles = activeObstacles.filter(o => o !== hitObstacle);
 
  gameState.lives--;
  showLives();
  flashScreenRed();
  if (gameState.lives <= 0) {
    endGame();
  }
}
 
function flashScreenRed() {
  el.gameScreen.classList.remove('hit-flash');
  void el.gameScreen.offsetWidth; 
  el.gameScreen.classList.add('hit-flash');
}
 
 
function addOnePoint() {
  gameState.score++;
  showScore();
  checkAndApplyLevelUp();
}
 
function startScoreTicker() {
  gameState.scoreTimerId = setInterval(addOnePoint, SETTINGS.scoreTickEvery);
}
 
function stopScoreTicker() {
  clearInterval(gameState.scoreTimerId);
  gameState.scoreTimerId = null;
}
 
function scheduleNextObstacle() {
  const delay = randomBetween(SETTINGS.minSpawnDelay, SETTINGS.maxSpawnDelay);
 
  gameState.spawnTimerId = setTimeout(() => {
    addObstacle();
    scheduleNextObstacle(); 
  }, delay);
}
 

function cancelObstacleSpawn() {
  clearTimeout(gameState.spawnTimerId);
  gameState.spawnTimerId = null;
}
 
function runOneFrame() {
  if (!gameState.isRunning || gameState.isPaused) return;
 
  updatePlayerPosition();      
  renderPlayerPosition();
  moveObstaclesLeft();         
  removeOffscreenObstacles();  
  checkForCollisions();        
 
  gameState.animFrameId = requestAnimationFrame(runOneFrame);
}
 
function stopGameLoop() {
  if (gameState.animFrameId !== null) {
    cancelAnimationFrame(gameState.animFrameId);
    gameState.animFrameId = null;
  }
}
 
function openPopup(popupElement) {
  popupElement.classList.remove('is-hidden');
}
 

function closePopup(popupElement) {
  popupElement.classList.add('is-hidden');
}
 
function openPausePopup() {
  el.pausedScore.textContent = gameState.score;
  el.pausedLevel.textContent = gameState.level;
  el.pausedLives.textContent =
    gameState.lives > 0
      ? Array(gameState.lives).fill('♥').join(' ')
      : '—';
  openPopup(el.pausePopup);
}
 
function openQuitConfirmPopup() {
  el.quitScorePreview.textContent = `${gameState.score} pts`;
  openPopup(el.quitPopup);
}

function openGameOverPopup(playerBeatTheirBest) {
  el.finalScore.textContent     = gameState.score;
  el.finalBestScore.textContent = gameState.bestScore;
  el.finalLevel.textContent     = gameState.level;
 
  el.gameOverMessage.textContent = playerBeatTheirBest
    ? 'Outstanding run — new record!'
    : 'Better luck next time!';
 
  el.newRecordMessage.classList.toggle('is-hidden', !playerBeatTheirBest);
 
  openPopup(el.gameOverPopup);
}
 
function resetGameState() {
  gameState.isRunning      = false;
  gameState.isPaused       = false;
  gameState.score          = 0;
  gameState.lives          = 3;
  gameState.level          = 1;
  gameState.obstacleSpeed  = SETTINGS.startSpeed;
  gameState.jumpsUsed      = 0;
  gameState.jumpsAllowed   = 1;
}
 
function resetScreenVisuals() {
  removeAllObstacles();
  resetPlayer();
  showScore();
  showLives();
  showLevel();
  showSpeedBars();
 
  el.doubleJumpNotice.classList.add('is-invisible');
  el.pausedLabel.classList.add('is-hidden');
}
 
function saveBestScore() {
  const isNewBest = gameState.score > gameState.bestScore;
 
  if (isNewBest) {
    gameState.bestScore = gameState.score;
    localStorage.setItem('jumpRushBest', gameState.bestScore);
    showBestScore();
  }
 
  return isNewBest;
}

function startGame() {
  resetGameState();
  resetScreenVisuals();
 
  gameState.isRunning = true;
 
  setHeaderButtonsActive(true);
  scheduleNextObstacle();
  startScoreTicker();
  gameState.animFrameId = requestAnimationFrame(runOneFrame);
  playMusicForLevel(1);   
}
 

function pauseGame() {
  if (!gameState.isRunning || gameState.isPaused) return;
 
  gameState.isPaused = true;
  stopGameLoop();
  stopScoreTicker();
  cancelObstacleSpawn();
 
  el.pausedLabel.classList.remove('is-hidden');
  el.pauseButton.textContent = '▶';
  el.pauseButton.title       = 'Resume (P)';
 
  pauseMusic();
  openPausePopup();
  
}
 
function resumeGame() {
  if (!gameState.isPaused) return;
 
  gameState.isPaused = false;
  closePopup(el.pausePopup);
  el.pausedLabel.classList.add('is-hidden');
  el.pauseButton.textContent = '⏸';
  el.pauseButton.title       = 'Pause (P)';
 
  resumeMusic();
  startScoreTicker();
  scheduleNextObstacle();
  gameState.animFrameId = requestAnimationFrame(runOneFrame);
}
 
function togglePause() {
  if (gameState.isPaused) {
    resumeGame();
  } else {
    pauseGame();
  }
}
 
function endGame() {
  gameState.isRunning = false;
  gameState.isPaused  = false;
 
  stopGameLoop();
  stopScoreTicker();
  cancelObstacleSpawn();

  stopMusic();
  const isNewBest = saveBestScore();
 
  setHeaderButtonsActive(false);
  el.pausedLabel.classList.add('is-hidden');
  el.pauseButton.textContent = '⏸';
 
  closePopup(el.pausePopup);
  closePopup(el.quitPopup);
 
  openGameOverPopup(isNewBest);
}


function handleKeyPress(event) {
  switch (event.code) {
    case 'Space':
    case 'ArrowUp':
      event.preventDefault();
      jumpIfPlaying();
      break;

    case 'KeyP':
    case 'Escape':
      event.preventDefault();
      if (gameState.isRunning) togglePause();
      break;

    case 'KeyQ':
      event.preventDefault();
      if (gameState.isRunning && !gameState.isPaused) {
        pauseGame();
        openQuitConfirmPopup();
      }
      break;

    case 'KeyM':
      event.preventDefault();
      toggleMute();
      break;
  }
}
 
function jumpIfPlaying() {
  if (!gameState.isRunning || gameState.isPaused) return;
  makePlayerJump();
}
 
function handleScreenTap(event) {
  const clickedInsideUI = event.target.closest(
    'button, .popup, .scoreboard, .game-header, .hint-bar'
  );
  if (clickedInsideUI) return;
  jumpIfPlaying();
}
 
function handleScreenTouch(event) {
  const touchedInsideUI = event.target.closest(
    'button, .popup, .scoreboard, .game-header, .hint-bar'
  );
  if (touchedInsideUI) return;
  event.preventDefault();
  jumpIfPlaying();
}
 
 
function onHelpButtonClick() {
  if (gameState.isRunning && !gameState.isPaused) pauseGame();
  openPopup(el.welcomePopup);
}
 
function onPauseButtonClick() {
  if (!gameState.isRunning) return;
  togglePause();
}
 
function onQuitButtonClick() {
  if (!gameState.isRunning) return;
  if (!gameState.isPaused) pauseGame();
  openQuitConfirmPopup();
}
 
function onStartButtonClick() {
  closePopup(el.welcomePopup);
  startGame();
}
 
function onResumeButtonClick() {
  resumeGame();
}
 
function onOpenQuitButtonClick() {
  closePopup(el.pausePopup);
  openQuitConfirmPopup();
}
 
function onCancelQuitButtonClick() {
  closePopup(el.quitPopup);
  resumeGame();
}
 
function onConfirmQuitButtonClick() {
  endGame();
}
 
function onPlayAgainButtonClick() {
  closePopup(el.gameOverPopup);
  startGame();
}
 
function onShowGuideButtonClick() {
  closePopup(el.gameOverPopup);
  openPopup(el.welcomePopup);
}
 
 
function attachAllListeners() {
  // Keyboard
  document.addEventListener('keydown',    handleKeyPress);
 
  document.addEventListener('click',      handleScreenTap);
  document.addEventListener('touchstart', handleScreenTouch, { passive: false });
 
  el.helpButton.addEventListener('click',  onHelpButtonClick);
  el.pauseButton.addEventListener('click', onPauseButtonClick);
  el.quitButton.addEventListener('click',  onQuitButtonClick);
 
  // Welcome popup
  el.startButton.addEventListener('click', onStartButtonClick);
 
  // Pause popup
  el.resumeButton.addEventListener('click',   onResumeButtonClick);
  el.openQuitButton.addEventListener('click', onOpenQuitButtonClick);
 
  // Quit confirmation popup
  el.cancelQuitButton.addEventListener('click',  onCancelQuitButtonClick);
  el.confirmQuitButton.addEventListener('click', onConfirmQuitButtonClick);
 
  // Game over popup
  el.playAgainButton.addEventListener('click', onPlayAgainButtonClick);
  el.showGuideButton.addEventListener('click', onShowGuideButtonClick);

  el.muteButton.addEventListener('click', toggleMute);
}
 
function showInitialScoreboard() {
  el.scoreDisplay.textContent     = '0';
  el.bestScoreDisplay.textContent = gameState.bestScore;
  el.livesDisplay.textContent     = '♥ ♥ ♥';
  el.levelDisplay.textContent     = '1';
}
 
function setup() {
  drawStars();
  drawCityBuildings();
  showInitialScoreboard();
  setHeaderButtonsActive(false);
  attachAllListeners();
  openPopup(el.welcomePopup);
}
 
//Booting the game
setup();
