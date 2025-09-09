const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const leaderboardEl = document.getElementById("leaderboard");
const bonusLabel = document.getElementById("bonusLabel");
const bonusBarContainer = document.getElementById("bonusBarContainer");
const bonusBar = document.getElementById("bonusBar");
// Player name field now only in game over overlay
const playerNameInput = null;
const resetLeaderboardBtn = document.getElementById("resetLeaderboard");
// Overlay elements
const overlay = document.getElementById("overlay");
const menuMain = document.getElementById("menuMain");
const menuLeaderboard = document.getElementById("menuLeaderboard");
const menuHow = document.getElementById("menuHow");
const btnPlay = document.getElementById("btnPlay");
const btnOpenLeaderboard = document.getElementById("btnOpenLeaderboard");
const btnHowTo = document.getElementById("btnHowTo");
const overlayLeaderboardEl = document.getElementById("overlayLeaderboard");
const menuGameOver = document.getElementById("menuGameOver");
const playerNameOverlayInput = document.getElementById("playerNameOverlay");
const btnSubmitScore = document.getElementById("btnSubmitScore");

const gridSize = 20;
const initialCanvasSize = 400;
const maxCanvasSize = 800; // cap growth to avoid overflow
const foodsPerExpand = 5;  // expand every N foods
const expandStep = gridSize * 2; // grow by 2 cells each time
let currentCanvasSize = initialCanvasSize;
let targetCanvasSize = initialCanvasSize;
let resizeAnimId = 0;

function createInitialSnake() {
    const startX = 200;
    const startY = 200;
    return [
        { x: startX, y: startY },
        { x: startX - gridSize, y: startY },
        { x: startX - 2 * gridSize, y: startY }
    ];
}

let snake = createInitialSnake();
let direction = { x: 0, y: 0 };
let food = randomPosition();
let bonusFood = null;
let score = 0;
let foodEaten = 0;
let leaderboard = Leaderboard.getLeaderboard();
let gameStarted = false;
let menuVisible = true;
let pausePendingAfterResize = false;
let lastDirection = { x: 1, y: 0 };
// Initialize leaderboard and prefill player name
const savedName = Leaderboard.getSavedName();
if (playerNameOverlayInput && savedName) {
    playerNameOverlayInput.value = savedName;
}

updateLeaderboard();
showMenu("main");

// Bonus food timer
let bonusActive = false;
let bonusTimer = 0;
const bonusDuration = 3000; // ms

function randomPosition() {
    return {
        x: Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
        y: Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
    };
}

function animateCanvasTo(target) {
    // Cancel previous animation and start a new one from the current size
    resizeAnimId += 1;
    const myId = resizeAnimId;
    const startSize = currentCanvasSize;
    const clampedTarget = Math.min(target, maxCanvasSize);
    const delta = clampedTarget - startSize;
    if (delta <= 0) {
        targetCanvasSize = clampedTarget;
        currentCanvasSize = clampedTarget;
        if (canvas.width !== clampedTarget || canvas.height !== clampedTarget) {
            canvas.width = clampedTarget;
            canvas.height = clampedTarget;
        }
        return;
    }
    targetCanvasSize = clampedTarget;
    const duration = 300; // ms
    const startTime = performance.now();

    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function step(now) {
        if (myId !== resizeAnimId) return; // superseded by a new animation
        const t = Math.min(1, (now - startTime) / duration);
        const eased = easeInOut(t);
        const size = Math.round(startSize + delta * eased);
        if (size !== currentCanvasSize) {
            currentCanvasSize = size;
            canvas.width = size;
            canvas.height = size;
        }
        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            currentCanvasSize = clampedTarget;
            canvas.width = clampedTarget;
            canvas.height = clampedTarget;
            if (pausePendingAfterResize) {
                pausePendingAfterResize = false;
                gameStarted = false;
                direction = { x: 0, y: 0 };
            }
        }
    }
    requestAnimationFrame(step);
}

function ensureCanvasSize() {
    const increments = Math.floor(foodEaten / foodsPerExpand);
    const target = Math.min(initialCanvasSize + increments * expandStep, maxCanvasSize);
    if (target > currentCanvasSize) {
        pausePendingAfterResize = true;
        animateCanvasTo(target);
    }
}

function drawSnake() {
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ff88";
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? "#00ff88" : "#00cc66";
        ctx.fillRect(segment.x, segment.y, gridSize - 2, gridSize - 2);
        if (index === 0) {
            drawHeadIndicator(segment);
        }
    });
    ctx.shadowBlur = 0;
}

function drawHeadIndicator(head) {
    const useDir = (direction.x === 0 && direction.y === 0) ? lastDirection : direction;
    const centerX = head.x + gridSize / 2;
    const centerY = head.y + gridSize / 2;
    const fx = useDir.x;
    const fy = useDir.y;
    const px = -fy;
    const py = fx;
    const eyeForward = gridSize * 0.22;
    const eyeSide = gridSize * 0.18;
    const eyeR = Math.max(2, gridSize * 0.12);
    const pupilR = Math.max(1, eyeR * 0.5);

    const ex1 = centerX + fx * eyeForward + px * eyeSide;
    const ey1 = centerY + fy * eyeForward + py * eyeSide;
    const ex2 = centerX + fx * eyeForward - px * eyeSide;
    const ey2 = centerY + fy * eyeForward - py * eyeSide;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2); ctx.fill();

    const pf = gridSize * 0.08;
    ctx.fillStyle = "#000000";
    ctx.beginPath(); ctx.arc(ex1 + fx * pf, ey1 + fy * pf, pupilR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2 + fx * pf, ey2 + fy * pf, pupilR, 0, Math.PI * 2); ctx.fill();
}

function drawFood() {
    const gradient = ctx.createRadialGradient(food.x + 10, food.y + 10, 2, food.x + 10, food.y + 10, 10);
    gradient.addColorStop(0, "#ff4b1f");
    gradient.addColorStop(1, "#ff9068");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(food.x + gridSize/2, food.y + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawBonusFood() {
    if (!bonusFood) return;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#FFD700";
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(bonusFood.x + gridSize/2, bonusFood.y + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function update() {
    if (!gameStarted || (direction.x === 0 && direction.y === 0)) return;

    let head = { x: snake[0].x + direction.x * gridSize, y: snake[0].y + direction.y * gridSize };

    // Wrap-around
    if (head.x < 0) head.x = canvas.width - gridSize;
    else if (head.x >= canvas.width) head.x = 0;
    if (head.y < 0) head.y = canvas.height - gridSize;
    else if (head.y >= canvas.height) head.y = 0;

    // Self collision (ignore current head at index 0)
    if (snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    // Eating normal food
    if (head.x === food.x && head.y === food.y) {
        score++;
        foodEaten++;
        scoreEl.textContent = "Score: " + score;
        food = randomPosition();
        ensureCanvasSize();

        // Spawn bonus food every 5 foods eaten
        if (foodEaten % 5 === 0) {
            bonusFood = randomPosition();
            bonusActive = true;
            bonusTimer = Date.now();
            bonusLabel.style.display = "block";
            bonusBarContainer.style.display = "block";
        }

    // Eating bonus food
    } else if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
        score += 10;
        scoreEl.textContent = "Score: " + score;
        bonusFood = null;
        bonusActive = false;
        bonusLabel.style.display = "none";
        bonusBarContainer.style.display = "none";
    } else {
        snake.pop();
    }

    // Bonus food timeout
    if (bonusActive && Date.now() - bonusTimer > bonusDuration) {
        bonusFood = null;
        bonusActive = false;
        bonusLabel.style.display = "none";
        bonusBarContainer.style.display = "none";
    }
}

function drawGrid() {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
    }
}

function drawBonusBar() {
    if (bonusActive) {
        let remaining = bonusDuration - (Date.now() - bonusTimer);
        let percent = Math.max(0, (remaining / bonusDuration) * 100);
        bonusBar.style.width = percent + "%";
    }
}

function endGame() {
    // Freeze game state and show Game Over with score; defer name and saving until user submits
    gameStarted = false;
    if (document.getElementById('finalScore')) {
        document.getElementById('finalScore').textContent = `Your score: ${score}`;
    }
    showMenu("gameover");
}

function updateLeaderboard() {
    const listHtml = leaderboard
        .map((entry, i) => `<li>${i + 1}. ${entry.name} - ${entry.score}</li>`)
        .join("");
    if (leaderboardEl) leaderboardEl.innerHTML = listHtml;
    if (overlayLeaderboardEl) overlayLeaderboardEl.innerHTML = listHtml || '<li>No scores yet. Be the first!</li>';
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawFood();
    drawBonusFood();
    drawSnake();
    update();
    drawBonusBar();
}

window.addEventListener("keydown", e => {
    if (menuVisible) return; // ignore controls while menu is open
    // Arrow keys
    if (e.key === "ArrowUp" && direction.y === 0) { direction = { x: 0, y: -1 }; lastDirection = direction; gameStarted = true; }
    else if (e.key === "ArrowDown" && direction.y === 0) { direction = { x: 0, y: 1 }; lastDirection = direction; gameStarted = true; }
    else if (e.key === "ArrowLeft" && direction.x === 0) { direction = { x: -1, y: 0 }; lastDirection = direction; gameStarted = true; }
    else if (e.key === "ArrowRight" && direction.x === 0) { direction = { x: 1, y: 0 }; lastDirection = direction; gameStarted = true; }
    // WASD keys
    else if ((e.key === "w" || e.key === "W") && direction.y === 0) { direction = { x: 0, y: -1 }; lastDirection = direction; gameStarted = true; }
    else if ((e.key === "s" || e.key === "S") && direction.y === 0) { direction = { x: 0, y: 1 }; lastDirection = direction; gameStarted = true; }
    else if ((e.key === "a" || e.key === "A") && direction.x === 0) { direction = { x: -1, y: 0 }; lastDirection = direction; gameStarted = true; }
    else if ((e.key === "d" || e.key === "D") && direction.x === 0) { direction = { x: 1, y: 0 }; lastDirection = direction; gameStarted = true; }
});

// Touch swipe controls for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchActive = false;

function applySwipeDirection(deltaX, deltaY) {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const threshold = 20;
    if (absX < threshold && absY < threshold) return;
    if (absX > absY) {
        if (deltaX > 0 && direction.x === 0) { direction = { x: 1, y: 0 }; lastDirection = direction; gameStarted = true; }
        else if (deltaX < 0 && direction.x === 0) { direction = { x: -1, y: 0 }; lastDirection = direction; gameStarted = true; }
    } else {
        if (deltaY > 0 && direction.y === 0) { direction = { x: 0, y: 1 }; lastDirection = direction; gameStarted = true; }
        else if (deltaY < 0 && direction.y === 0) { direction = { x: 0, y: -1 }; lastDirection = direction; gameStarted = true; }
    }
}

canvas.addEventListener("touchstart", e => {
    if (menuVisible) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchActive = true;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", e => {
    if (!touchActive || menuVisible) return;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", e => {
    if (!touchActive || menuVisible) return;
    const t = e.changedTouches[0];
    const deltaX = t.clientX - touchStartX;
    const deltaY = t.clientY - touchStartY;
    applySwipeDirection(deltaX, deltaY);
    touchActive = false;
    e.preventDefault();
}, { passive: false });

// Persist name typed in overlay
if (playerNameOverlayInput) {
    playerNameOverlayInput.addEventListener("input", () => {
        const name = playerNameOverlayInput.value.trim();
        Leaderboard.setSavedName(name);
    });
}

if (resetLeaderboardBtn) {
    resetLeaderboardBtn.addEventListener("click", () => {
        Leaderboard.resetLeaderboard();
        leaderboard = Leaderboard.getLeaderboard();
        updateLeaderboard();
    });
}

// Menu controls
function showMenu(screen) {
    if (!overlay) return;
    menuVisible = true;
    overlay.style.display = "flex";
    // hide all
    [menuMain, menuLeaderboard, menuHow, menuGameOver].forEach(el => el && el.classList.remove("active"));
    if (screen === "leaderboard") menuLeaderboard.classList.add("active");
    else if (screen === "how") menuHow.classList.add("active");
    else if (screen === "gameover") menuGameOver.classList.add("active");
    else menuMain.classList.add("active");
}

function hideMenu() {
    if (!overlay) return;
    menuVisible = false;
    overlay.style.display = "none";
}

if (btnPlay) {
    btnPlay.addEventListener("click", () => {
        startNewRun();
    });
}
if (btnOpenLeaderboard) {
    btnOpenLeaderboard.addEventListener("click", () => {
        updateLeaderboard();
        showMenu("leaderboard");
    });
}
if (btnHowTo) {
    btnHowTo.addEventListener("click", () => showMenu("how"));
}
document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => showMenu("main"));
});

// Submit score at Game Over
if (btnSubmitScore) {
    btnSubmitScore.addEventListener('click', () => {
        const name = (playerNameOverlayInput && playerNameOverlayInput.value.trim()) || Leaderboard.getSavedName() || "Player";
        if (playerNameOverlayInput) Leaderboard.setSavedName(name);
        if (score > 0) leaderboard = Leaderboard.addScore(name, score);
        updateLeaderboard();
        // Reset for next game and return to main menu
        snake = createInitialSnake();
        direction = { x: 0, y: 0 };
    // Reset canvas size back to initial
    currentCanvasSize = initialCanvasSize;
    targetCanvasSize = initialCanvasSize;
    resizeAnimId += 1; // cancel any ongoing animation
    canvas.width = initialCanvasSize;
    canvas.height = initialCanvasSize;
    food = randomPosition();
        bonusFood = null;
        score = 0;
        foodEaten = 0;
        scoreEl.textContent = "Score: 0";
        bonusLabel.style.display = "none";
        bonusBarContainer.style.display = "none";
        showMenu("main");
    });
}

function startNewRun() {
    // Clean slate for a fresh game
    snake = createInitialSnake();
    direction = { x: 0, y: 0 }; // wait for first input
    lastDirection = { x: 1, y: 0 }; // default facing right for head indicator
    score = 0;
    foodEaten = 0;
    scoreEl.textContent = "Score: 0";
    bonusFood = null;
    bonusActive = false;
    bonusLabel.style.display = "none";
    bonusBarContainer.style.display = "none";
    // Reset canvas size and cancel any size animation
    currentCanvasSize = initialCanvasSize;
    targetCanvasSize = initialCanvasSize;
    resizeAnimId += 1;
    canvas.width = initialCanvasSize;
    canvas.height = initialCanvasSize;
    // Place food within bounds
    food = randomPosition();
    gameStarted = false; // start paused until input
    hideMenu();
    canvas.focus();
}

// Global function to be called when opening the game modal
function initializeSnakeGame() {
    if (canvas && ctx) {
        startNewRun();
        const gameInterval = setInterval(gameLoop, 120);
        
        // Store interval ID to clear it when modal closes
        window.snakeGameInterval = gameInterval;
        
        // Update website score display
        updateWebsiteScoreDisplay();
    }
}

// Function to clean up when modal closes
function cleanupSnakeGame() {
    if (window.snakeGameInterval) {
        clearInterval(window.snakeGameInterval);
        window.snakeGameInterval = null;
    }
    
    // Reset game state
    gameStarted = false;
    menuVisible = true;
}

// Function to update the website's score displays
function updateWebsiteScoreDisplay() {
    const leaderboard = Leaderboard.getLeaderboard();
    const highScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
    
    // Update high score on the games page
    const highScoreEl = document.getElementById('snakeHighScore');
    if (highScoreEl) {
        highScoreEl.textContent = highScore;
    }
    
    // Update current score in modal
    const currentScoreEl = document.getElementById('currentScore');
    if (currentScoreEl) {
        currentScoreEl.textContent = score;
    }
}

// Update scores periodically while playing
setInterval(() => {
    if (gameStarted) {
        updateWebsiteScoreDisplay();
    }
}, 1000);
