let gameState = {
  players: [],
  currentPlayerIndex: 0,
  timeLeft: 300,
  scores: [0, 0, 0],
  currentChallenge: 0,
  lines: [],
  challengeTypes: ['tümler', 'bütünler', 'komşu_tümler', 'komşu_bütünler'],
  snappedPairs: [],
  currentAngles: [],
  draggedLine: null,
  dragOffset: { x: 0, y: 0 },
  snapDistance: 40,
  currentTotalAngle: 0,
  rotatingLine: null,
  rotationPivot: { x: 0, y: 0 }
};

let isDragging = false;
let isRotating = false;
let gameTimer = null;

window.onload = createMathSymbols;

function createMathSymbols() {
  const symbols = ['+', '-', '×', '÷', '∠', '°', 'π'];
  const container = document.getElementById('mathSymbols');
  for (let i = 0; i < 30; i++) {
    const symbol = document.createElement('div');
    symbol.className = 'symbol';
    symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    symbol.style.left = Math.random() * 100 + '%';
    symbol.style.top = Math.random() * 100 + '%';
    symbol.style.animationDelay = Math.random() * 3 + 's';
    container.appendChild(symbol);
  }
}

function startGame() {
  gameState.players = [
      document.getElementById('player1').value || '1. Yarışmacı',
      document.getElementById('player2').value || '2. Yarışmacı',
      document.getElementById('player3').value || '3. Yarışmacı'
  ];
  
  // Puanları ve zamanı sıfırla
  gameState.scores = [0, 0, 0];
  gameState.currentPlayerIndex = 0;
  gameState.currentChallenge = 0;
  gameState.timeLeft = 300;

  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('resultsScreen').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'flex';

  autoScaleGame();
  updateDisplay();
  
  setTimeout(() => {
      generateLines();
      autoScaleGame(); 
  }, 100);

  clearInterval(gameTimer);
  startTimer();
}

function restartGame() {
    document.getElementById('resultsScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
}

function updateDisplay() {
  document.getElementById('currentPlayer').textContent = `Sıra: ${gameState.players[gameState.currentPlayerIndex]}`;
  document.getElementById('score').textContent = `Puan: ${gameState.scores[gameState.currentPlayerIndex]}`;

  const currentType = gameState.challengeTypes[gameState.currentChallenge % 4];
  const challengeText = {
    'tümler': 'Tümler Açı: Birbirinden AYRI 2 açı oluşturun (Toplam 90°)',
    'bütünler': 'Bütünler Açı: Birbirinden AYRI 2 açı oluşturun (Toplam 180º)',
    'komşu_tümler': 'Komşu Tümler: Tek köşede bitişik 2 açı oluşturun (Toplam 90°)',
    'komşu_bütünler': 'Komşu Bütünler: Tek köşede bitişik 2 açı oluşturun (Toplam 180º)'
  };
  document.getElementById('challenge').textContent = challengeText[currentType];
}

function generateLines() {
  try {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    // KUSURSUZ SABİT SAHA: 1200x700
    gameArea.style.position = 'relative'; 
    gameArea.style.width = '1200px';  
    gameArea.style.height = '700px';  
    gameArea.style.flexShrink = '0'; 
    
    gameArea.innerHTML = "";
    gameState.lines = [];
    
    for (let i = 0; i < 4; i++) {
      createLine(i);
    }

    createConfirmButton(); 

  } catch (hata) {
    alert("Oyun Çöktü! Hata detayı: " + hata.message);
  }
}

function createLine(id) {
  const gameArea = document.getElementById('gameArea');
  const line = document.createElement('div');
  line.className = 'line';
  line.id = `line${id}`;
  
  line.style.position = 'absolute'; 
  line.style.width = '130px';    
  line.style.height = '5px';     
  line.style.cursor = 'grab';
  line.style.zIndex = (10 + id).toString();

  const iceCreamColors = ['#FF0055', '#00CC44', '#FFFF00', '#00E5FF'];
  const myColor = iceCreamColors[id % iceCreamColors.length];

  line.style.background = myColor;
  line.style.boxShadow = `0 0 12px ${myColor}`;

  // SAHANIN MERKEZİ GÜVENLİ ALANI
  const minX = 450; const maxX = 750; 
  const minY = 200; const maxY = 450;  

  let randomX, randomY;
  let isValidPosition = false;
  let attempts = 0;
  const minDistance = 120; 

  while (!isValidPosition && attempts < 100) {
    randomX = minX + Math.random() * (maxX - minX);
    randomY = minY + Math.random() * (maxY - minY);
    isValidPosition = true;

    for (let j = 0; j < id; j++) {
      if (gameState.lines[j]) {
        const dx = randomX - gameState.lines[j].x;
        const dy = randomY - gameState.lines[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
          isValidPosition = false; break; 
        }
      }
    }
    attempts++;
  }

  if (!isValidPosition) {
      const fallbackX = [500, 700, 500, 700];
      const fallbackY = [250, 250, 400, 400];
      randomX = fallbackX[id]; randomY = fallbackY[id];
  }

  const angle = Math.random() * 360;
  line.style.left = randomX + 'px';
  line.style.top = randomY + 'px';
  line.style.transformOrigin = '0% 50%'; 
  line.style.transform = `rotate(${angle}deg)`;

  const lineName = document.createElement('div');
  lineName.className = 'line-name';
  lineName.textContent = String.fromCharCode(97 + id);
  lineName.style.position = 'absolute';
  lineName.style.left = '50%';
  lineName.style.top = '-25px';
  lineName.style.transform = 'translateX(-50%)';
  lineName.style.color = myColor;
  lineName.style.fontSize = '16px'; 
  lineName.style.fontWeight = 'bold';
  lineName.style.textShadow = `0 0 8px ${myColor}`;
  lineName.style.pointerEvents = 'none';

  line.appendChild(lineName);
  createRotationHandles(line, id);

  line.addEventListener('mousedown', handleLineMouseDown);
  line.addEventListener('touchstart', handleLineMouseDown, { passive: false });
  line.addEventListener('contextmenu', (e) => e.preventDefault());

  gameArea.appendChild(line);

  gameState.lines[id] = {
    element: line,
    x: randomX, y: randomY, angle: angle,
    name: String.fromCharCode(97 + id), color: myColor
  };
}

// --- BUTON SİSTEMİ ---
function createConfirmButton() {
    let btn = document.getElementById('dynamicConfirmBtn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'dynamicConfirmBtn';
        btn.textContent = 'KONTROL ET';
        btn.onclick = checkAnswer; 
        
        btn.style.position = 'absolute';
        btn.style.bottom = '15px';
        btn.style.right = '15px'; 
        btn.style.padding = '10px 25px';
        btn.style.fontSize = '18px';
        btn.style.fontWeight = 'bold';
        btn.style.color = '#fff';
        btn.style.backgroundColor = 'rgba(255, 0, 85, 0.2)'; 
        btn.style.border = '2px solid #FF0055';
        btn.style.borderRadius = '8px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 0 15px rgba(255, 0, 85, 0.4)';
        btn.style.zIndex = '1000';
        btn.style.transition = 'all 0.2s';
        
        btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; btn.style.backgroundColor = 'rgba(255, 0, 85, 0.4)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; btn.style.backgroundColor = 'rgba(255, 0, 85, 0.2)'; };
        
        document.getElementById('gameArea').appendChild(btn);
    }
}

// --- SÜRÜKLEME VE DÖNDÜRME ---
function createRotationHandles(line, lineId) {
  const handle = document.createElement('div');
  handle.className = 'rotation-handle';
  handle.textContent = "↻"; 
  handle.style.right = "-15px";   
  handle.style.top = "50%";
  handle.style.transform = "translateY(-50%)";
  
  handle.addEventListener('mousedown', (e) => startRotation(e, lineId));
  handle.addEventListener('touchstart', (e) => startRotation(e, lineId), { passive: false });
  line.appendChild(handle);
}

function getLocalMousePos(clientX, clientY) {
    const gameArea = document.getElementById('gameArea');
    const rect = gameArea.getBoundingClientRect();
    const scale = rect.width / gameArea.offsetWidth || 1; 
    return {
        x: (clientX - rect.left) / scale,
        y: (clientY - rect.top) / scale
    };
}

function handleLineMouseDown(e) {
    if (e.target.classList.contains('rotation-handle')) return;
    if (e.cancelable) e.preventDefault(); 
    
    const lineElement = e.target.closest('.line');
    if (!lineElement) return;
    
    const lineId = parseInt(lineElement.id.replace('line', ""));
    gameState.draggedLine = lineId;
    isDragging = true;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const localPos = getLocalMousePos(clientX, clientY);

    gameState.dragOffset.x = localPos.x - gameState.lines[lineId].x;
    gameState.dragOffset.y = localPos.y - gameState.lines[lineId].y;

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
}

function startRotation(e, lineId) {
    if (e.cancelable) e.preventDefault();
    isRotating = true;
    gameState.rotatingLine = lineId;
    const line = gameState.lines[lineId];
    gameState.rotationPivot = { x: line.x, y: line.y };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
}

function handleMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const localPos = getLocalMousePos(clientX, clientY);

    if (isDragging && gameState.draggedLine !== null) {
        if (e.cancelable) e.preventDefault();
        const line = gameState.lines[gameState.draggedLine];
        line.x = localPos.x - gameState.dragOffset.x;
        line.y = localPos.y - gameState.dragOffset.y;
        line.element.style.left = line.x + 'px';
        line.element.style.top = line.y + 'px';
    }

    if (isRotating && gameState.rotatingLine !== null) {
        if (e.cancelable) e.preventDefault();
        const line = gameState.lines[gameState.rotatingLine];
        const newAngle = Math.atan2(localPos.y - gameState.rotationPivot.y, localPos.x - gameState.rotationPivot.x) * (180 / Math.PI);
        line.angle = newAngle;
        line.element.style.transform = `rotate(${line.angle}deg)`;
        checkLineOverlaps();
    }
}

function handleEnd() {
  if (isDragging && gameState.draggedLine !== null) {
    const dragged = gameState.lines[gameState.draggedLine];
    const draggedLeft = { x: dragged.x, y: dragged.y };

    gameState.lines.forEach((line, idx) => {
      if (idx !== gameState.draggedLine) {
        const dx = line.x - draggedLeft.x;
        const dy = line.y - draggedLeft.y;
        const distance = Math.sqrt(dx*dx + dy*dy);

        if (distance < gameState.snapDistance) {
          dragged.x = line.x; dragged.y = line.y;
          dragged.element.style.left = dragged.x + 'px';
          dragged.element.style.top = dragged.y + 'px';
        }
      }
    });
  }

  isDragging = false; isRotating = false;
  gameState.draggedLine = null; gameState.rotatingLine = null;
  
  document.removeEventListener('mousemove', handleMove);
  document.removeEventListener('mouseup', handleEnd);
  document.removeEventListener('touchmove', handleMove);
  document.removeEventListener('touchend', handleEnd);
  
  checkLineOverlaps();
}

// --- AÇI HESAPLAMALARI ---
function checkLineOverlaps() {
  gameState.currentAngles = [];
  gameState.snappedPairs = [];

  gameState.lines.forEach(line => line.element.classList.remove('connected'));
  let clusters = []; 

  gameState.lines.forEach(line => {
    let foundCluster = clusters.find(c => Math.abs(c.x - line.x) < 5 && Math.abs(c.y - line.y) < 5);
    if (foundCluster) {
      foundCluster.lines.push(line);
      line.element.classList.add('connected');
    } else {
      clusters.push({ x: line.x, y: line.y, lines: [line] });
    }
  });

  clusters.forEach(cluster => {
    if (cluster.lines.length === 1) cluster.lines[0].element.classList.remove('connected');
  });

  clusters.forEach(cluster => {
    if (cluster.lines.length >= 2) {
      let sortedLines = [...cluster.lines].sort((a, b) => a.angle - b.angle);
      let localPairs = [];

      for (let i = 0; i < sortedLines.length; i++) {
        let nextIndex = (i + 1) % sortedLines.length;
        let diff = sortedLines[nextIndex].angle - sortedLines[i].angle;
        if (diff < 0) diff += 360; 
        
        localPairs.push({
          vertexX: cluster.x, vertexY: cluster.y,
          angleA: sortedLines[i].angle, angleB: sortedLines[nextIndex].angle,
          value: Math.round(diff)
        });
      }

      localPairs.sort((a, b) => a.value - b.value);
      localPairs.pop(); // Kapsayıcı dış açıyı at

      localPairs.forEach(pair => {
        gameState.snappedPairs.push(pair);
        gameState.currentAngles.push(pair.value);
      });
    }
  });

  drawDynamicAngleLabels();
}

function drawDynamicAngleLabels() {
  const existingLabels = document.querySelectorAll('.dynamic-angle-label, .dynamic-angle-arc');
  existingLabels.forEach(el => el.remove());

  const gameArea = document.getElementById('gameArea');

  gameState.snappedPairs.forEach(pair => {
    let a = pair.angleA % 360; if (a < 0) a += 360;
    let b = pair.angleB % 360; if (b < 0) b += 360;

    let diff = (b - a + 360) % 360;
    let startAngle, sweepAngle;

    if (diff <= 180) { startAngle = a; sweepAngle = diff; } 
    else { startAngle = b; sweepAngle = 360 - diff; }

    const arc = document.createElement('div');
    arc.className = 'dynamic-angle-arc';
    const arcDiameter = 70; 
    
    arc.style.position = 'absolute';
    arc.style.left = pair.vertexX + 'px'; arc.style.top = pair.vertexY + 'px';
    arc.style.width = arcDiameter + 'px'; arc.style.height = arcDiameter + 'px';
    arc.style.borderRadius = '50%';
    arc.style.transform = `translate(-50%, -50%) rotate(${startAngle}deg)`;
    arc.style.background = `conic-gradient(from 90deg, rgba(255, 0, 255, 0.25) 0deg, rgba(255, 0, 255, 0.25) ${sweepAngle}deg, transparent ${sweepAngle}deg)`;
    arc.style.pointerEvents = 'none'; arc.style.zIndex = '90'; 
    gameArea.appendChild(arc);

    const radA = pair.angleA * (Math.PI / 180);
    const radB = pair.angleB * (Math.PI / 180);
    let bisectX = Math.cos(radA) + Math.cos(radB);
    let bisectY = Math.sin(radA) + Math.sin(radB);

    if (Math.abs(bisectX) < 0.001 && Math.abs(bisectY) < 0.001) {
        bisectX = Math.cos(radA + Math.PI / 2);
        bisectY = Math.sin(radA + Math.PI / 2);
    }

    const length = Math.sqrt(bisectX * bisectX + bisectY * bisectY);
    const distance = 55; 
    const labelX = pair.vertexX + (bisectX / length * distance);
    const labelY = pair.vertexY + (bisectY / length * distance);

    const label = document.createElement('div');
    label.className = 'dynamic-angle-label';
    label.textContent = pair.value + '°';
    label.style.position = 'absolute'; label.style.left = labelX + 'px'; label.style.top = labelY + 'px';
    label.style.transform = 'translate(-50%, -50%)'; label.style.color = '#fff';
    label.style.backgroundColor = 'rgba(255, 0, 255, 0.2)'; label.style.border = '1px solid #ff00ff';
    label.style.borderRadius = '5px'; label.style.padding = '2px 6px';
    label.style.fontSize = '14px'; label.style.fontWeight = 'bold';
    label.style.textShadow = '0 0 5px #ff00ff'; label.style.pointerEvents = 'none'; label.style.zIndex = '100';
    gameArea.appendChild(label);
  });

  updateTotalAngleDisplay();
}

function updateTotalAngleDisplay() {
  let display = document.getElementById('totalAngleDisplay');
  if (!display) {
    display = document.createElement('div');
    display.id = 'totalAngleDisplay';
    display.style.position = 'absolute'; display.style.bottom = '15px'; display.style.left = '15px';
    display.style.color = '#fff'; display.style.fontSize = '18px'; display.style.fontWeight = 'bold';
    display.style.backgroundColor = 'rgba(0, 245, 255, 0.15)'; display.style.padding = '8px 15px';
    display.style.border = '1px solid #00f5ff'; display.style.borderRadius = '8px';
    display.style.textShadow = '0 0 5px #00f5ff'; display.style.boxShadow = '0 0 10px rgba(0, 245, 255, 0.3)';
    display.style.zIndex = '1000';
    document.getElementById('gameArea').appendChild(display);
  }

  let total = 0;
  if (gameState.snappedPairs && gameState.snappedPairs.length > 0) {
    gameState.snappedPairs.forEach(pair => total += pair.value);
  }
  display.textContent = `Toplam Açı: ${total}°`;
  gameState.currentTotalAngle = total; 
}

// --- OYUN KURALLARI VE SONUÇ ---
function checkAnswer() {
  checkLineOverlaps();
  const currentType = gameState.challengeTypes[gameState.currentChallenge % 4];
  const total = gameState.currentTotalAngle || 0;
  let isCorrect = false;
  let errorMessage = `YANLIŞ! Şu an toplam: ${total}°. Tekrar dene!`;

  const pairCount = gameState.snappedPairs.length;
  let isKomsu = false;
  
  if (pairCount === 2) {
    const dx = Math.abs(gameState.snappedPairs[0].vertexX - gameState.snappedPairs[1].vertexX);
    const dy = Math.abs(gameState.snappedPairs[0].vertexY - gameState.snappedPairs[1].vertexY);
    if (dx < 5 && dy < 5) isKomsu = true; 
  }

  if (currentType === 'tümler') {
    if (total === 90 && pairCount === 2 && !isKomsu) isCorrect = true;
    else if (pairCount !== 2 || isKomsu) errorMessage = "Tümler açı için birbirinden AYRI 2 açı oluşturmalısın!";
  } else if (currentType === 'komşu_tümler') {
    if (total === 90 && pairCount === 2 && isKomsu) isCorrect = true;
    else if (pairCount !== 2 || !isKomsu) errorMessage = "Komşu Tümler için aynı köşeden çıkan (bitişik) 2 açı oluşturmalısın!";
  } else if (currentType === 'bütünler') {
    if (total === 180 && pairCount === 2 && !isKomsu) isCorrect = true;
    else if (pairCount !== 2 || isKomsu) errorMessage = "Bütünler açı için birbirinden AYRI 2 açı oluşturmalısın!";
  } else if (currentType === 'komşu_bütünler') {
    if (total === 180 && pairCount === 2 && isKomsu) isCorrect = true;
    else if (pairCount !== 2 || !isKomsu) errorMessage = "Komşu Bütünler için aynı köşeden çıkan (bitişik) 2 açı oluşturmalısın!";
  }

  if (isCorrect) {
    showFeedback("✨ HARİKA! DOĞRU CEVAP ✨", true);
    gameState.scores[gameState.currentPlayerIndex] += 10;
    document.getElementById('score').textContent = `Puan: ${gameState.scores[gameState.currentPlayerIndex]}`;
    setTimeout(() => { nextPlayer(); nextChallenge(); }, 2500);
  } else {
    showFeedback(errorMessage, false);
  }
}

function showFeedback(message, isSuccess) {
  const feedback = document.createElement('div');
  feedback.textContent = message;
  feedback.style.position = 'absolute'; feedback.style.top = '50%'; feedback.style.left = '50%';
  feedback.style.transform = 'translate(-50%, -50%)'; feedback.style.padding = '20px 40px';
  feedback.style.borderRadius = '15px'; feedback.style.fontSize = '24px'; feedback.style.fontWeight = 'bold';
  feedback.style.zIndex = '2000'; feedback.style.textAlign = 'center'; feedback.style.backdropFilter = 'blur(5px)';
  
  if (isSuccess) {
    feedback.style.backgroundColor = 'rgba(0, 255, 0, 0.2)'; feedback.style.color = '#00ff00';
    feedback.style.border = '2px solid #00ff00'; feedback.style.boxShadow = '0 0 30px rgba(0,255,0,0.5)';
  } else {
    feedback.style.backgroundColor = 'rgba(255, 0, 0, 0.2)'; feedback.style.color = '#ff3333';
    feedback.style.border = '2px solid #ff3333'; feedback.style.boxShadow = '0 0 30px rgba(255,0,0,0.5)';
  }
  document.getElementById('gameArea').appendChild(feedback);
  setTimeout(() => feedback.remove(), 2500);
}

function nextChallenge() {
  gameState.currentChallenge++;
  updateDisplay();
  generateLines();
}

function nextPlayer() {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  updateDisplay();
}

function startTimer() {
  gameTimer = setInterval(() => {
    gameState.timeLeft--;
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (gameState.timeLeft <= 0) {
      clearInterval(gameTimer);
      endGame();
    }
  }, 1000);
}

function endGame() {
  document.getElementById('gameScreen').style.display = 'none';
  document.getElementById('resultsScreen').style.display = 'flex';
  const resultsDiv = document.getElementById('finalResults');
  resultsDiv.innerHTML = "";
  
  let winnerText = document.createElement('h2');
  winnerText.style.color = "#00ff00";
  winnerText.style.marginBottom = "20px";
  resultsDiv.appendChild(winnerText);

  gameState.players.forEach((player, index) => {
    const resultLine = document.createElement('div');
    resultLine.textContent = `${player}: ${gameState.scores[index]} Puan`;
    resultsDiv.appendChild(resultLine);
  });
}

// --- KUSURSUZ ÇİFT YÖNLÜ ÖLÇEKLEME ---
function autoScaleGame() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight; 
    
    const designWidth = 1200; 
    const designHeight = 700; 

    // Ekranın üst kısmındaki menüler için 200px güvenlik boşluğu
    const availableWidth = windowWidth - 40; 
    const availableHeight = windowHeight - 200; 

    const scaleX = availableWidth / designWidth;
    const scaleY = availableHeight / designHeight;

    // Hem enine hem boyuna bak, hangisi dar ise ona göre küçült
    const scale = Math.min(scaleX, scaleY, 1); 

    gameArea.style.position = 'relative';
    gameArea.style.left = 'auto'; 
    gameArea.style.transformOrigin = 'top center';
    gameArea.style.transform = `scale(${scale})`;

    const scaledHeight = designHeight * scale;
    const emptySpace = designHeight - scaledHeight;

    gameArea.style.margin = `10px auto -${emptySpace}px auto`; 
}

window.addEventListener('resize', autoScaleGame);