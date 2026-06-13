"use client";

import { useEffect, useRef, useState } from "react";
import BackButton from "@/app/_components/article/BackButton";

export default function MinesweeperPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // ==================== 背景粒子生成 ====================
    const bgContainer = document.getElementById("bgParticles");
    if (bgContainer) {
      for (let i = 0; i < 35; i++) {
        const particle = document.createElement("div");
        particle.className = "bg-particle";
        const size = Math.random() * 3 + 1.5;
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.left = Math.random() * 100 + "%";
        particle.style.animationDuration = Math.random() * 10 + 8 + "s";
        particle.style.animationDelay = Math.random() * 9 + "s";
        particle.style.background = [
          "#00E5FF",
          "#7B61FF",
          "#FF0055",
          "#4CD964",
          "#FFD700",
        ][Math.floor(Math.random() * 5)];
        bgContainer.appendChild(particle);
      }
    }

    // ==================== 简易音效 ====================
    let audioCtx: AudioContext | null = null;
    const getAudioCtx = () => {
      if (!audioCtx) {
        try {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          audioCtx = null;
        }
      }
      return audioCtx;
    };
    const playBeep = (freq: number, duration: number, type = "sine", vol = 0.06) => {
      const ctx = getAudioCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type as OscillatorType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch (e) { /* 静默 */ }
    };
    const sfxClick = () => { playBeep(600, 0.08, "sine", 0.04); playBeep(900, 0.05, "sine", 0.03); };
    const sfxFlag = () => { playBeep(400, 0.1, "triangle", 0.05); playBeep(700, 0.06, "triangle", 0.03); };
    const sfxReveal = () => { playBeep(200, 0.15, "sine", 0.04); };
    const sfxExplosion = () => { playBeep(60, 0.35, "sawtooth", 0.1); playBeep(30, 0.5, "square", 0.06); };
    const sfxWin = () => {
      playBeep(523, 0.1, "sine", 0.05);
      setTimeout(() => playBeep(659, 0.1, "sine", 0.05), 100);
      setTimeout(() => playBeep(784, 0.15, "sine", 0.06), 200);
    };

    // ==================== Toast ====================
    const toastEl = document.getElementById("toast")!;
    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    const showToast = (msg: string, isError = false) => {
      if (toastTimer) clearTimeout(toastTimer);
      toastEl.textContent = msg;
      toastEl.className = "toast-mine" + (isError ? " error" : "");
      requestAnimationFrame(() => {
        toastEl.classList.add("show");
      });
      toastTimer = setTimeout(() => {
        toastEl.classList.remove("show");
        toastTimer = null;
      }, 2200);
    };

    // ==================== 游戏核心类 ====================
    class MinesweeperGame {
      rows: number;
      cols: number;
      totalMines: number;
      difficulty: string;
      mineMap: boolean[][];
      revealed: boolean[][];
      flagged: boolean[][];
      gameOver: boolean;
      gameWon: boolean;
      timerStarted: boolean;
      elapsedSeconds: number;
      firstClickDone: boolean;
      minesPlaced: boolean;
      timerInterval: ReturnType<typeof setInterval> | null;

      constructor() {
        this.rows = 9;
        this.cols = 9;
        this.totalMines = 10;
        this.difficulty = "beginner";
        this.mineMap = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.timerStarted = false;
        this.elapsedSeconds = 0;
        this.firstClickDone = false;
        this.minesPlaced = false;
        this.timerInterval = null;
        this.initMatrices();
      }

      initMatrices() {
        this.mineMap = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.flagged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
      }

      resetState() {
        this.gameOver = false;
        this.gameWon = false;
        this.timerStarted = false;
        this.elapsedSeconds = 0;
        this.firstClickDone = false;
        this.minesPlaced = false;
        this.stopTimer();
        this.initMatrices();
      }

      setDifficulty(rows: number, cols: number, mines: number, difficultyName: string) {
        this.rows = rows;
        this.cols = cols;
        this.totalMines = mines;
        this.difficulty = difficultyName;
        this.resetState();
      }

      placeMines(excludeRow: number, excludeCol: number) {
        const excluded = new Set<number>();
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = excludeRow + dr;
            const nc = excludeCol + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              excluded.add(nr * this.cols + nc);
            }
          }
        }
        const maxMines = Math.min(this.totalMines, this.rows * this.cols - excluded.size);
        if (maxMines <= 0) {
          this.minesPlaced = true;
          this.totalMines = 0;
          return;
        }
        const available: { r: number; c: number }[] = [];
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            if (!excluded.has(r * this.cols + c)) {
              available.push({ r, c });
            }
          }
        }
        for (let i = available.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [available[i], available[j]] = [available[j], available[i]];
        }
        const toPlace = Math.min(maxMines, available.length);
        for (let i = 0; i < toPlace; i++) {
          this.mineMap[available[i].r][available[i].c] = true;
        }
        this.totalMines = toPlace;
        this.minesPlaced = true;
      }

      countAdjacentMines(row: number, col: number): number {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.mineMap[nr][nc]) {
              count++;
            }
          }
        }
        return count;
      }

      getAdjacentCells(row: number, col: number): { r: number; c: number }[] {
        const cells: { r: number; c: number }[] = [];
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              cells.push({ r: nr, c: nc });
            }
          }
        }
        return cells;
      }

      getAllMinePositions(): { r: number; c: number }[] {
        const positions: { r: number; c: number }[] = [];
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            if (this.mineMap[r][c]) positions.push({ r, c });
          }
        }
        return positions;
      }

      revealCell(row: number, col: number): any {
        if (this.gameOver) return null;
        if (this.revealed[row][col]) return null;
        if (this.flagged[row][col]) return null;

        if (!this.firstClickDone) {
          this.firstClickDone = true;
          if (!this.minesPlaced) {
            this.placeMines(row, col);
          } else if (this.mineMap[row][col]) {
            this.mineMap[row][col] = false;
            let placed = false;
            for (let r = 0; r < this.rows && !placed; r++) {
              for (let c = 0; c < this.cols && !placed; c++) {
                if (!this.mineMap[r][c] && !(r === row && c === col) && !this.revealed[r][c]) {
                  this.mineMap[r][c] = true;
                  placed = true;
                }
              }
            }
          }
          this.startTimer();
        }

        if (this.mineMap[row][col]) {
          this.revealed[row][col] = true;
          this.gameOver = true;
          this.gameWon = false;
          this.stopTimer();
          return { type: "mine", row, col };
        }

        const revealedList: { r: number; c: number; depth: number; adjMines: number }[] = [];
        const queue: { r: number; c: number; depth: number }[] = [{ r: row, c: col, depth: 0 }];
        const visited = new Set<number>();
        visited.add(row * this.cols + col);

        while (queue.length > 0) {
          const { r, c, depth } = queue.shift()!;
          if (this.revealed[r][c]) continue;
          if (this.flagged[r][c]) continue;
          this.revealed[r][c] = true;
          const adjMines = this.countAdjacentMines(r, c);
          revealedList.push({ r, c, depth, adjMines });

          if (adjMines === 0) {
            const neighbors = this.getAdjacentCells(r, c);
            for (const n of neighbors) {
              const key = n.r * this.cols + n.c;
              if (!visited.has(key) && !this.revealed[n.r][n.c] && !this.flagged[n.r][n.c]) {
                visited.add(key);
                queue.push({ r: n.r, c: n.c, depth: depth + 1 });
              }
            }
          }
        }

        if (!this.gameOver) this.checkWin();
        return { type: "reveal", cells: revealedList, gameOver: this.gameOver, gameWon: this.gameWon };
      }

      toggleFlag(row: number, col: number): any {
        if (this.gameOver) return null;
        if (this.revealed[row][col]) return null;
        this.flagged[row][col] = !this.flagged[row][col];
        return { type: "flag", row, col, flagged: this.flagged[row][col] };
      }

      getRemainingMines(): number {
        const flaggedCount = this.flagged.flat().filter(Boolean).length;
        return Math.max(0, this.totalMines - flaggedCount);
      }

      checkWin(): boolean {
        const totalCells = this.rows * this.cols;
        const revealedCount = this.revealed.flat().filter(Boolean).length;
        if (revealedCount === totalCells - this.totalMines) {
          this.gameOver = true;
          this.gameWon = true;
          this.stopTimer();
          return true;
        }
        return false;
      }

      doubleClickReveal(row: number, col: number): any {
        if (this.gameOver) return null;
        if (!this.revealed[row][col]) return null;
        const adjMines = this.countAdjacentMines(row, col);
        if (adjMines === 0) return null;
        const neighbors = this.getAdjacentCells(row, col);
        const flaggedAround = neighbors.filter((n) => this.flagged[n.r][n.c]).length;
        if (flaggedAround !== adjMines) return null;

        const revealedList: any[] = [];
        let hitMine = false;
        let mineCell: { r: number; c: number } | null = null;

        for (const n of neighbors) {
          if (!this.revealed[n.r][n.c] && !this.flagged[n.r][n.c]) {
            if (this.mineMap[n.r][n.c]) {
              hitMine = true;
              mineCell = { r: n.r, c: n.c };
              this.revealed[n.r][n.c] = true;
            } else {
              const result = this.revealCell(n.r, n.c);
              if (result && result.type === "reveal") {
                revealedList.push(...result.cells);
              }
            }
          }
        }

        if (hitMine) {
          this.gameOver = true;
          this.gameWon = false;
          this.stopTimer();
          return { type: "double_mine", mineCell, revealedList };
        }

        if (!this.gameOver) this.checkWin();
        return { type: "double_reveal", revealedList, gameOver: this.gameOver, gameWon: this.gameWon };
      }

      startTimer() {
        if (this.timerStarted) return;
        this.timerStarted = true;
        this.elapsedSeconds = 0;
        this.timerInterval = setInterval(() => {
          if (!this.gameOver) this.elapsedSeconds++;
        }, 1000);
      }

      stopTimer() {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      }

      getState() {
        return {
          rows: this.rows,
          cols: this.cols,
          totalMines: this.totalMines,
          difficulty: this.difficulty,
          mineMap: this.mineMap.map((r) => [...r]),
          revealed: this.revealed.map((r) => [...r]),
          flagged: this.flagged.map((r) => [...r]),
          gameOver: this.gameOver,
          gameWon: this.gameWon,
          timerStarted: this.timerStarted,
          elapsedSeconds: this.elapsedSeconds,
          firstClickDone: this.firstClickDone,
          minesPlaced: this.minesPlaced,
        };
      }

      loadState(state: any) {
        this.rows = state.rows;
        this.cols = state.cols;
        this.totalMines = state.totalMines;
        this.difficulty = state.difficulty;
        this.mineMap = state.mineMap.map((r: boolean[]) => [...r]);
        this.revealed = state.revealed.map((r: boolean[]) => [...r]);
        this.flagged = state.flagged.map((r: boolean[]) => [...r]);
        this.gameOver = state.gameOver;
        this.gameWon = state.gameWon;
        this.timerStarted = state.timerStarted;
        this.elapsedSeconds = state.elapsedSeconds;
        this.firstClickDone = state.firstClickDone;
        this.minesPlaced = state.minesPlaced;
        const actualMines = this.mineMap.flat().filter(Boolean).length;
        this.totalMines = actualMines;
        this.stopTimer();
        if (this.timerStarted && !this.gameOver) {
          this.timerInterval = setInterval(() => {
            if (!this.gameOver) this.elapsedSeconds++;
          }, 1000);
        }
      }
    }

    // ==================== 动画管理器 ====================
    class AnimationManager {
      ripples: any[] = [];
      revealAnims: any[] = [];
      explosions: any[] = [];
      flagAnims: any[] = [];
      bombRevealAnims: any[] = [];
      confetti: any[] = [];
      flashCells: any[] = [];
      isRunning = false;
      animFrameId: number | null = null;

      addRipple(x: number, y: number) {
        this.ripples.push({ x, y, startTime: performance.now(), maxRadius: 30 });
        this.ensureRunning();
      }
      addRevealAnim(row: number, col: number, adjMines: number, delay = 0) {
        this.revealAnims.push({ row, col, startTime: performance.now() + delay, adjMines });
        this.ensureRunning();
      }
      addExplosion(row: number, col: number) {
        this.explosions.push({ row, col, startTime: performance.now(), maxRadius: 45 });
        this.ensureRunning();
      }
      addFlagAnim(row: number, col: number, type: "place" | "remove") {
        this.flagAnims.push({ row, col, startTime: performance.now(), type });
        this.ensureRunning();
      }
      addBombRevealAnim(row: number, col: number) {
        this.bombRevealAnims.push({ row, col, startTime: performance.now() });
        this.ensureRunning();
      }
      addConfetti(count = 80) {
        const colors = [
          "#818cf8", "#34d399", "#f87171", "#f59e0b", "#a78bfa",
          "#38bdf8", "#6366f1", "#fbbf24", "#e879f9", "#14b8a6",
        ];
        const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        const rect = canvas ? canvas.getBoundingClientRect() : { width: 500, height: 400 };
        for (let i = 0; i < count; i++) {
          this.confetti.push({
            x: Math.random() * rect.width,
            y: -20 - Math.random() * 80,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2 + 1.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.2,
            size: Math.random() * 6 + 3,
            life: 0,
            maxLife: Math.random() * 2.5 + 2,
          });
        }
        this.ensureRunning();
      }
      addFlashCell(row: number, col: number, color: string) {
        this.flashCells.push({ row, col, startTime: performance.now(), color });
        this.ensureRunning();
      }

      ensureRunning() {
        if (!this.isRunning) {
          this.isRunning = true;
          this.runLoop();
        }
      }

      runLoop() {
        if (!this.isRunning) return;
        this.animFrameId = requestAnimationFrame(() => this.runLoop());
        const now = performance.now();
        this.ripples = this.ripples.filter((r) => now - r.startTime < 350);
        this.revealAnims = this.revealAnims.filter((a) => now - a.startTime < 400);
        this.explosions = this.explosions.filter((e) => now - e.startTime < 600);
        this.flagAnims = this.flagAnims.filter((f) => now - f.startTime < 350);
        this.bombRevealAnims = this.bombRevealAnims.filter((b) => now - b.startTime < 500);
        this.confetti = this.confetti.filter((c) => c.life < c.maxLife);
        this.flashCells = this.flashCells.filter((f) => now - f.startTime < 500);

        const hasAny =
          this.ripples.length > 0 ||
          this.revealAnims.length > 0 ||
          this.explosions.length > 0 ||
          this.flagAnims.length > 0 ||
          this.bombRevealAnims.length > 0 ||
          this.confetti.length > 0 ||
          this.flashCells.length > 0;

        if (!hasAny) {
          setTimeout(() => {
            const stillEmpty =
              this.ripples.length === 0 &&
              this.revealAnims.length === 0 &&
              this.explosions.length === 0 &&
              this.flagAnims.length === 0 &&
              this.bombRevealAnims.length === 0 &&
              this.confetti.length === 0 &&
              this.flashCells.length === 0;
            if (stillEmpty) this.stop();
          }, 60);
        }
      }

      stop() {
        this.isRunning = false;
        if (this.animFrameId) {
          cancelAnimationFrame(this.animFrameId);
          this.animFrameId = null;
        }
        this.ripples = [];
        this.revealAnims = [];
        this.explosions = [];
        this.flagAnims = [];
        this.bombRevealAnims = [];
        this.confetti = [];
        this.flashCells = [];
      }

      updateConfetti() {
        const dt = 0.016;
        for (const c of this.confetti) {
          c.x += c.vx;
          c.y += c.vy;
          c.vy += 0.02;
          c.rotation += c.rotSpeed;
          c.life += dt;
        }
      }
    }

    // ==================== 渲染器 ====================
    class Renderer {
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      game: MinesweeperGame;
      animManager: AnimationManager;
      cellSize = 35;
      hoveredCell: { row: number; col: number } | null = null;
      pixelRatio: number;

      constructor(canvas: HTMLCanvasElement, game: MinesweeperGame, animManager: AnimationManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.game = game;
        this.animManager = animManager;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      }

      updateCanvasSize() {
        const w = this.game.cols * this.cellSize;
        const h = this.game.rows * this.cellSize;
        this.canvas.width = w * this.pixelRatio;
        this.canvas.height = h * this.pixelRatio;
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
      }

      cellX(col: number) { return col * this.cellSize; }
      cellY(row: number) { return row * this.cellSize; }

      getCellFromPoint(mx: number, my: number) {
        const col = Math.floor(mx / this.cellSize);
        const row = Math.floor(my / this.cellSize);
        if (row >= 0 && row < this.game.rows && col >= 0 && col < this.game.cols) {
          return { row, col };
        }
        return null;
      }

      drawRoundRect(x: number, y: number, w: number, h: number, r: number) {
        const ctx = this.ctx;
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
      }

      draw() {
        const ctx = this.ctx;
        const cs = this.cellSize;
        const now = performance.now();

        ctx.clearRect(0, 0, this.canvas.width / this.pixelRatio, this.canvas.height / this.pixelRatio);
        this.animManager.updateConfetti();

        for (let r = 0; r < this.game.rows; r++) {
          for (let c = 0; c < this.game.cols; c++) {
            const x = this.cellX(c);
            const y = this.cellY(r);
            const isRevealed = this.game.revealed[r][c];
            const isFlagged = this.game.flagged[r][c];
            const isHovered = this.hoveredCell?.row === r && this.hoveredCell?.col === c;
            const isMine = this.game.mineMap[r][c];

            if (isRevealed) {
              const bgGrad = ctx.createLinearGradient(x, y, x, y + cs);
              bgGrad.addColorStop(0, "rgba(255,255,255,0.12)");
              bgGrad.addColorStop(1, "rgba(255,255,255,0.05)");
              this.drawRoundRect(x + 1, y + 1, cs - 2, cs - 2, 7);
              ctx.fillStyle = bgGrad;
              ctx.fill();
              ctx.strokeStyle = "rgba(255,255,255,0.08)";
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(x + 2, y + cs - 1);
              ctx.lineTo(x + 2, y + 2);
              ctx.lineTo(x + cs - 2, y + 2);
              ctx.strokeStyle = "rgba(0,0,0,0.08)";
              ctx.lineWidth = 1.5;
              ctx.stroke();

              if (isMine) {
                const bombAnim = this.animManager.bombRevealAnims.find(a => a.row === r && a.col === c);
                let bombScale = 1;
                if (bombAnim) {
                  const elapsed = now - bombAnim.startTime;
                  const progress = Math.min(1, elapsed / 400);
                  bombScale = 0.5 + 0.5 * (1 - Math.pow(1 - progress, 3));
                }
                ctx.save();
                ctx.translate(x + cs / 2, y + cs / 2);
                ctx.scale(bombScale, bombScale);
                ctx.font = `${cs * 0.68}px serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("💣", 0, 0);
                ctx.restore();
              } else {
                const adjMines = this.game.countAdjacentMines(r, c);
                if (adjMines > 0) {
                  const colors = [
                    null, "#818cf8", "#34d399", "#f87171", "#a78bfa",
                    "#f59e0b", "#38bdf8", "#94a3b8", "#64748b",
                  ];
                  ctx.fillStyle = colors[adjMines] || "#fff";
                  ctx.font = `bold ${cs * 0.55}px 'Inter', system-ui, sans-serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  const revealAnim = this.animManager.revealAnims.find((a) => a.row === r && a.col === c);
                  let scale = 1;
                  let glowAlpha = 0;
                  if (revealAnim) {
                    const elapsed = now - revealAnim.startTime;
                    const progress = Math.max(0, Math.min(1, elapsed / 300));
                    scale = 0.3 + 0.7 * (1 - Math.pow(1 - progress, 3));
                    glowAlpha = (1 - progress) * 0.7;
                  }
                  ctx.save();
                  ctx.translate(x + cs / 2, y + cs / 2);
                  ctx.scale(scale, scale);
                  if (glowAlpha > 0) {
                    ctx.shadowColor = colors[adjMines] || "#fff";
                    ctx.shadowBlur = 14 * glowAlpha;
                  }
                  ctx.fillText(adjMines.toString(), 0, 0);
                  ctx.restore();
                }
              }
            } else {
              const hoverScale = isHovered && !this.game.gameOver ? 1.03 : 1;
              const baseX = x + cs / 2;
              const baseY = y + cs / 2;
              const hw = (cs - 3) / 2;
              const hh = (cs - 3) / 2;
              ctx.save();
              ctx.translate(baseX, baseY);
              ctx.scale(hoverScale, hoverScale);
              ctx.translate(-hw - 1.5, -hh - 1.5);

              const rx = 1.5, ry = 1.5, rw = cs - 3, rh = cs - 3, rr = 7;
              const bodyGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
              bodyGrad.addColorStop(0, "rgba(255,255,255,0.28)");
              bodyGrad.addColorStop(0.5, "rgba(255,255,255,0.18)");
              bodyGrad.addColorStop(1, "rgba(255,255,255,0.1)");
              this.drawRoundRect(rx, ry, rw, rh, rr);
              ctx.fillStyle = bodyGrad;
              ctx.fill();

              ctx.beginPath();
              ctx.moveTo(rx + rr, ry);
              ctx.lineTo(rx + rw - rr, ry);
              ctx.arcTo(rx + rw, ry, rx + rw, ry + rr, rr);
              ctx.lineTo(rx + rw, ry + rh - rr);
              ctx.strokeStyle = "rgba(255,255,255,0.35)";
              ctx.lineWidth = 1.5;
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(rx + rw - rr, ry + rh);
              ctx.lineTo(rx + rr, ry + rh);
              ctx.arcTo(rx, ry + rh, rx, ry + rh - rr, rr);
              ctx.lineTo(rx, ry + rr);
              ctx.strokeStyle = "rgba(0,0,0,0.1)";
              ctx.lineWidth = 1.5;
              ctx.stroke();

              ctx.shadowColor = "rgba(0,0,0,0.08)";
              ctx.shadowBlur = 2;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
              this.drawRoundRect(rx, ry, rw, rh, rr);
              ctx.strokeStyle = "rgba(0,0,0,0.05)";
              ctx.lineWidth = 0.5;
              ctx.stroke();
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              ctx.restore();

              if (isFlagged) {
                const flagAnim = this.animManager.flagAnims.find((a) => a.row === r && a.col === c);
                let flagScale = 1;
                let flagRot = 0;
                if (flagAnim) {
                  const elapsed = now - flagAnim.startTime;
                  const progress = Math.max(0, Math.min(1, elapsed / 300));
                  if (flagAnim.type === "place") {
                    flagScale = Math.min(1, progress * 2.5);
                    if (flagScale > 1) flagScale = 1 + (flagScale - 1) * 0.3 * Math.sin(progress * Math.PI);
                    flagRot = (1 - progress) * 0.6;
                  } else {
                    flagScale = Math.max(0, 1 - progress * 2);
                    flagRot = progress * 0.8;
                  }
                }
                ctx.save();
                ctx.translate(x + cs / 2, y + cs / 2);
                ctx.scale(flagScale, flagScale);
                ctx.rotate(flagRot);
                ctx.font = `${cs * 0.62}px serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("🚩", 0, 0);
                ctx.restore();
              }
            }
          }
        }

        if (this.game.gameOver && !this.game.gameWon) {
          for (let r = 0; r < this.game.rows; r++) {
            for (let c = 0; c < this.game.cols; c++) {
              if (this.game.flagged[r][c] && !this.game.mineMap[r][c]) {
                const x = this.cellX(c);
                const y = this.cellY(r);
                ctx.font = `${cs * 0.55}px serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("❌", x + cs / 2, y + cs / 2);
              }
            }
          }
        }

        // 爆炸动画
        for (const exp of this.animManager.explosions) {
          const elapsed = now - exp.startTime;
          const progress = Math.max(0, Math.min(1, elapsed / 500));
          const radius = exp.maxRadius * progress;
          const alpha = 1 - progress;
          const x = this.cellX(exp.col) + cs / 2;
          const y = this.cellY(exp.row) + cs / 2;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
          grad.addColorStop(0, `rgba(129,140,248,${alpha})`);
          grad.addColorStop(0.4, `rgba(99,102,241,${alpha * 0.7})`);
          grad.addColorStop(0.7, `rgba(79,70,229,${alpha * 0.3})`);
          grad.addColorStop(1, `rgba(79,70,229,0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }

        // 涟漪
        for (const ripple of this.animManager.ripples) {
          const elapsed = now - ripple.startTime;
          const progress = Math.max(0, Math.min(1, elapsed / 280));
          const radius = ripple.maxRadius * progress;
          const alpha = 0.5 * (1 - progress);
          const grad = ctx.createRadialGradient(ripple.x, ripple.y, 0, ripple.x, ripple.y, radius);
          grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
          grad.addColorStop(0.5, `rgba(200,220,255,${alpha * 0.5})`);
          grad.addColorStop(1, `rgba(200,220,255,0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(ripple.x - radius, ripple.y - radius, radius * 2, radius * 2);
        }

        // 闪光格子
        for (const flash of this.animManager.flashCells) {
          const elapsed = now - flash.startTime;
          const progress = Math.max(0, Math.min(1, elapsed / 400));
          const alpha = (1 - progress) * 0.5;
          const x = this.cellX(flash.col);
          const y = this.cellY(flash.row);
          this.drawRoundRect(x, y, cs, cs, 7);
          if (flash.color.startsWith("#")) {
            const hex = flash.color;
            const rr = parseInt(hex.slice(1, 3), 16);
            const gg = parseInt(hex.slice(3, 5), 16);
            const bb = parseInt(hex.slice(5, 7), 16);
            ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha})`;
          } else {
            ctx.fillStyle = flash.color.replace(")", `,${alpha})`).replace("rgb", "rgba");
          }
          ctx.fill();
        }

        // 彩带
        for (const conf of this.animManager.confetti) {
          ctx.save();
          ctx.translate(conf.x, conf.y);
          ctx.rotate(conf.rotation);
          ctx.fillStyle = conf.color;
          ctx.globalAlpha = Math.max(0, 1 - conf.life / conf.maxLife);
          ctx.fillRect(-conf.size / 2, -conf.size / 4, conf.size, conf.size / 2);
          ctx.restore();
        }
        ctx.globalAlpha = 1;

        // 悬停高亮
        if (this.hoveredCell && !this.game.gameOver) {
          const { row, col } = this.hoveredCell;
          if (!this.game.revealed[row][col]) {
            const x = this.cellX(col);
            const y = this.cellY(row);
            this.drawRoundRect(x + 1, y + 1, cs - 2, cs - 2, 7);
            ctx.fillStyle = "rgba(255,255,255,0.06)";
            ctx.fill();
          }
        }
      }

      renderLoop() {
        this.draw();
        updateUI();
        if (this.animManager.isRunning) {
          requestAnimationFrame(() => this.renderLoop());
        }
      }

      startRenderLoop() {
        if (!this.animManager.isRunning && this.animManager.confetti.length === 0) {
          this.draw();
          updateUI();
          return;
        }
        this.renderLoop();
      }
    }

    // ==================== DOM 元素获取 ====================
    const canvas = canvasRef.current!;
    const canvasWrapper = wrapperRef.current!;
    const mineCountEl = document.getElementById("mineCount")!;
    const timerDisplayEl = document.getElementById("timerDisplay")!;
    const highscoreDisplayEl = document.getElementById("highscoreDisplay")!;
    const customRow = document.getElementById("customRow")!;
    const fileInput = fileInputRef.current!;
    const modalContainer = document.getElementById("modalContainer")!;

    const game = new MinesweeperGame();
    const animManager = new AnimationManager();
    const renderer = new Renderer(canvas, game, animManager);

    let prevMineCount = 10;
    let prevElapsed = 0;

    // ---------- 高分管理（按 rows, cols, mines）----------
    const HIGHSCORE_STORAGE_KEY = "minesweeper_highscores";

    const getAllHighScores = (): Record<string, number> => {
      try {
        const raw = localStorage.getItem(HIGHSCORE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch { return {}; }
    };

    const saveAllHighScores = (data: Record<string, number>) => {
      localStorage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(data));
    };

    const makeHighScoreKey = (rows: number, cols: number, mines: number) => `${rows}x${cols}_${mines}`;

    const getHighScore = (rows: number, cols: number, mines: number): number | null => {
      const all = getAllHighScores();
      const val = all[makeHighScoreKey(rows, cols, mines)];
      return val !== undefined ? val : null;
    };

    const setHighScore = (rows: number, cols: number, mines: number, seconds: number): boolean => {
      const all = getAllHighScores();
      const key = makeHighScoreKey(rows, cols, mines);
      const current = all[key];
      if (current === undefined || seconds < current) {
        all[key] = seconds;
        saveAllHighScores(all);
        return true;
      }
      return false;
    };

    const mergeHighScores = (imported: Record<string, number>) => {
      const all = getAllHighScores();
      for (const [key, seconds] of Object.entries(imported)) {
        if (typeof seconds === "number" && (all[key] === undefined || seconds < all[key])) {
          all[key] = seconds;
        }
      }
      saveAllHighScores(all);
    };

    const updateHighScoreDisplay = () => {
      const hs = getHighScore(game.rows, game.cols, game.totalMines);
      highscoreDisplayEl.textContent = hs !== null ? hs.toString() : "--";
      highscoreDisplayEl.classList.toggle("highscore-value", hs !== null);
    };

    const updateUI = () => {
      const remaining = game.getRemainingMines();
      if (remaining !== prevMineCount) {
        mineCountEl.textContent = remaining.toString();
        mineCountEl.classList.remove("rolling");
        void mineCountEl.offsetWidth;
        mineCountEl.classList.add("rolling");
        prevMineCount = remaining;
      }
      if (game.elapsedSeconds !== prevElapsed) {
        timerDisplayEl.textContent = game.elapsedSeconds.toString();
        timerDisplayEl.classList.remove("rolling");
        void timerDisplayEl.offsetWidth;
        timerDisplayEl.classList.add("rolling");
        prevElapsed = game.elapsedSeconds;
      }
    };
    const fullUpdateUI = () => {
      prevMineCount = game.getRemainingMines();
      prevElapsed = game.elapsedSeconds;
      mineCountEl.textContent = prevMineCount.toString();
      timerDisplayEl.textContent = prevElapsed.toString();
      updateHighScoreDisplay();
    };

    let uiAnimFrameId: number | null = null;
    const uiLoop = () => {
      updateUI();
      uiAnimFrameId = requestAnimationFrame(uiLoop);
    };
    uiLoop();

    // 难度配置
    const difficultyConfigs: Record<string, { rows: number; cols: number; mines: number }> = {
      beginner: { rows: 9, cols: 9, mines: 10 },
      intermediate: { rows: 16, cols: 16, mines: 40 },
      expert: { rows: 16, cols: 30, mines: 99 },
    };

    const setActiveDifficultyButton = (difficulty: string) => {
      document.querySelectorAll("#difficultyPanel button[data-difficulty]").forEach((b) => {
        b.classList.remove("active-difficulty");
      });
      const activeBtn = document.querySelector(`#difficultyPanel button[data-difficulty="${difficulty}"]`);
      if (activeBtn) activeBtn.classList.add("active-difficulty");
      if (difficulty === "custom") {
        document.getElementById("btnCustom")!.classList.add("active-difficulty");
      }
    };

    const switchDifficulty = (difficulty: string, rows: number, cols: number, mines: number) => {
      animManager.stop();
      game.setDifficulty(rows, cols, mines, difficulty);
      renderer.updateCanvasSize();
      renderer.draw();
      fullUpdateUI();
      setActiveDifficultyButton(difficulty);
      prevMineCount = game.getRemainingMines();
      prevElapsed = 0;
      mineCountEl.textContent = prevMineCount.toString();
      timerDisplayEl.textContent = "0";
      if (difficulty !== "custom") {
        customRow.style.display = "none";
      }
      canvasWrapper.scrollTop = 0;
      canvasWrapper.scrollLeft = 0;
    };

    document.querySelectorAll("#difficultyPanel button[data-difficulty]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const diff = (btn as HTMLElement).dataset.difficulty!;
        if (diff === "custom") {
          customRow.style.display = customRow.style.display === "none" ? "flex" : "none";
          if (customRow.style.display === "flex") {
            setActiveDifficultyButton("custom");
          } else {
            setActiveDifficultyButton(game.difficulty);
          }
          return;
        }
        customRow.style.display = "none";
        const config = difficultyConfigs[diff];
        if (config) switchDifficulty(diff, config.rows, config.cols, config.mines);
      });
    });

    document.getElementById("btnApplyCustom")!.addEventListener("click", () => {
      const rowsInput = document.getElementById("customRows") as HTMLInputElement;
      const colsInput = document.getElementById("customCols") as HTMLInputElement;
      const minesInput = document.getElementById("customMines") as HTMLInputElement;
      const rows = Math.max(1, Math.min(24, parseInt(rowsInput.value) || 9));
      const cols = Math.max(1, Math.min(30, parseInt(colsInput.value) || 9));
      const maxMines = Math.floor(rows * cols * 0.8);
      const mines = Math.max(0, Math.min(maxMines, parseInt(minesInput.value) || 10));
      rowsInput.value = rows.toString();
      colsInput.value = cols.toString();
      minesInput.value = mines.toString();
      if (parseInt(minesInput.value) > maxMines) {
        showToast(`雷数不能超过格子的80%（最多${maxMines}颗）`, true);
      }
      switchDifficulty("custom", rows, cols, mines);
      customRow.style.display = "none";
      setActiveDifficultyButton("custom");
    });

    document.getElementById("btnNewGame")!.addEventListener("click", () => {
      animManager.stop();
      game.resetState();
      game.initMatrices();
      game.minesPlaced = false;
      renderer.updateCanvasSize();
      renderer.draw();
      fullUpdateUI();
      prevMineCount = game.getRemainingMines();
      prevElapsed = 0;
      mineCountEl.textContent = prevMineCount.toString();
      timerDisplayEl.textContent = "0";
      canvasWrapper.scrollTop = 0;
      canvasWrapper.scrollLeft = 0;
      setActiveDifficultyButton(game.difficulty);
      modalContainer.innerHTML = "";
      sfxClick();
    });

    // 游戏结束动画与弹窗
    const animateLosingMines = () => {
      const mines = game.getAllMinePositions().filter(m => !game.revealed[m.r][m.c]);
      let delay = 80;
      mines.forEach((mine, index) => {
        setTimeout(() => {
          game.revealed[mine.r][mine.c] = true;
          animManager.addExplosion(mine.r, mine.c);
          renderer.draw();
        }, delay + index * 120);
      });
      const totalTime = delay + mines.length * 120 + 500;
      setTimeout(() => {
        showGameOverModal(false);
      }, totalTime);
    };

    const animateWinningMines = () => {
      const mines = game.getAllMinePositions();
      mines.forEach((mine, index) => {
        setTimeout(() => {
          if (!game.revealed[mine.r][mine.c]) {
            game.revealed[mine.r][mine.c] = true;
          }
          animManager.addBombRevealAnim(mine.r, mine.c);
          renderer.draw();
        }, 150 + index * 100);
      });
      const totalTime = 150 + mines.length * 100 + 400;
      setTimeout(() => {
        const isNew = setHighScore(game.rows, game.cols, game.totalMines, game.elapsedSeconds);
        updateHighScoreDisplay();
        showGameOverModal(true, isNew);
      }, totalTime);
    };

    const showGameOverModal = (won: boolean, isNewRecord = false) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      const dialog = document.createElement("div");
      dialog.className = "modal-dialog " + (won ? "win" : "lose");
      const titleClass = won ? "win-title" : "lose-title";
      const title = won ? "🎉 胜 利！" : "💥 游戏结束";
      const subtitle = won
        ? `用时 <span class="modal-highlight">${game.elapsedSeconds}</span> 秒` +
        (isNewRecord ? ' <span class="modal-highlight">🏆 新纪录！</span>' : "")
        : "踩到地雷了，再试一次吧！";
      dialog.innerHTML = `
        <div class="modal-title ${titleClass}">${title}</div>
        <div class="modal-subtitle">${subtitle}</div>
        <button class="modal-close-btn">🔄 再来一局</button>
      `;
      overlay.appendChild(dialog);
      modalContainer.innerHTML = "";
      modalContainer.appendChild(overlay);

      const closeBtn = dialog.querySelector(".modal-close-btn")!;
      closeBtn.addEventListener("click", () => {
        modalContainer.innerHTML = "";
        document.getElementById("btnNewGame")!.click();
      });
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          modalContainer.innerHTML = "";
          document.getElementById("btnNewGame")!.click();
        }
      });
    };

    // Canvas 事件
    const getCanvasPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    canvas.addEventListener("click", (e) => {
      if (game.gameOver) return;
      const pos = getCanvasPos(e);
      const cell = renderer.getCellFromPoint(pos.x, pos.y);
      if (!cell) return;
      animManager.addRipple(pos.x, pos.y);
      const result = game.revealCell(cell.row, cell.col);
      if (!result) return;
      if (result.type === "mine") {
        sfxExplosion();
        animManager.addExplosion(cell.row, cell.col);
        canvasWrapper.classList.add("shaking");
        setTimeout(() => canvasWrapper.classList.remove("shaking"), 400);
        renderer.draw();
        renderer.startRenderLoop();
        updateUI();
        animateLosingMines();
      } else if (result.type === "reveal") {
        sfxReveal();
        const maxDepth = Math.max(...result.cells.map((c: any) => c.depth), 0);
        for (const c of result.cells) {
          const delay = maxDepth > 0 ? (c.depth / maxDepth) * 250 : 0;
          animManager.addRevealAnim(c.r, c.c, c.adjMines, delay);
        }
        renderer.draw();
        renderer.startRenderLoop();
        updateUI();
        if (result.gameWon) {
          sfxWin();
          for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
              if (!game.mineMap[r][c] && game.revealed[r][c]) {
                animManager.addFlashCell(r, c, "rgb(76,217,100)");
              }
            }
          }
          animManager.addConfetti(100);
          renderer.draw();
          renderer.startRenderLoop();
          animateWinningMines();
        }
      }
    });

    canvas.addEventListener("dblclick", (e) => {
      if (game.gameOver) return;
      const pos = getCanvasPos(e);
      const cell = renderer.getCellFromPoint(pos.x, pos.y);
      if (!cell) return;
      if (!game.revealed[cell.row][cell.col]) return;
      if (game.countAdjacentMines(cell.row, cell.col) === 0) return;
      const result = game.doubleClickReveal(cell.row, cell.col);
      if (!result) return;
      if (result.type === "double_mine") {
        sfxExplosion();
        animManager.addExplosion(result.mineCell.r, result.mineCell.c);
        canvasWrapper.classList.add("shaking");
        setTimeout(() => canvasWrapper.classList.remove("shaking"), 400);
        for (const c of result.revealedList || []) {
          animManager.addRevealAnim(c.r, c.c, c.adjMines, Math.random() * 100);
        }
        renderer.draw();
        renderer.startRenderLoop();
        updateUI();
        animateLosingMines();
      } else if (result.type === "double_reveal") {
        sfxReveal();
        const cells = result.revealedList || [];
        const maxDepth = Math.max(...cells.map((c: any) => c.depth || 0), 0);
        for (const c of cells) {
          const delay = maxDepth > 0 ? ((c.depth || 0) / maxDepth) * 200 : Math.random() * 80;
          animManager.addRevealAnim(c.r, c.c, c.adjMines, delay);
        }
        renderer.draw();
        renderer.startRenderLoop();
        updateUI();
        if (result.gameWon) {
          sfxWin();
          for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
              if (!game.mineMap[r][c] && game.revealed[r][c]) {
                animManager.addFlashCell(r, c, "rgb(76,217,100)");
              }
            }
          }
          animManager.addConfetti(100);
          renderer.draw();
          renderer.startRenderLoop();
          animateWinningMines();
        }
      }
    });

    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (game.gameOver) return;
      const pos = getCanvasPos(e);
      const cell = renderer.getCellFromPoint(pos.x, pos.y);
      if (!cell) return;
      const result = game.toggleFlag(cell.row, cell.col);
      if (result) {
        sfxFlag();
        animManager.addFlagAnim(cell.row, cell.col, result.flagged ? "place" : "remove");
        renderer.draw();
        renderer.startRenderLoop();
        updateUI();
      }
    });

    canvas.addEventListener("mousemove", (e) => {
      const pos = getCanvasPos(e);
      const cell = renderer.getCellFromPoint(pos.x, pos.y);
      const prev = renderer.hoveredCell;
      if (cell && (!prev || prev.row !== cell.row || prev.col !== cell.col)) {
        renderer.hoveredCell = cell;
        renderer.draw();
        if (animManager.isRunning) renderer.startRenderLoop();
      } else if (!cell && prev) {
        renderer.hoveredCell = null;
        renderer.draw();
        if (animManager.isRunning) renderer.startRenderLoop();
      }
    });

    canvas.addEventListener("mouseleave", () => {
      if (renderer.hoveredCell) {
        renderer.hoveredCell = null;
        renderer.draw();
        if (animManager.isRunning) renderer.startRenderLoop();
      }
    });

    // 触摸支持
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const pos = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        const cell = renderer.getCellFromPoint(pos.x, pos.y);
        if (cell && !game.gameOver) {
          const result = game.toggleFlag(cell.row, cell.col);
          if (result) {
            sfxFlag();
            animManager.addFlagAnim(cell.row, cell.col, result.flagged ? "place" : "remove");
            renderer.draw();
            renderer.startRenderLoop();
            updateUI();
          }
        }
      }
    }, { passive: false });

    // 存档导出（含高分）
    document.getElementById("btnExport")!.addEventListener("click", () => {
      const state = game.getState();
      const highscores = getAllHighScores();
      const exportData = { ...state, highscores };
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `minesweeper_save_${timestamp}.json`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("✅ 存档已导出（含高分记录）");
    });

    document.getElementById("btnImport")!.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const state = JSON.parse(ev.target?.result as string);
          const requiredKeys = [
            "rows", "cols", "totalMines", "mineMap", "revealed", "flagged",
            "gameOver", "gameWon", "timerStarted", "elapsedSeconds",
            "firstClickDone", "minesPlaced", "difficulty",
          ];
          const missing = requiredKeys.filter((k) => !(k in state));
          if (missing.length > 0) throw new Error("存档缺少字段：" + missing.join(", "));
          if (state.rows < 1 || state.rows > 24 || state.cols < 1 || state.cols > 30)
            throw new Error("网格尺寸超出范围");

          animManager.stop();
          game.loadState(state);
          renderer.updateCanvasSize();
          renderer.draw();
          fullUpdateUI();
          setActiveDifficultyButton(state.difficulty);
          if (state.difficulty === "custom") {
            (document.getElementById("customRows") as HTMLInputElement).value = state.rows;
            (document.getElementById("customCols") as HTMLInputElement).value = state.cols;
            (document.getElementById("customMines") as HTMLInputElement).value = state.totalMines;
          }
          customRow.style.display = "none";
          prevMineCount = game.getRemainingMines();
          prevElapsed = game.elapsedSeconds;
          mineCountEl.textContent = prevMineCount.toString();
          timerDisplayEl.textContent = prevElapsed.toString();
          canvasWrapper.scrollTop = 0;
          canvasWrapper.scrollLeft = 0;
          modalContainer.innerHTML = "";

          if (state.highscores && typeof state.highscores === "object") {
            mergeHighScores(state.highscores);
            updateHighScoreDisplay();
            showToast("✅ 存档已恢复（含高分记录）");
          } else {
            showToast("✅ 存档已恢复");
          }

          if (state.gameOver) {
            setTimeout(() => {
              if (state.gameWon) {
                for (let r = 0; r < game.rows; r++) {
                  for (let c = 0; c < game.cols; c++) {
                    if (!game.mineMap[r][c] && game.revealed[r][c]) {
                      animManager.addFlashCell(r, c, "rgb(76,217,100)");
                    }
                  }
                }
                renderer.draw();
                renderer.startRenderLoop();
                showGameOverModal(true, false);
              } else {
                for (let r = 0; r < game.rows; r++) {
                  for (let c = 0; c < game.cols; c++) {
                    if (game.mineMap[r][c] && game.revealed[r][c]) {
                      animManager.addExplosion(r, c);
                    }
                  }
                }
                renderer.draw();
                renderer.startRenderLoop();
                showGameOverModal(false);
              }
            }, 300);
          }
        } catch (err: any) {
          showToast("❌ 导入失败：" + err.message, true);
        }
      };
      reader.readAsText(file);
      fileInput.value = "";
    });

    // 窗口调整
    const handleResize = () => {
      renderer.updateCanvasSize();
      renderer.draw();
      if (animManager.isRunning) renderer.startRenderLoop();
    };
    window.addEventListener("resize", debounce(handleResize, 200));

    function debounce(fn: Function, delay: number) {
      let timer: ReturnType<typeof setTimeout>;
      return (...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    }

    // 键盘快捷键
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "n" && e.ctrlKey) {
        e.preventDefault();
        document.getElementById("btnNewGame")!.click();
      }
    };
    window.addEventListener("keydown", keyHandler);

    // 初始化渲染
    renderer.updateCanvasSize();
    renderer.draw();
    fullUpdateUI();
    setActiveDifficultyButton("beginner");
    prevMineCount = game.getRemainingMines();
    prevElapsed = 0;
    mineCountEl.textContent = prevMineCount.toString();
    timerDisplayEl.textContent = "0";
    updateHighScoreDisplay();

    return () => {
      if (uiAnimFrameId) cancelAnimationFrame(uiAnimFrameId);
      game.stopTimer();
      animManager.stop();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 flex flex-col items-center">
      <BackButton />

      <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
        💣 扫 雷
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        经典扫雷游戏，左键翻开格子，右键标记地雷
      </p>

      {/* 操作指南 */}
      <div className="mb-4 w-full">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          {showGuide ? "🔽 隐藏操作指南" : "📖 操作指南"}
        </button>
        {showGuide && (
          <div className="mt-2 rounded-xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border border-white/30 dark:border-white/10 p-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p>🖱️ <strong>鼠标操作</strong></p>
            <ul className="list-disc ml-5 space-y-0.5">
              <li><strong>左键</strong>：翻开格子</li>
              <li><strong>右键</strong>：标记/取消旗帜（🚩）</li>
              <li><strong>双击已翻开数字</strong>：若周围旗帜数等于数字，快速翻开其余格子</li>
            </ul>
            <p className="mt-2">📱 <strong>触摸操作</strong></p>
            <ul className="list-disc ml-5 space-y-0.5">
              <li><strong>双指同时点击</strong>：标记/取消旗帜</li>
            </ul>
            <p className="mt-2">⌨️ <strong>键盘快捷键</strong></p>
            <ul className="list-disc ml-5 space-y-0.5">
              <li><strong>Ctrl + N</strong>：新游戏</li>
            </ul>
            <p className="mt-2">💾 <strong>存档</strong></p>
            <ul className="list-disc ml-5 space-y-0.5">
              <li>点击“导出存档”可保存当前游戏和高分记录</li>
              <li>点击“导入存档”可恢复游戏并合并最佳成绩</li>
            </ul>
          </div>
        )}
      </div>

      {/* 难度选择 */}
      <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-3 mb-4 w-full" id="difficultyPanel">
        <div className="flex flex-wrap gap-2 items-center justify-center">
          <div className="flex gap-1.5 flex-wrap justify-center">
            <button className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active-difficulty" data-difficulty="beginner">初级 9×9</button>
            <button className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all" data-difficulty="intermediate">中级 16×16</button>
            <button className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all" data-difficulty="expert">高级 16×30</button>
            <button className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all" data-difficulty="custom" id="btnCustom">⚙ 自定义</button>
          </div>
          <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95" id="btnNewGame">🔄 新游戏</button>
        </div>
      </div>

      {/* 自定义难度 */}
      <div className="flex gap-2 items-center justify-center flex-wrap mb-4" id="customRow" style={{ display: "none" }}>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">行</span>
        <input type="number" className="w-14 px-2 py-1.5 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200 text-center outline-none" id="customRows" defaultValue={9} min={1} max={24} />
        <span className="text-[10px] text-slate-400 dark:text-slate-500">(1-24)</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">列</span>
        <input type="number" className="w-14 px-2 py-1.5 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200 text-center outline-none" id="customCols" defaultValue={9} min={1} max={30} />
        <span className="text-[10px] text-slate-400 dark:text-slate-500">(1-30)</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">雷</span>
        <input type="number" className="w-14 px-2 py-1.5 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200 text-center outline-none" id="customMines" defaultValue={10} min={0} max={99} />
        <span className="text-[10px] text-slate-400 dark:text-slate-500">(≤80%)</span>
        <button className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all" id="btnApplyCustom">✅ 生成</button>
      </div>

      {/* 信息栏 */}
      <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-3 mb-4 w-full">
        <div className="flex gap-4 items-center justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm">🚩</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">剩余</span>
            <span className="text-lg font-black text-slate-900 dark:text-white mine-count" id="mineCount">10</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">⏱</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">时间</span>
            <span className="text-lg font-black text-slate-900 dark:text-white timer-display" id="timerDisplay">0</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">秒</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">🏆</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">最佳</span>
            <span className="text-lg font-black text-amber-500 highscore-value" id="highscoreDisplay">--</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">秒</span>
          </div>
        </div>
      </div>

      {/* 游戏画布 */}
      <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 mb-4 overflow-auto max-h-[70vh] w-full flex justify-center canvas-wrapper" id="canvasWrapper" ref={wrapperRef}>
        <canvas id="gameCanvas" ref={canvasRef} className="block"></canvas>
      </div>

      {/* 底部按钮 */}
      <div className="flex gap-2 justify-center">
        <button className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95" id="btnExport">📥 导出存档</button>
        <button className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95" id="btnImport">📤 导入存档</button>
      </div>
      <input type="file" id="importFileInput" ref={fileInputRef} style={{ display: "none" }} accept=".json" />

      {/* Toast */}
      <div className="toast-mine" id="toast"></div>

      {/* 弹窗容器 */}
      <div id="modalContainer"></div>

      <style>{`
        :root {
          --toast-bg: rgba(255,255,255,0.85);
          --toast-color: #1e293b;
          --toast-border: rgba(255,255,255,0.4);
        }
        .dark {
          --toast-bg: rgba(30,41,59,0.85);
          --toast-color: #f1f5f9;
          --toast-border: rgba(255,255,255,0.1);
        }

        canvas { cursor: pointer; border-radius: 8px; }

        .toast-mine {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(-120px);
          background: var(--toast-bg);
          backdrop-filter: blur(8px);
          border: 1px solid var(--toast-border);
          color: var(--toast-color);
          padding: 10px 22px;
          border-radius: 30px;
          font-size: 0.9rem;
          font-weight: 600;
          z-index: 1000;
          pointer-events: none;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          white-space: nowrap;
        }
        .toast-mine.show { transform: translateX(-50%) translateY(0); }
        .toast-mine.error { border-color: #f87171; }

        .canvas-wrapper.shaking {
          animation: screenShake 0.35s ease-out;
        }
        @keyframes screenShake {
          0%, 100% { transform: translateX(0); }
          10%, 50% { transform: translateX(3px); }
          20%, 60% { transform: translateX(-3px); }
          30%, 70% { transform: translateX(2px); }
          40%, 80% { transform: translateX(-2px); }
        }

        .active-difficulty {
          background: rgba(129, 140, 248, 0.25) !important;
          border-color: #818cf8 !important;
          color: #4338ca !important;
          box-shadow: 0 0 16px rgba(129, 140, 248, 0.3) !important;
        }
        .dark .active-difficulty {
          color: #e0e7ff !important;
        }

        .mine-count, .timer-display {
          transition: all 0.15s ease;
        }
        .mine-count.rolling, .timer-display.rolling {
          animation: numberRoll 0.3s ease;
        }
        @keyframes numberRoll {
          0% { transform: translateY(-60%); opacity: 0; }
          60% { transform: translateY(8%); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(6px);
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-dialog {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px);
          border: 2px solid rgba(255,255,255,0.4);
          border-radius: 20px;
          padding: 28px 30px;
          text-align: center;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: #1e293b;
        }
        .dark .modal-dialog {
          background: rgba(30,41,59,0.85);
          border-color: rgba(255,255,255,0.1);
          color: #f1f5f9;
        }
        @keyframes popIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .modal-dialog.win { border-color: rgba(52, 211, 153, 0.5); }
        .modal-dialog.lose { border-color: rgba(248, 113, 113, 0.5); }
        .modal-title { font-size: 2rem; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 10px; }
        .modal-title.win-title { color: #34d399; }
        .modal-title.lose-title { color: #f87171; }
        .modal-subtitle { font-size: 0.95rem; color: #94a3b8; margin-bottom: 16px; }
        .dark .modal-subtitle { color: #64748b; }
        .modal-highlight { color: #f59e0b; font-weight: 700; }
        .modal-close-btn {
          margin-top: 8px;
          padding: 10px 28px;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: 25px;
          border: 1px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
          color: #1e293b;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .dark .modal-close-btn {
          color: #f1f5f9;
          background: rgba(255,255,255,0.06);
        }
        .modal-close-btn:hover {
          background: rgba(129,140,248,0.15);
          border-color: #818cf8;
        }

        @media (max-width: 700px) {
          .canvas-wrapper { max-height: 50vh; }
        }
      `}</style>
    </div>
  );
}