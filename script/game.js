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
};
 

const gameState = {
  isRunning:       false,   
  isPaused:        false,   
  score:           0,
  bestScore:       parseInt(localStorage.getItem('neonDashBest') || '0', 10),
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
};