"use client";

import BackButton from "@/app/_components/article/BackButton";
import { useEffect, useRef } from "react";

export default function SnakePage() {
  // ==================== Refs for DOM elements ====================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pauseOverlayRef = useRef<HTMLDivElement>(null);
  const scoreDisplayRef = useRef<HTMLDivElement>(null);
  const levelDisplayRef = useRef<HTMLDivElement>(null);
  const lengthDisplayRef = useRef<HTMLDivElement>(null);
  const highScoreDisplayRef = useRef<HTMLDivElement>(null);
  const btnPauseRef = useRef<HTMLButtonElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  // 新增：用于暴露游戏内部函数给 JSX
  const restartGameRef = useRef<(() => void) | null>(null);
  const togglePauseRef = useRef<(() => void) | null>(null);
  const exportSaveRef = useRef<(() => void) | null>(null);
  const importSaveRef = useRef<((file: File) => void) | null>(null);

  // Game state refs (to avoid re-renders)
  const gameStateRef = useRef({
    snake: [] as { row: number; col: number }[],
    direction: { dr: 0, dc: 1 },
    nextDirection: { dr: 0, dc: 1 },
    food: null as { row: number; col: number } | null,
    score: 0,
    level: 1,
    highScore: 0,
    moveInterval: 200,
    gameOver: false,
    paused: false,
    won: false,
    gameStarted: false,
    // Animation
    prevSnake: [] as { row: number; col: number }[],
    moveProgress: 0,
    accumulatedTime: 0,
    lastFrameTime: null as number | null,
    animationFrameId: null as number | null,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; gravity?: number; rotation?: number; rotSpeed?: number; isShockwave?: boolean }[],
    floatingTexts: [] as { x: number; y: number; text: string; life: number; maxLife: number; vy: number; fontSize: number }[],
    gameOverFlashTimer: 0,
    gameOverFlashCount: 0,
    gameOverAnimStart: 0,
    foodEatAnim: null as { x: number; y: number; progress: number; duration: number } | null,
    resetFadeState: null as { phase: string; progress: number; duration: number } | null,
    // Constants
    GRID_SIZE: 20,
    CELL_SIZE: 25,
    CANVAS_SIZE: 500,
    INITIAL_MOVE_INTERVAL: 200,
    MIN_MOVE_INTERVAL: 80,
    SPEED_STEP: 10,
    SCORE_PER_FOOD: 10,
    SCORE_PER_LEVEL: 50,
    INITIAL_SNAKE_LENGTH: 3,
  });

  // ==================== Helper functions ====================
  const getState = () => gameStateRef.current;

  // ==================== Game Logic (will be defined inside useEffect) ====================
  useEffect(() => {
    const state = getState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const {
      GRID_SIZE,
      CELL_SIZE,
      CANVAS_SIZE,
      INITIAL_MOVE_INTERVAL,
      MIN_MOVE_INTERVAL,
      SPEED_STEP,
      SCORE_PER_FOOD,
      SCORE_PER_LEVEL,
      INITIAL_SNAKE_LENGTH,
    } = state;

    const getCanvasBg = () => getComputedStyle(document.documentElement).getPropertyValue('--snake-canvas-bg').trim() || 'rgba(255,255,255,0.45)';
    const getCanvasGrid = () => getComputedStyle(document.documentElement).getPropertyValue('--snake-canvas-grid').trim() || 'rgba(0,0,0,0.04)';
    const getOverlayBg = () => getComputedStyle(document.documentElement).getPropertyValue('--snake-overlay-bg').trim() || 'rgba(255,255,255,0.6)';
    const getOverlayText = () => getComputedStyle(document.documentElement).getPropertyValue('--snake-overlay-text').trim() || '#1e293b';

    // ---- Local helper functions that depend on canvas/ctx ----
    const updateUI = () => {
      const s = getState();
      if (scoreDisplayRef.current) scoreDisplayRef.current.textContent = String(s.score);
      if (levelDisplayRef.current) levelDisplayRef.current.textContent = "Lv." + s.level;
      if (lengthDisplayRef.current) lengthDisplayRef.current.textContent = String(s.snake.length);
      if (highScoreDisplayRef.current) highScoreDisplayRef.current.textContent = String(s.highScore);
      if (s.score > s.highScore) {
        s.highScore = s.score;
        localStorage.setItem("snake_high_score_v2", String(s.highScore));
        if (highScoreDisplayRef.current) highScoreDisplayRef.current.textContent = String(s.highScore);
      }
    };

    const createInitialSnake = () => {
      const row = 10;
      const startCol = 8;
      const snakeArr = [];
      for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        snakeArr.push({ row: row, col: startCol + (INITIAL_SNAKE_LENGTH - 1 - i) });
      }
      return snakeArr;
    };

    const generateFood = () => {
      const s = getState();
      const occupied = new Set();
      for (const seg of s.snake) {
        occupied.add(`${seg.row},${seg.col}`);
      }
      const emptyCells = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!occupied.has(`${r},${c}`)) {
            emptyCells.push({ row: r, col: c });
          }
        }
      }
      if (emptyCells.length === 0) return null;
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    };

    const getNextHead = () => {
      const s = getState();
      const head = s.snake[0];
      return { row: head.row + s.direction.dr, col: head.col + s.direction.dc };
    };

    const isOutOfBounds = (pos: { row: number; col: number }) => pos.row < 0 || pos.row >= GRID_SIZE || pos.col < 0 || pos.col >= GRID_SIZE;

    const isOnSnake = (pos: { row: number; col: number }, excludeTail = false): boolean => {
      const s = getState();
      const endIdx = excludeTail ? s.snake.length - 1 : s.snake.length;
      for (let i = 0; i < endIdx; i++) {
        if (s.snake[i].row === pos.row && s.snake[i].col === pos.col) return true;
      }
      return false;
    };

    const spawnEatParticles = (x: number, y: number) => {
      const count = 10;
      const colors = ["#ffeb3b", "#ff9800", "#ff5722", "#ffc107", "#ffffff", "#ffcc80"];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = 80 + Math.random() * 180;
        const life = 250 + Math.random() * 200;
        getState().particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2.5 + Math.random() * 4,
        });
      }
    };

    const spawnCelebrationParticles = () => {
      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;
      const count = 40;
      const colors = ["#ffeb3b", "#ff9800", "#ff5722", "#ffc107", "#ffffff", "#ffcc80", "#4ecb71", "#5eff7e"];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const speed = 150 + Math.random() * 350;
        const life = 600 + Math.random() * 800;
        getState().particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 60,
          life,
          maxLife: life,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 6,
        });
      }
    };

    const spawnFloatingText = (x: number, y: number, text: string, fontSize = 16) => {
      getState().floatingTexts.push({
        x,
        y,
        text,
        life: 700,
        maxLife: 700,
        vy: -70,
        fontSize,
      });
    };

    const triggerGameOver = () => {
      const s = getState();
      s.gameOver = true;
      s.gameOverFlashCount = 0;
      s.gameOverFlashTimer = performance.now();
      s.gameOverAnimStart = performance.now();
      s.moveProgress = 1;
      updateUI();
      if (s.score > s.highScore) {
        s.highScore = s.score;
        localStorage.setItem("snake_high_score_v2", String(s.highScore));
        if (highScoreDisplayRef.current) highScoreDisplayRef.current.textContent = String(s.highScore);
        spawnCelebrationParticles();
      }
    };

    const performMove = () => {
      const s = getState();
      if (s.gameOver || s.won || s.paused || !s.gameStarted) return;

      s.direction = { ...s.nextDirection };
      s.prevSnake = s.snake.map((seg) => ({ ...seg }));

      const newHead = getNextHead();
      if (isOutOfBounds(newHead)) {
        s.snake.unshift(newHead);
        triggerGameOver();
        return;
      }

      const ateFood = s.food && newHead.row === s.food.row && newHead.col === s.food.col;
      s.snake.unshift(newHead);

      if (ateFood) {
        s.score += SCORE_PER_FOOD;
        const oldLevel = s.level;
        s.level = Math.floor(s.score / SCORE_PER_LEVEL) + 1;
        s.moveInterval = Math.max(MIN_MOVE_INTERVAL, INITIAL_MOVE_INTERVAL - (s.level - 1) * SPEED_STEP);

        const foodPX = s.food!.col * CELL_SIZE + CELL_SIZE / 2;
        const foodPY = s.food!.row * CELL_SIZE + CELL_SIZE / 2;
        s.foodEatAnim = { x: foodPX, y: foodPY, progress: 0, duration: 100 };
        spawnEatParticles(foodPX, foodPY);
        spawnFloatingText(foodPX, foodPY - 10, "+10");

        s.food = generateFood();
        if (s.food === null) {
          s.won = true;
          s.gameOver = true;
          spawnFloatingText(CANVAS_SIZE / 2, CANVAS_SIZE / 2, "YOU WIN!", 28);
        }

        if (s.level > oldLevel && !s.won) {
          if (levelDisplayRef.current) {
            levelDisplayRef.current.classList.remove("flash");
            void levelDisplayRef.current.offsetWidth;
            levelDisplayRef.current.classList.add("flash");
          }
          spawnFloatingText(CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 40, "⬆ Lv." + s.level + "!", 20);
        }
      } else {
        s.snake.pop();
      }

      const head = s.snake[0];
      for (let i = 1; i < s.snake.length; i++) {
        if (s.snake[i].row === head.row && s.snake[i].col === head.col) {
          triggerGameOver();
          return;
        }
      }

      updateUI();

      if (ateFood && scoreDisplayRef.current) {
        scoreDisplayRef.current.classList.remove("bump");
        void scoreDisplayRef.current.offsetWidth;
        scoreDisplayRef.current.classList.add("bump");
      }
      if (s.score > s.highScore && highScoreDisplayRef.current) {
        highScoreDisplayRef.current.classList.remove("highlight-gold");
        void highScoreDisplayRef.current.offsetWidth;
        highScoreDisplayRef.current.classList.add("highlight-gold");
      }
    };

    // ---- Drawing functions ----
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const getPixelCenter = (row: number, col: number) => ({ x: col * CELL_SIZE + CELL_SIZE / 2, y: row * CELL_SIZE + CELL_SIZE / 2 });

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    };

    const drawGrid = () => {
      ctx.strokeStyle = getCanvasGrid();
      ctx.lineWidth = 0.6;
      for (let r = 0; r <= GRID_SIZE; r++) {
        const y = r * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_SIZE, y);
        ctx.stroke();
      }
      for (let c = 0; c <= GRID_SIZE; c++) {
        const x = c * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_SIZE);
        ctx.stroke();
      }
      ctx.strokeStyle = getCanvasGrid();
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    };

    const drawSnake = () => {
      const s = getState();
      if (s.snake.length === 0) return;

      let flashRed = false;
      if (s.gameOver && s.gameOverFlashCount < 4) {
        const elapsed = performance.now() - s.gameOverFlashTimer;
        const cyclePos = elapsed % 300;
        flashRed = cyclePos < 150;
      }

      const visualPositions = [];
      const progress = Math.min(s.moveProgress, 1);
      for (let i = 0; i < s.snake.length; i++) {
        const curr = s.snake[i];
        let prevPos = null;
        if (i < s.prevSnake.length && s.prevSnake.length === s.snake.length) {
          prevPos = s.prevSnake[i];
        } else if (i === 0 && s.prevSnake.length > 0) {
          prevPos = s.prevSnake[0];
        } else if (i > 0 && i - 1 < s.prevSnake.length && s.snake.length > s.prevSnake.length) {
          prevPos = s.prevSnake[i - 1];
        } else if (i < s.prevSnake.length && s.snake.length === s.prevSnake.length) {
          prevPos = s.prevSnake[i];
        } else {
          prevPos = curr;
        }
        if (prevPos && (prevPos.row !== curr.row || prevPos.col !== curr.col)) {
          const from = getPixelCenter(prevPos.row, prevPos.col);
          const to = getPixelCenter(curr.row, curr.col);
          visualPositions.push({ x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress) });
        } else {
          const pc = getPixelCenter(curr.row, curr.col);
          visualPositions.push({ x: pc.x, y: pc.y });
        }
      }

      const segSize = CELL_SIZE - 2;
      const segRadius = 6;
      for (let i = s.snake.length - 1; i >= 0; i--) {
        const vp = visualPositions[i];
        const px = vp.x - segSize / 2;
        const py = vp.y - segSize / 2;
        if (i === 0) continue;
        const t = s.snake.length > 1 ? i / (s.snake.length - 1) : 0;
        const r = flashRed ? 220 : Math.floor(lerp(129, 99, t));
        const g = flashRed ? 40 : Math.floor(lerp(140, 102, t));
        const b = flashRed ? 40 : Math.floor(lerp(248, 241, t));
        const alpha = flashRed ? 0.9 : 0.85;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        drawRoundedRect(px, py, segSize, segSize, segRadius);
        ctx.fill();
        ctx.strokeStyle = flashRed ? "rgba(255,100,100,0.7)" : `rgba(${r + 30},${g + 30},${b + 30},0.5)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (s.snake.length > 0 && visualPositions.length > 0) {
        const headVP = visualPositions[0];
        const hpx = headVP.x - segSize / 2;
        const hpy = headVP.y - segSize / 2;
        const hr = flashRed ? 240 : 129;
        const hg = flashRed ? 50 : 140;
        const hb = flashRed ? 50 : 248;
        ctx.fillStyle = `rgba(${hr},${hg},${hb},0.35)`;
        ctx.beginPath();
        ctx.arc(headVP.x, headVP.y, segSize / 2 + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${hr},${hg},${hb},0.95)`;
        drawRoundedRect(hpx, hpy, segSize, segSize, segRadius + 1);
        ctx.fill();
        ctx.strokeStyle = flashRed ? "rgba(255,150,150,0.9)" : "rgba(165,180,252,0.7)";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const eyeRadius = 3.5;
        const eyeOffsetX = 5;
        const eyeOffsetY = 6;
        let eye1X, eye1Y, eye2X, eye2Y;
        if (s.direction.dc === 1) {
          eye1X = headVP.x + eyeOffsetX; eye1Y = headVP.y - eyeOffsetY;
          eye2X = headVP.x + eyeOffsetX; eye2Y = headVP.y + eyeOffsetY;
        } else if (s.direction.dc === -1) {
          eye1X = headVP.x - eyeOffsetX; eye1Y = headVP.y - eyeOffsetY;
          eye2X = headVP.x - eyeOffsetX; eye2Y = headVP.y + eyeOffsetY;
        } else if (s.direction.dr === -1) {
          eye1X = headVP.x - eyeOffsetY; eye1Y = headVP.y - eyeOffsetX;
          eye2X = headVP.x + eyeOffsetY; eye2Y = headVP.y - eyeOffsetX;
        } else {
          eye1X = headVP.x - eyeOffsetY; eye1Y = headVP.y + eyeOffsetX;
          eye2X = headVP.x + eyeOffsetY; eye2Y = headVP.y + eyeOffsetX;
        }
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#0a0a0a";
        ctx.beginPath(); ctx.arc(eye1X, eye1Y, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eye2X, eye2Y, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    };

    const drawFoodAt = (cx: number, cy: number, scale: number, rotation: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.rotate(rotation);
      const glowGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, 14);
      glowGrad.addColorStop(0, "rgba(52,211,153,0.7)");
      glowGrad.addColorStop(0.5, "rgba(52,211,153,0.3)");
      glowGrad.addColorStop(1, "rgba(52,211,153,0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
      const outerR = 9.5, innerR = 3.8, spikes = 5;
      ctx.fillStyle = "#34d399";
      ctx.strokeStyle = "#a7f3d0";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI * 2 / (spikes * 2)) * i - Math.PI / 2;
        const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      const highlightGrad = ctx.createRadialGradient(0, -1.5, 0.5, 0, 0, 5);
      highlightGrad.addColorStop(0, "rgba(255,255,255,0.9)");
      highlightGrad.addColorStop(0.4, "rgba(167,243,208,0.5)");
      highlightGrad.addColorStop(1, "rgba(52,211,153,0)");
      ctx.fillStyle = highlightGrad;
      ctx.beginPath(); ctx.arc(0, -1.5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawFood = () => {
      const s = getState();
      if (!s.food) return;
      if (s.foodEatAnim) {
        const t = s.foodEatAnim.progress / s.foodEatAnim.duration;
        const scale = 1 - t;
        const rotation = t * Math.PI * 3;
        const alpha = 1 - t;
        if (scale <= 0) return;
        drawFoodAt(s.foodEatAnim.x, s.foodEatAnim.y, scale, rotation, alpha);
      } else {
        const pc = getPixelCenter(s.food.row, s.food.col);
        const pulse = 1 + Math.sin(performance.now() / 350) * 0.12;
        const rotation = performance.now() / 1200 * Math.PI * 2;
        drawFoodAt(pc.x, pc.y, pulse, rotation, 1);
      }
    };

    const drawParticlesAndTexts = () => {
      const s = getState();
      for (const p of s.particles) {
        const alpha = Math.max(0, p.life / p.maxLife);
        const size = p.size * alpha;
        let r, g, b;
        if (p.color.startsWith("#")) {
          r = parseInt(p.color.slice(1, 3), 16);
          g = parseInt(p.color.slice(3, 5), 16);
          b = parseInt(p.color.slice(5, 7), 16);
        } else {
          r = g = b = 255;
        }
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, size), 0, Math.PI * 2);
        ctx.fill();
      }
      for (const ft of s.floatingTexts) {
        const alpha = Math.max(0, ft.life / ft.maxLife);
        const scale = 1 + (1 - alpha) * 0.4;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${ft.fontSize * scale}px "Inter","Segoe UI","PingFang SC","Microsoft YaHei",sans-serif`;
        ctx.fillStyle = ft.text.includes("WIN") ? "#34d399" : "#475569";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    };

    const drawGameOverOverlay = () => {
      const s = getState();
      if (!s.gameOver) return;
      const elapsed = performance.now() - s.gameOverAnimStart;
      const slideDuration = 500;
      const targetY = CANVAS_SIZE / 2;
      const startY = -60;
      let currentY;
      if (elapsed < slideDuration) {
        const t = elapsed / slideDuration;
        const eased = 1 - Math.pow(1 - t, 3);
        currentY = lerp(startY, targetY, eased);
      } else {
        currentY = targetY;
      }
      const bgY = currentY - 40, bgH = 80, bgX = CANVAS_SIZE / 2 - 180, bgW = 360;
      ctx.fillStyle = getOverlayBg();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bgX, bgY, bgW, bgH, 16);
      else {
        ctx.moveTo(bgX + 16, bgY); ctx.lineTo(bgX + bgW - 16, bgY);
        ctx.quadraticCurveTo(bgX + bgW, bgY, bgX + bgW, bgY + 16);
        ctx.lineTo(bgX + bgW, bgY + bgH - 16);
        ctx.quadraticCurveTo(bgX + bgW, bgY + bgH, bgX + bgW - 16, bgY + bgH);
        ctx.lineTo(bgX + 16, bgY + bgH);
        ctx.quadraticCurveTo(bgX, bgY + bgH, bgX, bgY + bgH - 16);
        ctx.lineTo(bgX, bgY + 16);
        ctx.quadraticCurveTo(bgX, bgY, bgX + 16, bgY);
      }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = getOverlayText();
      ctx.font = 'bold 38px "Inter","Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(129,140,248,0.4)";
      ctx.shadowBlur = 20;
      ctx.fillText(s.won ? "🎉 YOU WIN! 🎉" : "GAME OVER", CANVAS_SIZE / 2, currentY + 6);
      ctx.shadowBlur = 0;
      if (!s.won && elapsed > slideDuration + 200) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = '14px "Inter","Segoe UI","PingFang SC","Microsoft YaHei",sans-serif';
        ctx.fillText('按 R 键或点击"新游戏"重新开始', CANVAS_SIZE / 2, currentY + 34);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = getCanvasBg();
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      drawGrid();
      drawFood();
      drawSnake();
      drawParticlesAndTexts();
      drawGameOverOverlay();
    };

    const updateParticles = (dt: number) => {
      const s = getState();
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life -= dt * 1000;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt;
        if (p.life <= 0) s.particles.splice(i, 1);
      }
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.life -= dt * 1000;
        ft.y += ft.vy * dt;
        if (ft.life <= 0) s.floatingTexts.splice(i, 1);
      }
      if (s.foodEatAnim) {
        s.foodEatAnim.progress += dt * 1000;
        if (s.foodEatAnim.progress >= s.foodEatAnim.duration) s.foodEatAnim = null;
      }
      if (s.resetFadeState) {
        s.resetFadeState.progress += dt * 1000;
        if (s.resetFadeState.progress >= s.resetFadeState.duration) {
          if (s.resetFadeState.phase === "out") {
            s.resetFadeState.phase = "in";
            s.resetFadeState.progress = 0;
            s.resetFadeState.duration = 200;
            if (canvasContainerRef.current) {
              canvasContainerRef.current.classList.remove("fade-out");
              canvasContainerRef.current.classList.add("fade-in");
            }
          } else {
            s.resetFadeState = null;
            if (canvasContainerRef.current) canvasContainerRef.current.classList.remove("fade-out", "fade-in");
          }
        }
      }
    };

    // ---- Game loop ----
    const gameLoop = (timestamp: number) => {
      const s = getState();
      if (s.lastFrameTime === null) {
        s.lastFrameTime = timestamp;
        s.animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      let dt = (timestamp - s.lastFrameTime) / 1000;
      s.lastFrameTime = timestamp;
      if (dt > 0.2) dt = 0.2;

      if (s.resetFadeState) {
        updateParticles(dt);
        render();
        s.animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      if (!s.gameOver && !s.won && s.gameStarted && !s.paused) {
        s.accumulatedTime += dt * 1000;
        if (s.accumulatedTime >= s.moveInterval) {
          performMove();
          s.accumulatedTime -= s.moveInterval;
          s.moveProgress = 0;
          if (s.gameOver) s.moveProgress = 1;
        }
        s.moveProgress = Math.min(1, s.accumulatedTime / s.moveInterval);
      }

      updateParticles(dt);

      if (s.gameOver && s.gameOverFlashCount < 4) {
        const flashElapsed = timestamp - s.gameOverFlashTimer;
        const completed = Math.floor(flashElapsed / 150);
        s.gameOverFlashCount = Math.min(4, completed);
      }

      render();
      if (pauseOverlayRef.current) {
        pauseOverlayRef.current.style.display = (s.paused && !s.gameOver && !s.won) ? "flex" : "none";
      }
      s.animationFrameId = requestAnimationFrame(gameLoop);
    };

    // ---- Reset / start ----
    const resetGameState = () => {
      const s = getState();
      s.snake = createInitialSnake();
      s.direction = { dr: 0, dc: 1 };
      s.nextDirection = { dr: 0, dc: 1 };
      s.score = 0;
      s.level = 1;
      s.moveInterval = INITIAL_MOVE_INTERVAL;
      s.gameOver = false;
      s.paused = false;
      s.won = false;
      s.gameStarted = true;
      s.accumulatedTime = 0;
      s.moveProgress = 0;
      s.prevSnake = s.snake.map((seg) => ({ ...seg }));
      s.particles = [];
      s.floatingTexts = [];
      s.gameOverFlashTimer = 0;
      s.gameOverFlashCount = 0;
      s.gameOverAnimStart = 0;
      s.foodEatAnim = null;
      s.resetFadeState = null;
      s.food = generateFood();
      if (!s.food) s.food = { row: 5, col: 5 };
      updateUI();
      if (pauseOverlayRef.current) pauseOverlayRef.current.style.display = "none";
      if (btnPauseRef.current) btnPauseRef.current.textContent = '⏸ 暂停';
      if (canvasContainerRef.current) {
        canvasContainerRef.current.classList.remove("fade-out");
        canvasContainerRef.current.classList.add("fade-in");
      }
    };

    const restartGame = () => {
      const s = getState();
      if (s.animationFrameId) cancelAnimationFrame(s.animationFrameId);
      s.resetFadeState = { phase: "out", progress: 0, duration: 160 };
      if (canvasContainerRef.current) {
        canvasContainerRef.current.classList.add("fade-out");
        canvasContainerRef.current.classList.remove("fade-in");
      }
      setTimeout(() => {
        resetGameState();
        const s2 = getState();
        s2.accumulatedTime = 0;
        s2.moveProgress = 0;
        s2.prevSnake = s2.snake.map((seg) => ({ ...seg }));
        updateUI();
        if (pauseOverlayRef.current) pauseOverlayRef.current.style.display = "none";
        if (btnPauseRef.current) btnPauseRef.current.textContent = '⏸ 暂停';
        if (canvasContainerRef.current) {
          canvasContainerRef.current.classList.remove("fade-out");
          canvasContainerRef.current.classList.add("fade-in");
        }
        if (s2.resetFadeState && s2.resetFadeState.phase === "out") {
          s2.resetFadeState.phase = "in";
          s2.resetFadeState.progress = 0;
          s2.resetFadeState.duration = 200;
        }
        s2.lastFrameTime = null;
        s2.animationFrameId = requestAnimationFrame(gameLoop);
      }, 160);
    };

    const togglePause = () => {
      const s = getState();
      if (s.gameOver || s.won || !s.gameStarted || s.resetFadeState) return;
      s.paused = !s.paused;
      if (s.paused) {
        s.accumulatedTime = Math.min(s.accumulatedTime, s.moveInterval);
        if (btnPauseRef.current) btnPauseRef.current.textContent = '▶️ 继续';
      } else {
        s.accumulatedTime = 0;
        s.moveProgress = 0;
        s.prevSnake = s.snake.map((seg) => ({ ...seg }));
        if (btnPauseRef.current) btnPauseRef.current.textContent = '⏸ 暂停';
      }
      if (pauseOverlayRef.current) pauseOverlayRef.current.style.display = s.paused ? "flex" : "none";
    };

    // ---- Save/Load ----
    const exportSave = () => {
      const s = getState();
      const saveData = {
        snake: s.snake.map((seg) => ({ row: seg.row, col: seg.col })),
        direction: { dr: s.direction.dr, dc: s.direction.dc },
        nextDirection: { dr: s.nextDirection.dr, dc: s.nextDirection.dc },
        food: s.food ? { row: s.food.row, col: s.food.col } : null,
        score: s.score,
        level: s.level,
        length: s.snake.length,
        gameOver: s.gameOver,
        paused: s.paused,
        won: s.won,
        moveInterval: s.moveInterval,
        gridSize: GRID_SIZE,
        highScore: s.highScore,
        timestamp: new Date().toISOString(),
      };
      const json = JSON.stringify(saveData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `snake_save_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("✅ 存档已导出！");
    };

    const importSave = (file: File): void => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target!.result as string);
          if (!validateSaveData(data)) return;
          const s = getState();
          if (s.animationFrameId) cancelAnimationFrame(s.animationFrameId);
          s.snake = data.snake.map((seg: { row: number; col: number }) => ({ row: seg.row, col: seg.col }));
          s.direction = { dr: data.direction.dr, dc: data.direction.dc };
          s.nextDirection = data.nextDirection ? { dr: data.nextDirection.dr, dc: data.nextDirection.dc } : { ...s.direction };
          s.food = data.food ? { row: data.food.row, col: data.food.col } : null;
          s.score = data.score;
          s.level = data.level;
          s.moveInterval = data.moveInterval || Math.max(MIN_MOVE_INTERVAL, INITIAL_MOVE_INTERVAL - (data.level - 1) * SPEED_STEP);
          s.gameOver = data.gameOver || false;
          s.paused = data.paused || false;
          s.won = data.won || false;
          s.gameStarted = true;
          if (!s.food && !s.gameOver && !s.won) {
            s.food = generateFood();
          }
          s.prevSnake = s.snake.map((seg) => ({ ...seg }));
          s.accumulatedTime = 0;
          s.moveProgress = 0;
          s.particles = [];
          s.floatingTexts = [];
          s.gameOverFlashTimer = 0;
          s.gameOverFlashCount = s.gameOver ? 4 : 0;
          s.gameOverAnimStart = s.gameOver ? performance.now() : 0;
          s.foodEatAnim = null;
          s.resetFadeState = null;

          // 合并最高分
          if (typeof data.highScore === 'number' && data.highScore > s.highScore) {
            s.highScore = data.highScore;
            localStorage.setItem("snake_high_score_v2", String(data.highScore));
          }
          if (s.score > s.highScore) {
            s.highScore = s.score;
            localStorage.setItem("snake_high_score_v2", String(s.highScore));
          }

          updateUI();
          if (pauseOverlayRef.current) pauseOverlayRef.current.style.display = s.paused && !s.gameOver && !s.won ? "flex" : "none";
          if (btnPauseRef.current) btnPauseRef.current.textContent = s.paused ? '▶️ 继续' : '⏸ 暂停';
          if (canvasContainerRef.current) {
            canvasContainerRef.current.classList.remove("fade-out");
            canvasContainerRef.current.classList.add("fade-in");
            setTimeout(() => canvasContainerRef.current?.classList.remove("fade-in"), 300);
          }
          s.lastFrameTime = null;
          s.animationFrameId = requestAnimationFrame(gameLoop);
          showToast("✅ 存档导入成功！");
        } catch (err: any) {
          showToast("❌ 存档解析失败：" + err.message, true);
        }
      };
      reader.onerror = () => showToast("❌ 文件读取失败", true);
      reader.readAsText(file);
    };

    const validateSaveData = (data: any): boolean => {
      const invalid = (msg: string) => { showToast(msg, true); return false; };
      if (!data || typeof data !== "object") return invalid("❌ 无效的存档格式");
      if (!Array.isArray(data.snake) || data.snake.length < 1) return invalid("❌ 蛇身数据无效");
      if (!data.direction || typeof data.direction.dr !== "number") return invalid("❌ 方向数据无效");
      if (data.food && (typeof data.food.row !== "number")) return invalid("❌ 食物数据无效");
      if (typeof data.score !== "number") return invalid("❌ 分数数据无效");
      const gridSize = data.gridSize || GRID_SIZE;
      for (let i = 0; i < data.snake.length; i++) {
        const seg = data.snake[i];
        if (typeof seg.row !== "number" || seg.row < 0 || seg.row >= gridSize) return invalid(`蛇身第${i + 1}段坐标错误`);
      }
      for (let i = 0; i < data.snake.length - 1; i++) {
        const a = data.snake[i], b = data.snake[i + 1];
        if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) !== 1) return invalid("蛇身不连续");
      }
      if (data.food) {
        for (const seg of data.snake) {
          if (seg.row === data.food.row && seg.col === data.food.col) return invalid("食物与蛇身重叠");
        }
      }
      return true;
    };

    let toastTimeout: ReturnType<typeof setTimeout> | undefined;
    const showToast = (message: string, isError = false): void => {
      if (!toastRef.current) return;
      if (toastTimeout) clearTimeout(toastTimeout);
      toastRef.current.textContent = message;
      toastRef.current.className = "toast " + (isError ? "error" : "");
      void toastRef.current.offsetWidth;
      toastRef.current.classList.add("show");
      toastTimeout = setTimeout(() => {
        if (toastRef.current) toastRef.current.classList.remove("show");
        toastTimeout = undefined;
      }, 2200);
    };

    // 保存函数引用供外部使用
    restartGameRef.current = restartGame;
    togglePauseRef.current = togglePause;
    exportSaveRef.current = exportSave;
    importSaveRef.current = importSave;

    // ---- Keyboard handler ----
    const handleKeyDown = (e: KeyboardEvent): void => {
      const key = e.key;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar", "r", "R"].includes(key)) {
        e.preventDefault();
      }
      if (key === "r" || key === "R") {
        restartGame();
        return;
      }
      if (key === " " || key === "Spacebar") {
        togglePause();
        return;
      }
      const s = getState();
      if (s.gameOver || s.won || s.paused || !s.gameStarted || s.resetFadeState) return;
      switch (key) {
        case "ArrowUp": if (s.direction.dr !== 1) s.nextDirection = { dr: -1, dc: 0 }; break;
        case "ArrowDown": if (s.direction.dr !== -1) s.nextDirection = { dr: 1, dc: 0 }; break;
        case "ArrowLeft": if (s.direction.dc !== 1) s.nextDirection = { dr: 0, dc: -1 }; break;
        case "ArrowRight": if (s.direction.dc !== -1) s.nextDirection = { dr: 0, dc: 1 }; break;
      }
    };

    // Initialize game
    const initGame = () => {
      const s = getState();
      s.highScore = parseInt(localStorage.getItem("snake_high_score_v2") || "0", 10);
      resetGameState();
      s.lastFrameTime = null;
      s.animationFrameId = requestAnimationFrame(gameLoop);
    };

    document.addEventListener("keydown", handleKeyDown);
    initGame();

    // 清理函数（不再需要解绑按钮事件）
    return () => {
      const s = getState();
      if (s.animationFrameId) cancelAnimationFrame(s.animationFrameId);
      document.removeEventListener("keydown", handleKeyDown);
      if (toastTimeout) clearTimeout(toastTimeout);
    };
  }, []);

  // ==================== Render ====================
  return (
    <div className="w-[70%] mx-auto py-8 px-4">
      <BackButton />

      <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
        🐍 贪吃蛇
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        经典贪吃蛇游戏，方向键控制方向，R 键重新开始，空格键暂停
      </p>

      <div className="flex flex-nowrap gap-6 items-start justify-center w-full">
        {/* 左侧：游戏画布 */}
        <div className="flex-shrink-0 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 relative overflow-hidden" ref={canvasContainerRef}>
          <canvas ref={canvasRef} width={500} height={500} className="block rounded-lg w-[400px] h-[400px] lg:w-[500px] lg:h-[500px] aspect-square" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]" ref={pauseOverlayRef} style={{ display: "none" }}>
            <span className="text-4xl font-black tracking-widest text-white/75 drop-shadow-[0_0_30px_rgba(200,220,240,0.5)] animate-pulsePause">
              PAUSED
            </span>
          </div>
        </div>

        {/* 右侧：操作面板 */}
        <div className="flex flex-col gap-4 min-w-[190px] max-w-[220px]">
          {/* 统计数据 2x2 */}
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">🍎 得分</div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white" ref={scoreDisplayRef}>0</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">⚡ 等级</div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white" ref={levelDisplayRef}>Lv.1</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">📏 长度</div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white" ref={lengthDisplayRef}>3</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">🏆 最高分</div>
                <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white" ref={highScoreDisplayRef}>0</div>
              </div>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => restartGameRef.current?.()}
              className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
            >
              🔄 新游戏
            </button>
            <button
              onClick={() => togglePauseRef.current?.()}
              ref={btnPauseRef}
              className="w-full px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95"
            >
              ⏸ 暂停
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
                📂 导入
              </button>
            </div>
          </div>
          {/* 操作说明 */}
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 mt-2">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2.5">操作说明</h3>
            <ul>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>← → ↑ ↓</span>
                <span>移动方向</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>空格</span>
                <span>暂停 / 继续</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>R</span>
                <span>重新开始</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>🍎</span>
                <span>吃到食物增加长度和分数</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>💀</span>
                <span>撞墙或撞到自己游戏结束</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className="toast-snake" ref={toastRef}></div>

      <input
        type="file"
        ref={importFileInputRef}
        className="hidden"
        accept=".json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importSaveRef.current?.(file);
          e.target.value = '';
        }}
      />

      <style>{`
        :root {
          --snake-canvas-bg: rgba(255,255,255,0.45);
          --snake-canvas-grid: rgba(0,0,0,0.04);
          --snake-overlay-bg: rgba(255,255,255,0.6);
          --snake-overlay-text: #1e293b;
        }
        .dark {
          --snake-canvas-bg: rgba(30,41,59,0.45);
          --snake-canvas-grid: rgba(255,255,255,0.03);
          --snake-overlay-bg: rgba(30,41,59,0.75);
          --snake-overlay-text: #f1f5f9;
        }

        canvas {
          display: block;
          border-radius: 8px;
        }

        .toast-snake {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.4);
          color: #1e293b;
          padding: 10px 24px;
          border-radius: 30px;
          font-size: 0.9rem;
          font-weight: 600;
          z-index: 100;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s ease, transform 0.35s ease;
          transform: translateX(-50%) translateY(-10px);
          white-space: nowrap;
        }
        .dark .toast-snake {
          background: rgba(30,41,59,0.85);
          border-color: rgba(255,255,255,0.1);
          color: #f1f5f9;
        }
        .toast-snake.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .toast-snake.error {
          border-color: #f87171;
        }

        @keyframes pulsePause {
          0%,100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.06); }
        }

        .level-badge.flash {
          animation: levelFlash 0.5s ease-out;
        }
        @keyframes levelFlash {
          0%,100% { transform: scale(1); }
          30% { transform: scale(1.3); color: #818cf8; }
        }

        .score-bump {
          animation: scoreBump 0.35s ease-out;
        }
        @keyframes scoreBump {
          0%,100% { transform: scale(1); }
          30% { transform: scale(1.2); }
        }

        .highlight-gold {
          animation: goldGlow 0.6s ease-out;
        }
        @keyframes goldGlow {
          0%,100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .fade-out { animation: fadeOut 0.16s ease forwards; }
        .fade-in { animation: fadeIn 0.2s ease forwards; }
        @keyframes fadeOut {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 560px) {
          canvas { max-width: 380px; }
        }
      `}</style>
    </div>
  );
}