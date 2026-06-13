"use client";

import React, { useEffect, useRef } from "react";
import BackButton from "@/app/_components/article/BackButton";

const styles = `
  :root {
    --canvas-bg: rgba(255,255,255,0.45);
    --canvas-grid: rgba(0,0,0,0.04);
  }
  .dark {
    --canvas-bg: rgba(30,41,59,0.45);
    --canvas-grid: rgba(255,255,255,0.03);
  }

  canvas#gameCanvas {
    display: block;
    border-radius: 8px;
    box-shadow: inset 0 0 20px rgba(0,0,0,0.15);
    image-rendering: auto;
  }
  .preview-canvas {
    display: block;
    margin: 0 auto;
    border-radius: 4px;
  }

  .panel-value.highlight {
    animation: valuePulse 0.5s ease-out;
  }
  @keyframes valuePulse {
    0%, 100% { transform: scale(1); }
    30% { transform: scale(1.25); color: #818cf8; }
  }

  .flash-overlay {
    position: absolute;
    inset: 0;
    background: white;
    pointer-events: none;
    opacity: 0;
    border-radius: 16px;
    z-index: 5;
    transition: opacity 0.05s ease;
  }
  .flash-overlay.active {
    opacity: 0.35;
    transition: opacity 0s;
  }

  .pause-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    opacity: 0;
    z-index: 10;
    font-size: 1.5rem;
    font-weight: 900;
    color: #1e293b;
  }
  .dark .pause-indicator {
    color: #f1f5f9;
  }
  .pause-indicator.active {
    opacity: 1;
    animation: breathePulse 1.6s ease-in-out infinite;
  }
  @keyframes breathePulse {
    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
  }

  .overlay-text {
    font-size: 3rem;
    font-weight: 900;
    color: #ef4444;
    text-shadow: 0 0 40px rgba(239, 68, 68, 0.6);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
  }
  .overlay-text.visible {
    opacity: 1;
    animation: gameOverShake 0.6s ease-out;
  }
  @keyframes gameOverShake {
    0%, 100% { transform: translate(0); }
    10% { transform: translate(-4px, 2px); }
    20% { transform: translate(5px, -3px); }
    30% { transform: translate(-3px, -1px); }
    40% { transform: translate(3px, 2px); }
    50% { transform: translate(-2px, -2px); }
    60% { transform: translate(1px, 3px); }
    70% { transform: translate(-1px, -1px); }
    80% { transform: translate(2px, 1px); }
    90% { transform: translate(-1px, 1px); }
  }

  @media (max-width: 700px) {
    canvas#gameCanvas { width: 270px; height: 540px; }
  }
`;

export default function TetrisPage() {
  const gameLoopId = useRef<number | null>(null);
  const isMounted = useRef(true);

  const handleInputRef = useRef<((action: string) => void) | null>(null);
  const exportSaveRef = useRef<(() => void) | null>(null);
  const importSaveRef = useRef<((file: File) => void) | null>(null);
  const ghostToggleRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    isMounted.current = true;

    // --- 调整后的游戏尺寸 ---
    const COLS = 10;
    const ROWS = 20;
    const CELL_SIZE = 35; // 原为 30，现增大以提高游戏主体高度
    const CANVAS_W = COLS * CELL_SIZE; // 350
    const CANVAS_H = ROWS * CELL_SIZE; // 700

    const PIECE_TYPES = ['I', 'O', 'T', 'L', 'J', 'S', 'Z'];
    const PIECE_SHAPES: Record<string, number[][]> = {
      'I': [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      'O': [[1, 1], [1, 1]],
      'T': [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      'L': [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      'J': [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      'S': [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      'Z': [[1, 1, 0], [0, 1, 1], [0, 0, 0]]
    };
    const PIECE_COLORS: Record<string, string> = {
      'I': '#818cf8', 'O': '#34d399', 'T': '#8b5cf6',
      'L': '#f59e0b', 'J': '#38bdf8', 'S': '#10b981', 'Z': '#f87171'
    };
    const PIECE_GLOW: Record<string, string> = {
      'I': '#a5b4fc', 'O': '#6ee7b7', 'T': '#a78bfa',
      'L': '#fbbf24', 'J': '#7dd3fc', 'S': '#34d399', 'Z': '#fca5a5'
    };

    const STATE_NORMAL = 'normal';
    const STATE_HARD_DROP = 'harddrop';
    const STATE_LINE_CLEAR = 'lineclear';
    const STATE_GAME_OVER = 'gameover';
    const STATE_PAUSED = 'paused';

    let gameState = STATE_NORMAL;
    let board: (string | null)[][] = [];
    let currentPiece: any = null;
    let nextPieceType: string | null = null;
    let score = 0;
    let level = 1;
    let totalLines = 0;
    let highScore = 0;
    let isInputEnabled = true;
    let dropInterval = 600;
    let dropAccumulator = 0;
    let lastFrameTime = 0;
    let ghostEnabled = true;
    let pieceVisualOffsetY = 0;
    let pieceVisualTargetY = 0;
    let pieceVisualAnimDuration = 0;
    let pieceVisualAnimElapsed = 0;

    let animState: any = null;
    let particles: any[] = [];
    let floatingTexts: any[] = [];
    let screenShake = { intensity: 0, duration: 0, elapsed: 0 };
    let rowSlideOffsets = new Array(ROWS).fill(0);
    let flashAlpha = 0;

    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d')!;
    const previewCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;
    const previewCtx = previewCanvas?.getContext('2d')!;
    const scoreDisplay = document.getElementById('scoreDisplay')!;
    const levelDisplay = document.getElementById('levelDisplay')!;
    const linesDisplay = document.getElementById('linesDisplay')!;
    const highScoreDisplay = document.getElementById('highScoreDisplay')!;
    const flashOverlay = document.getElementById('flashOverlay')!;
    const pauseIndicator = document.getElementById('pauseIndicator')!;
    const overlayText = document.getElementById('overlayText')!;

    const getCanvasBg = () => getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || 'rgba(255,255,255,0.45)';
    const getCanvasGrid = () => getComputedStyle(document.documentElement).getPropertyValue('--canvas-grid').trim() || 'rgba(0,0,0,0.04)';

    function createBoard() { board = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
    function getRandomPieceType() { return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]; }
    function createPiece(type: string) {
      const shape = PIECE_SHAPES[type].map(row => [...row]);
      return { type, shape, color: PIECE_COLORS[type], glow: PIECE_GLOW[type], x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
    }
    function spawnPiece() {
      const type = nextPieceType || getRandomPieceType();
      nextPieceType = getRandomPieceType();
      const piece = createPiece(type);
      if (!isValidPosition(piece.shape, piece.x, piece.y)) {
        gameState = STATE_GAME_OVER;
        isInputEnabled = false;
        currentPiece = piece;
        triggerGameOver();
        return false;
      }
      currentPiece = piece;
      pieceVisualOffsetY = 0; pieceVisualTargetY = 0;
      pieceVisualAnimDuration = 0; pieceVisualAnimElapsed = 0;
      return true;
    }
    function rotateCW(matrix: number[][]) {
      const rows = matrix.length, cols = matrix[0].length;
      const result: number[][] = [];
      for (let c = 0; c < cols; c++) {
        const row: number[] = [];
        for (let r = rows - 1; r >= 0; r--) row.push(matrix[r][c]);
        result.push(row);
      }
      return result;
    }
    function isValidPosition(shape: number[][], px: number, py: number) {
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          if (shape[r][c]) {
            const bx = px + c, by = py + r;
            if (bx < 0 || bx >= COLS || by >= ROWS) return false;
            if (by >= 0 && board[by][bx] !== null) return false;
          }
      return true;
    }
    function getGhostY() {
      if (!currentPiece || !ghostEnabled) return currentPiece?.y ?? 0;
      let gy = currentPiece.y;
      while (isValidPosition(currentPiece.shape, currentPiece.x, gy + 1)) gy++;
      return gy;
    }
    function lockPiece() {
      for (let r = 0; r < currentPiece.shape.length; r++)
        for (let c = 0; c < currentPiece.shape[r].length; c++)
          if (currentPiece.shape[r][c]) {
            const by = currentPiece.y + r, bx = currentPiece.x + c;
            if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) board[by][bx] = currentPiece.color;
          }
    }
    function checkCompletedLines() {
      const cleared: number[] = [];
      for (let r = 0; r < ROWS; r++) if (board[r].every(cell => cell !== null)) cleared.push(r);
      return cleared;
    }
    function removeClearedLines(clearedRows: number[]) {
      const clearedSet = new Set(clearedRows);
      const newBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      let writeRow = ROWS - 1;
      const oldRowMapping: Record<number, number> = {};
      for (let r = ROWS - 1; r >= 0; r--) {
        if (!clearedSet.has(r)) {
          newBoard[writeRow] = [...board[r]];
          oldRowMapping[writeRow] = r;
          writeRow--;
        }
      }
      const newOffsets = new Array(ROWS).fill(0);
      for (let nr = 0; nr < ROWS; nr++)
        if (oldRowMapping[nr] !== undefined) newOffsets[nr] = (oldRowMapping[nr] - nr) * CELL_SIZE;
      board = newBoard;
      return newOffsets;
    }
    function updateScore(linesCleared: number) {
      const map: Record<number, number> = { 1: 100, 2: 300, 3: 500, 4: 800 };
      const points = map[linesCleared] || 0;
      score += points;
      const newLevel = Math.floor(score / 3000) + 1;
      if (newLevel > level) {
        level = newLevel;
        dropInterval = Math.max(150, 600 - level * 20);
        triggerLevelUp();
      }
      if (score > highScore) { highScore = score; localStorage.setItem('tetris_highscore', String(highScore)); }
      totalLines += linesCleared;
      updateDisplay();
      if (linesCleared > 0) addFloatingText('+' + points, CANVAS_W / 2, CANVAS_H / 2, '#ffd700', 28);
    }
    function updateDisplay() {
      scoreDisplay.textContent = String(score);
      levelDisplay.textContent = String(level);
      linesDisplay.textContent = String(totalLines);
      highScoreDisplay.textContent = String(highScore);
    }
    function triggerLevelUp() {
      flashAlpha = 1;
      levelDisplay.classList.add('highlight');
      setTimeout(() => levelDisplay.classList.remove('highlight'), 500);
      addFloatingText('LEVEL UP!', CANVAS_W / 2, CANVAS_H / 3, '#ffffff', 32);
    }
    function triggerGameOver() {
      overlayText.classList.add('visible');
      addFloatingText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2, '#ff4455', 36);
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: CANVAS_W / 2 + (Math.random() - 0.5) * 200,
          y: CANVAS_H / 2 + (Math.random() - 0.5) * 200,
          vx: (Math.random() - 0.5) * 350,
          vy: (Math.random() - 0.5) * 350 - 100,
          size: 3 + Math.random() * 8,
          color: ['#ff4455', '#ff8899', '#ffcc00', '#ffffff'][Math.floor(Math.random() * 4)],
          life: 1.2 + Math.random() * 1.5, maxLife: 1.2 + Math.random() * 1.5,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 15,
        });
      }
    }
    function addFloatingText(text: string, x: number, y: number, color: string, size: number) {
      floatingTexts.push({ text, x, y, color, size, life: 1, maxLife: 1, vy: -60 - Math.random() * 40 });
    }
    function startHardDropAnimation(startY: number, endY: number) {
      gameState = STATE_HARD_DROP; isInputEnabled = false;
      animState = { type: 'harddrop', startTime: performance.now(), duration: 80, startY, endY, impactTriggered: false, shadowTrails: [] };
      pieceVisualOffsetY = 0; pieceVisualTargetY = 0; pieceVisualAnimDuration = 0; pieceVisualAnimElapsed = 0;
    }
    function startLineClearAnimation(clearedRows: number[]) {
      gameState = STATE_LINE_CLEAR; isInputEnabled = false;
      animState = {
        type: 'lineclear', phase: 'flash', phaseStartTime: performance.now(),
        phaseDurations: { flash: 60, shake: 60, shatter: 100, collapse: 90 },
        clearedRows: [...clearedRows], rowOffsets: new Array(ROWS).fill(0),
        collapseTargetOffsets: null, particlesSpawned: false,
      };
      rowSlideOffsets = new Array(ROWS).fill(0);
      pieceVisualOffsetY = 0; pieceVisualTargetY = 0; pieceVisualAnimDuration = 0; pieceVisualAnimElapsed = 0;
      currentPiece = null;
    }
    function updateAnimations(deltaMs: number) {
      const now = performance.now();
      if (screenShake.intensity > 0) {
        screenShake.elapsed += deltaMs;
        if (screenShake.elapsed >= screenShake.duration) { screenShake.intensity = 0; screenShake.elapsed = 0; }
      }
      if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - deltaMs / 300);
      if (animState?.type === 'lineclear' && animState.phase === 'collapse') {
        const phaseDuration = animState.phaseDurations.collapse;
        const elapsed = now - animState.phaseStartTime;
        const progress = Math.min(1, elapsed / phaseDuration);
        const easedProgress = easeOutCubic(progress);
        for (let r = 0; r < ROWS; r++)
          if (animState.collapseTargetOffsets?.[r] !== undefined)
            rowSlideOffsets[r] = animState.collapseTargetOffsets[r] * (1 - easedProgress);
        if (progress >= 1) { rowSlideOffsets = new Array(ROWS).fill(0); finishLineClearAnimation(); }
      }
      if (animState?.type === 'harddrop') {
        const elapsed = now - animState.startTime;
        const progress = Math.min(1, elapsed / animState.duration);
        const easedProgress = easeInQuad(progress);
        const currentDrawY = animState.startY + (animState.endY - animState.startY) * easedProgress;
        pieceVisualOffsetY = (currentDrawY - (currentPiece ? currentPiece.y : animState.endY)) * CELL_SIZE;
        if (progress < 0.9 && Math.random() < 0.5) animState.shadowTrails.push({ y: currentDrawY, alpha: 0.5, time: now });
        animState.shadowTrails = animState.shadowTrails.filter((t: any) => now - t.time < 200);
        if (progress >= 0.85 && !animState.impactTriggered) { animState.impactTriggered = true; triggerImpactEffect(animState.endY); }
        if (progress >= 1) { pieceVisualOffsetY = 0; finishHardDropAnimation(); }
      }
      if (animState?.type === 'lineclear') {
        const phaseElapsed = now - animState.phaseStartTime;
        const phaseDur = animState.phaseDurations[animState.phase] || 60;
        if (phaseElapsed >= phaseDur) advanceLineClearPhase(now);
      }
      if (gameState === STATE_NORMAL && pieceVisualAnimDuration > 0) {
        pieceVisualAnimElapsed += deltaMs;
        const progress = Math.min(1, pieceVisualAnimElapsed / pieceVisualAnimDuration);
        const eased = easeOutBack(progress);
        pieceVisualOffsetY = pieceVisualTargetY * (1 - eased);
        if (progress >= 1) { pieceVisualOffsetY = 0; pieceVisualTargetY = 0; pieceVisualAnimDuration = 0; pieceVisualAnimElapsed = 0; }
      }
      updateParticles(deltaMs);
      updateFloatingTexts(deltaMs);
    }
    function advanceLineClearPhase(now: number) {
      const phases = ['flash', 'shake', 'shatter', 'collapse'];
      const currentIdx = phases.indexOf(animState.phase);
      const nextIdx = currentIdx + 1;
      if (nextIdx >= phases.length) { finishLineClearAnimation(); return; }
      const nextPhase = phases[nextIdx];
      animState.phase = nextPhase;
      animState.phaseStartTime = now;
      if (nextPhase === 'shatter' && !animState.particlesSpawned) { animState.particlesSpawned = true; spawnShatterParticles(animState.clearedRows); }
      if (nextPhase === 'collapse') {
        const offsets = removeClearedLines(animState.clearedRows);
        animState.collapseTargetOffsets = offsets;
        for (let r = 0; r < ROWS; r++) rowSlideOffsets[r] = offsets[r] || 0;
        animState.phaseStartTime = performance.now();
      }
      if (nextPhase === 'shake') screenShake = { intensity: 3, duration: 60, elapsed: 0 };
    }
    function spawnShatterParticles(clearedRows: number[]) {
      for (const row of clearedRows) {
        for (let c = 0; c < COLS; c++) {
          const cx = c * CELL_SIZE + CELL_SIZE / 2, cy = row * CELL_SIZE + CELL_SIZE / 2;
          const cellColor = board[row][c] || '#ffffff';
          const numFragments = 5 + Math.floor(Math.random() * 4);
          for (let i = 0; i < numFragments; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 280;
            particles.push({
              x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60,
              size: 2 + Math.random() * 5, color: cellColor, life: 0.4 + Math.random() * 0.7, maxLife: 0.4 + Math.random() * 0.7,
              rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 20, gravity: 180 + Math.random() * 200
            });
          }
        }
      }
      for (let i = 0; i < 30; i++) {
        const row = clearedRows[Math.floor(Math.random() * clearedRows.length)];
        particles.push({
          x: Math.random() * CANVAS_W, y: row * CELL_SIZE + Math.random() * CELL_SIZE,
          vx: (Math.random() - 0.5) * 400, vy: -150 - Math.random() * 300, size: 1.5 + Math.random() * 3, color: '#ffffff',
          life: 0.3 + Math.random() * 0.5, maxLife: 0.3 + Math.random() * 0.5, rotation: 0, rotSpeed: 0, gravity: 50
        });
      }
    }
    function triggerImpactEffect(landingY: number) {
      screenShake = { intensity: 4, duration: 80, elapsed: 0 };
      const centerX = currentPiece ? (currentPiece.x + currentPiece.shape[0].length / 2) * CELL_SIZE : CANVAS_W / 2;
      const centerY = landingY * CELL_SIZE + CELL_SIZE / 2;
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 200;
        particles.push({
          x: centerX, y: centerY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4, color: '#ffffff', life: 0.25 + Math.random() * 0.45, maxLife: 0.25 + Math.random() * 0.45,
          rotation: 0, rotSpeed: 0, gravity: -30, isShockwave: true
        });
      }
      addFloatingText('💥', centerX, centerY - 10, '#ffffff', 20);
    }
    function finishHardDropAnimation() {
      const endY = animState.endY;
      animState = null; pieceVisualOffsetY = 0; pieceVisualTargetY = 0; pieceVisualAnimDuration = 0; pieceVisualAnimElapsed = 0;
      if (currentPiece) currentPiece.y = endY;
      lockPiece();
      const clearedRows = checkCompletedLines();
      if (clearedRows.length > 0) { updateScore(clearedRows.length); startLineClearAnimation(clearedRows); }
      else {
        if (!spawnPiece()) { gameState = STATE_GAME_OVER; isInputEnabled = false; }
        else { gameState = STATE_NORMAL; isInputEnabled = true; dropAccumulator = 0; }
      }
    }
    function finishLineClearAnimation() {
      animState = null; rowSlideOffsets = new Array(ROWS).fill(0);
      screenShake = { intensity: 0, duration: 0, elapsed: 0 };
      if (!spawnPiece()) { gameState = STATE_GAME_OVER; isInputEnabled = false; }
      else { gameState = STATE_NORMAL; isInputEnabled = true; dropAccumulator = 0; }
    }
    function updateParticles(deltaMs: number) {
      const dt = deltaMs / 1000;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.gravity) p.vy += p.gravity * dt;
        if (p.rotSpeed) p.rotation += p.rotSpeed * dt;
      }
    }
    function updateFloatingTexts(deltaMs: number) {
      const dt = deltaMs / 1000;
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i]; ft.life -= dt;
        if (ft.life <= 0) { floatingTexts.splice(i, 1); continue; }
        ft.y += ft.vy * dt;
      }
    }
    function easeInQuad(t: number) { return t * t; }
    function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }
    function easeOutBack(t: number) { const c1 = 1.70158; return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
    function drawCell(context: CanvasRenderingContext2D, x: number, y: number, color: string, glowColor: string, alpha = 1, scale = 1) {
      const cx = x + CELL_SIZE / 2, cy = y + CELL_SIZE / 2;
      const halfSize = (CELL_SIZE / 2 - 2) * scale;
      context.save(); context.globalAlpha = alpha;
      context.translate(cx, cy); context.scale(scale, scale);
      if (glowColor) { context.shadowColor = glowColor; context.shadowBlur = 10; }
      const radius = 4; const hs = CELL_SIZE / 2 - 2;
      context.beginPath();
      context.moveTo(-hs + radius, -hs); context.lineTo(hs - radius, -hs);
      context.quadraticCurveTo(hs, -hs, hs, -hs + radius); context.lineTo(hs, hs - radius);
      context.quadraticCurveTo(hs, hs, hs - radius, hs); context.lineTo(-hs + radius, hs);
      context.quadraticCurveTo(-hs, hs, -hs, hs - radius); context.lineTo(-hs, -hs + radius);
      context.quadraticCurveTo(-hs, -hs, -hs + radius, -hs); context.closePath();
      context.fillStyle = color; context.fill();
      context.shadowColor = 'transparent'; context.shadowBlur = 0;
      const innerGrad = context.createRadialGradient(-hs * 0.25, -hs * 0.3, hs * 0.1, 0, 0, hs * 0.9);
      innerGrad.addColorStop(0, 'rgba(255,255,255,0.45)');
      innerGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
      innerGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
      context.fillStyle = innerGrad; context.fill();
      context.restore();
    }
    function render(now: number) {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      let shakeX = 0, shakeY = 0;
      if (screenShake.intensity > 0) {
        const decay = 1 - screenShake.elapsed / screenShake.duration;
        const intensity = screenShake.intensity * decay;
        shakeX = (Math.sin(now * 0.12) * intensity * 1.5 + (Math.random() - 0.5) * intensity);
        shakeY = (Math.cos(now * 0.15) * intensity * 1.5 + (Math.random() - 0.5) * intensity);
      }
      ctx.save(); ctx.translate(shakeX, shakeY);
      ctx.fillStyle = getCanvasBg(); ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.strokeStyle = getCanvasGrid(); ctx.lineWidth = 0.5;
      for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL_SIZE); ctx.lineTo(CANVAS_W, r * CELL_SIZE); ctx.stroke(); }
      for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL_SIZE, 0); ctx.lineTo(c * CELL_SIZE, CANVAS_H); ctx.stroke(); }
      for (let r = 0; r < ROWS; r++) {
        const drawY = r * CELL_SIZE + (rowSlideOffsets[r] || 0);
        for (let c = 0; c < COLS; c++)
          if (board[r][c]) drawCell(ctx, c * CELL_SIZE, drawY, board[r][c]!, getGlowFromColor(board[r][c]!), 1);
      }
      if (animState?.type === 'lineclear' && (animState.phase === 'flash' || animState.phase === 'shake')) {
        const flashColor = animState.phase === 'flash' ? '#ffffff' : '#ffff88';
        const flashAlphaVal = animState.phase === 'flash' ? 0.9 : 0.6;
        for (const row of animState.clearedRows) {
          const drawY = row * CELL_SIZE + (rowSlideOffsets[row] || 0);
          let sx = 0;
          if (animState.phase === 'shake') sx = Math.sin(performance.now() * 0.6 + row) * 3;
          ctx.fillStyle = flashColor; ctx.globalAlpha = flashAlphaVal;
          ctx.fillRect(sx, drawY, CANVAS_W, CELL_SIZE); ctx.globalAlpha = 1;
        }
      }
      if (ghostEnabled && currentPiece && gameState === STATE_NORMAL && isInputEnabled) {
        const ghostY = getGhostY();
        if (ghostY !== currentPiece.y) {
          for (let r = 0; r < currentPiece.shape.length; r++) {
            for (let c = 0; c < currentPiece.shape[r].length; c++) {
              if (currentPiece.shape[r][c]) {
                const dx = (currentPiece.x + c) * CELL_SIZE, dy = (ghostY + r) * CELL_SIZE;
                if (ghostY + r >= 0) {
                  ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = currentPiece.glow; ctx.lineWidth = 2;
                  ctx.setLineDash([3, 3]); ctx.strokeRect(dx + 3, dy + 3, CELL_SIZE - 6, CELL_SIZE - 6); ctx.setLineDash([]);
                  ctx.globalAlpha = 1; ctx.restore();
                }
              }
            }
          }
        }
      }
      if (animState?.type === 'harddrop' && currentPiece) {
        for (const trail of animState.shadowTrails) {
          const age = performance.now() - trail.time;
          const alpha = trail.alpha * Math.max(0, 1 - age / 200);
          for (let r = 0; r < currentPiece.shape.length; r++)
            for (let c = 0; c < currentPiece.shape[r].length; c++)
              if (currentPiece.shape[r][c]) {
                const dx = (currentPiece.x + c) * CELL_SIZE, dy = (trail.y + r) * CELL_SIZE;
                if (trail.y + r >= -1 && trail.y + r < ROWS) {
                  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = currentPiece.color;
                  ctx.fillRect(dx + 2, dy + 2, CELL_SIZE - 4, CELL_SIZE - 4); ctx.globalAlpha = 1; ctx.restore();
                }
              }
        }
      }
      if (currentPiece && !(animState?.type === 'lineclear')) {
        const visualYOffset = pieceVisualOffsetY || 0;
        for (let r = 0; r < currentPiece.shape.length; r++) {
          for (let c = 0; c < currentPiece.shape[r].length; c++) {
            if (currentPiece.shape[r][c]) {
              const dx = (currentPiece.x + c) * CELL_SIZE, dy = (currentPiece.y + r) * CELL_SIZE + visualYOffset;
              if (currentPiece.y + r >= -3) {
                let scale = 1;
                if (gameState === STATE_NORMAL && pieceVisualAnimDuration > 0 && pieceVisualTargetY < 0) {
                  const prog = pieceVisualAnimElapsed / pieceVisualAnimDuration;
                  if (prog < 0.3) scale = 0.93 + 0.07 * (prog / 0.3);
                }
                drawCell(ctx, dx, dy, currentPiece.color, currentPiece.glow, 1, scale);
              }
            }
          }
        }
      }
      if (animState?.type === 'harddrop' && animState.impactTriggered) {
        const impactElapsed = performance.now() - animState.startTime - animState.duration * 0.85;
        if (impactElapsed > 0 && impactElapsed < 200) {
          const progress = impactElapsed / 200, radius = progress * 100, alpha = 1 - progress;
          const centerX = currentPiece ? (currentPiece.x + currentPiece.shape[0].length / 2) * CELL_SIZE : CANVAS_W / 2;
          const centerY = animState.endY * CELL_SIZE + CELL_SIZE / 2;
          ctx.save(); ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 * (1 - progress);
          ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = 'rgba(200,220,255,0.7)'; ctx.lineWidth = 1.5 * (1 - progress);
          ctx.beginPath(); ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1; ctx.restore();
        }
      }
      for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate(p.rotation);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.globalAlpha = 1; ctx.restore();
      }
      for (const ft of floatingTexts) {
        const alpha = ft.life / ft.maxLife;
        ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.size}px 'Courier New', monospace`; ctx.textAlign = 'center';
        ctx.shadowColor = ft.color; ctx.shadowBlur = 15;
        ctx.fillText(ft.text, ft.x, ft.y); ctx.shadowBlur = 0;
        ctx.globalAlpha = 1; ctx.restore();
      }
      if (flashAlpha > 0) ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.35})`, ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }
    function getGlowFromColor(color: string) {
      const map: Record<string, string> = {
        '#818cf8': '#a5b4fc', '#34d399': '#6ee7b7', '#8b5cf6': '#a78bfa',
        '#f59e0b': '#fbbf24', '#38bdf8': '#7dd3fc', '#10b981': '#34d399', '#f87171': '#fca5a5'
      };
      return map[color] || '#cbd5e1';
    }
    function drawPreview() {
      previewCtx.clearRect(0, 0, 120, 120);
      previewCtx.fillStyle = getCanvasBg(); previewCtx.fillRect(0, 0, 120, 120);
      if (!nextPieceType) return;
      const shape = PIECE_SHAPES[nextPieceType];
      const color = PIECE_COLORS[nextPieceType];
      const glow = PIECE_GLOW[nextPieceType];
      const previewCellSize = 26;
      const offsetX = (120 - shape[0].length * previewCellSize) / 2;
      const offsetY = (120 - shape.length * previewCellSize) / 2;
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          if (shape[r][c]) {
            const px = offsetX + c * previewCellSize, py = offsetY + r * previewCellSize;
            previewCtx.save(); previewCtx.shadowColor = glow; previewCtx.shadowBlur = 6;
            previewCtx.fillStyle = color; const radius = 3, hs = previewCellSize / 2 - 2;
            const cx = px + previewCellSize / 2, cy = py + previewCellSize / 2;
            previewCtx.beginPath();
            previewCtx.moveTo(cx - hs + radius, cy - hs); previewCtx.lineTo(cx + hs - radius, cy - hs);
            previewCtx.quadraticCurveTo(cx + hs, cy - hs, cx + hs, cy - hs + radius);
            previewCtx.lineTo(cx + hs, cy + hs - radius); previewCtx.quadraticCurveTo(cx + hs, cy + hs, cx + hs - radius, cy + hs);
            previewCtx.lineTo(cx - hs + radius, cy + hs); previewCtx.quadraticCurveTo(cx - hs, cy + hs, cx - hs, cy + hs - radius);
            previewCtx.lineTo(cx - hs, cy - hs + radius); previewCtx.quadraticCurveTo(cx - hs, cy - hs, cx - hs + radius, cy - hs);
            previewCtx.closePath(); previewCtx.fill();
            previewCtx.shadowBlur = 0; previewCtx.restore();
          }
    }
    function tryRotate(rotatedShape: number[][]) {
      const kicks = [0, -1, 1, -2, 2];
      for (const dx of kicks) if (isValidPosition(rotatedShape, currentPiece.x + dx, currentPiece.y)) { currentPiece.x += dx; return true; }
      for (const dy of [-1, -2]) for (const dx of kicks) if (isValidPosition(rotatedShape, currentPiece.x + dx, currentPiece.y + dy)) { currentPiece.x += dx; currentPiece.y += dy; return true; }
      return false;
    }
    function handleInput(action: string) {
      if (!isInputEnabled && action !== 'restart') return;
      if (gameState === STATE_GAME_OVER && action !== 'restart') return;
      if (gameState === STATE_PAUSED && action !== 'pause' && action !== 'restart') return;
      switch (action) {
        case 'left': if (gameState === STATE_NORMAL && currentPiece && isValidPosition(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) currentPiece.x--; break;
        case 'right': if (gameState === STATE_NORMAL && currentPiece && isValidPosition(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) currentPiece.x++; break;
        case 'down': if (gameState === STATE_NORMAL && currentPiece && isValidPosition(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
          currentPiece.y++; pieceVisualTargetY = -CELL_SIZE; pieceVisualAnimDuration = 45; pieceVisualAnimElapsed = 0; pieceVisualOffsetY = pieceVisualTargetY; dropAccumulator = 0;
        } break;
        case 'rotate': if (gameState === STATE_NORMAL && currentPiece) { const r = rotateCW(currentPiece.shape); if (tryRotate(r)) currentPiece.shape = r; } break;
        case 'harddrop': if (gameState === STATE_NORMAL && currentPiece && isInputEnabled) {
          const ghostY = getGhostY();
          if (ghostY !== currentPiece.y) { const startY = currentPiece.y; currentPiece.y = ghostY; startHardDropAnimation(startY, ghostY); }
        } break;
        case 'pause': if (gameState === STATE_NORMAL) { gameState = STATE_PAUSED; isInputEnabled = false; } else if (gameState === STATE_PAUSED) { gameState = STATE_NORMAL; isInputEnabled = true; dropAccumulator = 0; lastFrameTime = performance.now(); } break;
        case 'restart': resetGame(); break;
      }
    }
    function resetGame() {
      animState = null; particles = []; floatingTexts = []; screenShake = { intensity: 0, duration: 0, elapsed: 0 };
      rowSlideOffsets = new Array(ROWS).fill(0); flashAlpha = 0;
      pieceVisualOffsetY = 0; pieceVisualTargetY = 0; pieceVisualAnimDuration = 0; pieceVisualAnimElapsed = 0;
      dropAccumulator = 0; lastFrameTime = 0; score = 0; level = 1; totalLines = 0; dropInterval = 600;
      createBoard(); nextPieceType = getRandomPieceType();
      gameState = STATE_NORMAL; isInputEnabled = true;
      overlayText.classList.remove('visible');
      flashOverlay.classList.remove('active');
      pauseIndicator.classList.remove('active');
      if (!spawnPiece()) { gameState = STATE_GAME_OVER; isInputEnabled = false; }
      updateDisplay();
    }
    function exportSave() {
      if (gameState === STATE_LINE_CLEAR || gameState === STATE_HARD_DROP) { alert('动画进行中，请稍后再导出'); return; }
      const saveData = {
        board, currentPiece: currentPiece ? { type: currentPiece.type, shape: currentPiece.shape, x: currentPiece.x, y: currentPiece.y } : null,
        nextPieceType, score, level, totalLines, highScore, dropInterval,
        gameState: gameState === STATE_GAME_OVER ? 'gameover' : (gameState === STATE_PAUSED ? 'paused' : 'normal'),
        timestamp: new Date().toISOString()
      };
      const json = JSON.stringify(saveData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'tetris_save_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json'; a.click();
      URL.revokeObjectURL(url); addFloatingText('已导出!', CANVAS_W / 2, CANVAS_H / 2, '#30ff60', 20);
    }
    function importSave(file: File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target?.result as string);
          if (!saveData.board || !Array.isArray(saveData.board) || saveData.board.length !== ROWS) throw new Error('无效存档');
          animState = null; particles = []; floatingTexts = []; screenShake = { intensity: 0, duration: 0, elapsed: 0 };
          rowSlideOffsets = new Array(ROWS).fill(0); flashAlpha = 0;
          pieceVisualOffsetY = 0; pieceVisualTargetY = 0; pieceVisualAnimDuration = 0; pieceVisualAnimElapsed = 0;
          dropAccumulator = 0; lastFrameTime = performance.now();
          board = saveData.board.map((row: any) => [...row]);
          score = saveData.score || 0; level = saveData.level || 1; totalLines = saveData.totalLines || 0;
          highScore = saveData.highScore || 0;
          dropInterval = saveData.dropInterval || Math.max(150, 600 - level * 20);
          nextPieceType = saveData.nextPieceType || getRandomPieceType();
          if (saveData.currentPiece?.type && PIECE_TYPES.includes(saveData.currentPiece.type)) {
            currentPiece = createPiece(saveData.currentPiece.type);
            currentPiece.x = saveData.currentPiece.x; currentPiece.y = saveData.currentPiece.y;
            currentPiece.shape = saveData.currentPiece.shape;
          } else currentPiece = null;
          const savedState = saveData.gameState || 'normal';
          if (savedState === 'paused') { gameState = STATE_PAUSED; isInputEnabled = false; }
          else if (savedState === 'gameover') { gameState = STATE_GAME_OVER; isInputEnabled = false; overlayText.classList.add('visible'); }
          else { gameState = STATE_NORMAL; isInputEnabled = true; overlayText.classList.remove('visible'); }
          if (!currentPiece && gameState === STATE_NORMAL) { if (!spawnPiece()) { gameState = STATE_GAME_OVER; isInputEnabled = false; overlayText.classList.add('visible'); } }
          if (highScore > (parseInt(localStorage.getItem('tetris_highscore') || '0'))) localStorage.setItem('tetris_highscore', String(highScore));
          updateDisplay(); pauseIndicator.classList.remove('active'); flashOverlay.classList.remove('active');
          addFloatingText('已导入!', CANVAS_W / 2, CANVAS_H / 2, '#30ff60', 20);
        } catch (err: any) { alert('导入失败：' + err.message); addFloatingText('导入失败', CANVAS_W / 2, CANVAS_H / 2, '#ff4455', 20); }
      };
      reader.readAsText(file);
    }
    function gameLoop(timestamp: number) {
      if (!isMounted.current) return;
      if (!lastFrameTime) lastFrameTime = timestamp;
      let deltaMs = timestamp - lastFrameTime;
      lastFrameTime = timestamp;
      if (deltaMs > 200) deltaMs = 200;
      if (gameState === STATE_NORMAL && isInputEnabled) {
        dropAccumulator += deltaMs;
        if (dropAccumulator >= dropInterval) {
          dropAccumulator -= dropInterval;
          if (currentPiece && isValidPosition(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
            currentPiece.y++; pieceVisualTargetY = -CELL_SIZE; pieceVisualAnimDuration = 50; pieceVisualAnimElapsed = 0; pieceVisualOffsetY = pieceVisualTargetY;
          } else if (currentPiece) {
            lockPiece(); const clearedRows = checkCompletedLines();
            if (clearedRows.length > 0) { updateScore(clearedRows.length); startLineClearAnimation(clearedRows); }
            else { if (!spawnPiece()) { gameState = STATE_GAME_OVER; isInputEnabled = false; } }
            dropAccumulator = 0;
          }
        }
      }
      updateAnimations(deltaMs);
      render(timestamp);
      drawPreview();
      if (flashAlpha > 0.15) flashOverlay.classList.add('active'); else flashOverlay.classList.remove('active');
      if (gameState === STATE_PAUSED) pauseIndicator.classList.add('active'); else pauseIndicator.classList.remove('active');
      if (gameState === STATE_GAME_OVER) overlayText.classList.add('visible');
      gameLoopId.current = requestAnimationFrame(gameLoop);
    }

    handleInputRef.current = handleInput;
    exportSaveRef.current = exportSave;
    importSaveRef.current = importSave;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'r', 'R', 'p', 'P'].includes(key) || key === ' ') e.preventDefault();
      switch (key) {
        case 'ArrowLeft': handleInput('left'); break;
        case 'ArrowRight': handleInput('right'); break;
        case 'ArrowDown': handleInput('down'); break;
        case 'ArrowUp': handleInput('rotate'); break;
        case ' ': handleInput('harddrop'); break;
        case 'r': case 'R': handleInput('restart'); break;
        case 'p': case 'P': handleInput('pause'); break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const handleGhostToggleChange = () => { ghostEnabled = ghostToggleRef.current?.checked ?? true; };
    ghostToggleRef.current?.addEventListener('change', handleGhostToggleChange);

    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; touchStartTime = Date.now(); e.preventDefault(); }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dt = Date.now() - touchStartTime;
      const dx = (e.changedTouches[0]?.clientX || touchStartX) - touchStartX;
      const dy = (e.changedTouches[0]?.clientY || touchStartY) - touchStartY;
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 300) handleInput('rotate');
      else if (Math.abs(dy) > Math.abs(dx) && dy > 30 && dt < 400) handleInput('harddrop');
      else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) handleInput(dx > 0 ? 'right' : 'left');
      e.preventDefault();
    };
    canvas?.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas?.addEventListener('touchend', handleTouchEnd, { passive: false });

    highScore = parseInt(localStorage.getItem('tetris_highscore') || '0');
    createBoard(); nextPieceType = getRandomPieceType();
    gameState = STATE_NORMAL; isInputEnabled = true;
    updateDisplay();
    if (!spawnPiece()) { gameState = STATE_GAME_OVER; isInputEnabled = false; }
    lastFrameTime = performance.now();
    gameLoopId.current = requestAnimationFrame(gameLoop);

    return () => {
      isMounted.current = false;
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
      document.removeEventListener('keydown', handleKeyDown);
      ghostToggleRef.current?.removeEventListener('change', handleGhostToggleChange);
      canvas?.removeEventListener('touchstart', handleTouchStart);
      canvas?.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="w-[70%] mx-auto py-8 px-4">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <BackButton />

      <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
        🧱 俄罗斯方块
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        经典俄罗斯方块，键盘方向键操作，空格键硬降
      </p>

      <div className="flex flex-wrap gap-6 items-start justify-center w-full">
        <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 relative" id="gameWrapper">
          <canvas id="gameCanvas" width="350" height="700"></canvas>
          <div className="flash-overlay" id="flashOverlay"></div>
          <div className="pause-indicator" id="pauseIndicator">⏸ 已暂停</div>
        </div>

        <div className="flex flex-col gap-4 min-w-[190px] max-w-[220px]">
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 text-center">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">下一个方块</div>
            <canvas className="preview-canvas" id="previewCanvas" width="120" height="120"></canvas>
          </div>

          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">分数</div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white panel-value" id="scoreDisplay">0</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">等级</div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white panel-value" id="levelDisplay">1</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">消行</div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white panel-value" id="linesDisplay">0</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">最高分</div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white panel-value" id="highScoreDisplay">0</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleInputRef.current?.('restart')}
              className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
            >
              🔄 新游戏
            </button>
            <button
              onClick={() => handleInputRef.current?.('pause')}
              className="w-full px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95"
            >
              ⏸ 暂停/继续
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => exportSaveRef.current?.()}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95"
              >
                💾 导出
              </button>
              <button
                onClick={() => importFileInputRef.current?.click()}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95"
              >
                📥 导入
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" ref={ghostToggleRef} defaultChecked className="rounded" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">幽灵方块</span>
          </label>

          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 mt-2">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2.5">操作说明</h3>
            <ul>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>← → ↓ ↑</span>
                <span>移动，软降，旋转</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>空格</span>
                <span>硬降（直接落底）</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>P</span>
                <span>暂停 / 继续</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>R</span>
                <span>重新开始</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>📱</span>
                <span>支持触摸：点击旋转，下滑硬降，左右滑移动</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center" id="overlay">
        <div className="overlay-text" id="overlayText">游戏结束</div>
      </div>

      <input
        type="file"
        ref={importFileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importSaveRef.current?.(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}