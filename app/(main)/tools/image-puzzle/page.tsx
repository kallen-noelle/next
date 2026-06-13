"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import BackButton from "@/app/_components/article/BackButton";

// ==================== 游戏常量 ====================
const BOARD_SIZE = 500;
const SNAP_ANIM_DURATION = 120;
const SHUFFLE_STEP_INTERVAL = 22;
const SHUFFLE_TOTAL_STEPS = 80;
const VICTORY_BOUNCE_DELAY = 28;

// ==================== 工具函数 ====================
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

const BG_IMAGES = [
  "/bg/1.jpg",
  "/bg/2.jpg",
  "/bg/3.jpg",
  "/bg/4.jpg",
  "/bg/5.PNG",
  "/bg/6.png",
  "/bg/7.JPG",
  "/bg/8.JPG",
  "/bg/9.jpg",
  "/bg/10.jpg",
];

// ==================== 主组件 ====================
export default function ImagePuzzlePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const resetGameFnRef = useRef<() => void>(() => {});
  const instantShuffleFnRef = useRef<() => void>(() => {});
  const rafRef = useRef<number>(0);
  const dataURLRef = useRef("");
  const [moves, setMoves] = useState(0);
  const [timeStr, setTimeStr] = useState("00:00");
  const [bestSteps, setBestSteps] = useState<string | number>("--");
  const [bestTime, setBestTime] = useState<string>("--");
  const [difficulty, setDifficulty] = useState(4);
  const [isVictory, setIsVictory] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalSrc, setModalSrc] = useState("");
  const [showShuffleToast, setShowShuffleToast] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(-1);

  // 暗色模式检测
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // 游戏核心逻辑引用
  const game = useRef({
    N: 4,
    blockSize: BOARD_SIZE / 4,
    grid: [] as number[][],
    emptyRow: 3,
    emptyCol: 3,
    moves: 0,
    timerSeconds: 0,
    timerInterval: null as any,
    gameStartTime: 0,
    isGameActive: false,
    victoryAchieved: false,
    inputLocked: false,
    // 动画状态（移动空白块）
    isAnimating: false,
    animProgress: 0,
    animFromRow: -1,   // 空白原始位置
    animFromCol: -1,
    animToRow: -1,     // 空白目标位置
    animToCol: -1,
    animBlockIndex: -1, // 恒为 N*N-1
    animStartTime: 0,
    // 打乱动画（移动空白块）
    shuffleQueue: [] as any[],
    shuffleIndex: 0,
    isShuffleAnimating: false,
    shuffleAnimProgress: 0,
    shuffleAnimFromRow: -1,
    shuffleAnimFromCol: -1,
    shuffleAnimToRow: -1,
    shuffleAnimToCol: -1,
    shuffleStepStartTime: 0,
    // 胜利弹跳
    victoryBounces: [] as any[],
    victoryParticlesSpawned: false,
    // 水波纹
    ripples: [] as any[],
    // 悬停
    hoveredRow: -1,
    hoveredCol: -1,
    // 回调
    onMovesChange: (m: number) => { },
    onTimeChange: (t: string) => { },
    onVictory: () => { },
    onBestChange: (steps: number, time: number) => { },
  });

  // 加载图片到源Canvas
  const initSourceCanvas = useCallback(() => {
    if (!sourceCanvasRef.current) {
      (sourceCanvasRef as any).current = document.createElement("canvas");
    }
    const sc = sourceCanvasRef.current!;
    sc.width = BOARD_SIZE;
    sc.height = BOARD_SIZE;
    return sc;
  }, []);

  const loadImageToSrcCanvas = useCallback((src: string, callback?: () => void) => {
    const sc = initSourceCanvas();
    const ctx = sc.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, BOARD_SIZE, BOARD_SIZE);
      dataURLRef.current = sc.toDataURL("image/png");
      callback?.();
    };
    img.src = src;
  }, []);

  // 初始化源Canvas并加载随机默认图
  useEffect(() => {
    initSourceCanvas();
    const randomIndex = Math.floor(Math.random() * BG_IMAGES.length);
    setCurrentBgIndex(randomIndex);
    loadImageToSrcCanvas(BG_IMAGES[randomIndex]);
  }, [initSourceCanvas, loadImageToSrcCanvas]);

  // 游戏主逻辑
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // 设置高DPI
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = BOARD_SIZE * dpr;
    canvas.height = BOARD_SIZE * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const g = game.current;
    // 绑定回调
    g.onMovesChange = setMoves;
    g.onTimeChange = setTimeStr;
    g.onVictory = () => setIsVictory(true);
    g.onBestChange = (steps, time) => {
      setBestSteps(steps);
      const mins = Math.floor(time / 60);
      const secs = time % 60;
      setBestTime(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    // 网格操作
    const createCompletedGrid = (N: number) => {
      const grid: number[][] = [];
      for (let r = 0; r < N; r++) {
        grid[r] = [];
        for (let c = 0; c < N; c++) {
          grid[r][c] = r * N + c;
        }
      }
      return grid;
    };

    const resetGridToCompleted = () => {
      g.grid = createCompletedGrid(g.N);
      g.emptyRow = g.N - 1;
      g.emptyCol = g.N - 1;
    };

    const isAdjacent = (r1: number, c1: number, r2: number, c2: number) =>
      Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;

    const swapGrid = (r1: number, c1: number, r2: number, c2: number) => {
      const temp = g.grid[r1][c1];
      g.grid[r1][c1] = g.grid[r2][c2];
      g.grid[r2][c2] = temp;
    };

    const checkVictory = () => {
      for (let r = 0; r < g.N; r++) {
        for (let c = 0; c < g.N; c++) {
          if (g.grid[r][c] !== r * g.N + c) return false;
        }
      }
      return true;
    };

    // 生成空白移动序列（用于打乱）
    const generateShuffleSequence = (steps: number) => {
      let er = g.N - 1,
        ec = g.N - 1;
      const seq = [];
      let lastDr = 0,
        lastDc = 0;
      const dirs = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];
      for (let i = 0; i < steps; i++) {
        const neighbors: any[] = [];
        dirs.forEach((d) => {
          const nr = er + d.dr,
            nc = ec + d.dc;
          if (nr >= 0 && nr < g.N && nc >= 0 && nc < g.N) {
            if (!(d.dr === -lastDr && d.dc === -lastDc && neighbors.length > 1)) {
              neighbors.push({ row: nr, col: nc, dr: d.dr, dc: d.dc });
            }
          }
        });
        if (neighbors.length === 0) {
          dirs.forEach((d) => {
            const nr = er + d.dr,
              nc = ec + d.dc;
            if (nr >= 0 && nr < g.N && nc >= 0 && nc < g.N) neighbors.push({ row: nr, col: nc, dr: d.dr, dc: d.dc });
          });
        }
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        // 空白从 (er,ec) 移动到 (chosen.row, chosen.col)
        seq.push({ fromRow: er, fromCol: ec, toRow: chosen.row, toCol: chosen.col });
        er = chosen.row;
        ec = chosen.col;
        lastDr = chosen.dr;
        lastDc = chosen.dc;
      }
      return seq;
    };

    const loadBest = () => {
      const key = `slidingPuzzle_best_${g.N}`;
      const data = localStorage.getItem(key);
      if (data) {
        try {
          return JSON.parse(data);
        } catch { }
      }
      return null;
    };

    const saveBest = (steps: number, time: number) => {
      const key = `slidingPuzzle_best_${g.N}`;
      localStorage.setItem(key, JSON.stringify({ steps, time }));
    };

    const updateBestDisplay = () => {
      const best = loadBest();
      if (best) {
        g.onBestChange(best.steps, best.time);
      } else {
        setBestSteps("--");
        setBestTime("--");
      }
    };

    const checkAndUpdateBest = () => {
      const best = loadBest();
      const currentTime = g.timerSeconds;
      const currentSteps = g.moves;
      if (!best) {
        saveBest(currentSteps, currentTime);
        g.onBestChange(currentSteps, currentTime);
        return true;
      } else if (currentTime < best.time || (currentTime === best.time && currentSteps < best.steps)) {
        saveBest(currentSteps, currentTime);
        g.onBestChange(currentSteps, currentTime);
        return true;
      }
      updateBestDisplay();
      return false;
    };

    const startTimer = () => {
      if (g.timerInterval) clearInterval(g.timerInterval);
      g.timerSeconds = 0;
      g.gameStartTime = Date.now();
      g.onTimeChange("00:00");
      g.timerInterval = setInterval(() => {
        if (g.isGameActive && !g.victoryAchieved) {
          g.timerSeconds = Math.floor((Date.now() - g.gameStartTime) / 1000);
          const mins = Math.floor(g.timerSeconds / 60);
          const secs = g.timerSeconds % 60;
          g.onTimeChange(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
        }
      }, 250);
    };

    const stopTimer = () => {
      if (g.timerInterval) {
        clearInterval(g.timerInterval);
        g.timerInterval = null;
      }
      if (g.gameStartTime) {
        g.timerSeconds = Math.floor((Date.now() - g.gameStartTime) / 1000);
        const mins = Math.floor(g.timerSeconds / 60);
        const secs = g.timerSeconds % 60;
        g.onTimeChange(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      }
    };

    const resetGameState = (instantShuffle = false) => {
      stopTimer();
      g.isGameActive = false;
      g.victoryAchieved = false;
      setIsVictory(false);
      g.inputLocked = true;
      g.isAnimating = false;
      g.isShuffleAnimating = false;
      g.animBlockIndex = -1;
      g.shuffleQueue = [];
      g.shuffleIndex = 0;
      g.victoryBounces = [];
      g.victoryParticlesSpawned = false;
      g.ripples = [];
      g.moves = 0;
      setMoves(0);
      resetGridToCompleted();
      updateBestDisplay();

      if (instantShuffle) {
        const seq = generateShuffleSequence(SHUFFLE_TOTAL_STEPS);
        seq.forEach((step) => {
          swapGrid(step.fromRow, step.fromCol, step.toRow, step.toCol);
          g.emptyRow = step.toRow;
          g.emptyCol = step.toCol;
        });
        g.isGameActive = true;
        g.inputLocked = false;
        startTimer();
      } else {
        g.shuffleQueue = generateShuffleSequence(SHUFFLE_TOTAL_STEPS);
        g.shuffleIndex = 0;
        g.isShuffleAnimating = true;
        g.shuffleAnimFromRow = -1;
        g.shuffleAnimProgress = 0;
        if (g.shuffleQueue.length > 0) {
          const step = g.shuffleQueue[g.shuffleIndex];
          g.shuffleAnimFromRow = step.fromRow;
          g.shuffleAnimFromCol = step.fromCol;
          g.shuffleAnimToRow = step.toRow;
          g.shuffleAnimToCol = step.toCol;
          g.shuffleIndex++;
          g.shuffleStepStartTime = performance.now();
        }
      }
    };

    // 移动空白块：用户点击某个图片块，空白滑向该位置
    const attemptMove = (row: number, col: number) => {
      if (g.inputLocked || g.isAnimating || g.isShuffleAnimating || g.victoryAchieved) return false;
      if (!g.isGameActive) return false;
      if (!isAdjacent(row, col, g.emptyRow, g.emptyCol)) return false;
      if (g.grid[row][col] === g.N * g.N - 1) return false;

      // 空白从当前位置移动到目标位置
      g.animFromRow = g.emptyRow;
      g.animFromCol = g.emptyCol;
      g.animToRow = row;
      g.animToCol = col;
      g.animBlockIndex = g.N * g.N - 1; // 空白块索引
      g.animProgress = 0;
      g.animStartTime = performance.now();
      g.isAnimating = true;
      g.inputLocked = true;
      g.moves++;
      setMoves(g.moves);
      // 水波纹（在目标位置产生效果）
      g.ripples.push({
        x: col * g.blockSize + g.blockSize / 2,
        y: row * g.blockSize + g.blockSize / 2,
        maxRadius: g.blockSize * 1.5,
        progress: 0,
        alpha: 0.5,
      });
      if (g.ripples.length > 5) g.ripples.shift();
      return true;
    };

    const handleDirection = (dr: number, dc: number) => {
      // 方向键：空白向指定方向移动
      const newRow = g.emptyRow + dr;
      const newCol = g.emptyCol + dc;
      if (newRow >= 0 && newRow < g.N && newCol >= 0 && newCol < g.N) {
        if (g.grid[newRow][newCol] !== g.N * g.N - 1) {
          attemptMove(newRow, newCol);
        }
      }
    };

    // 绘制空白块
    const drawEmptyBlock = (x: number, y: number, size: number) => {
      const radius = Math.max(4, size * 0.07);
      const gap = 1.2;
      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.beginPath();
      ctx.roundRect(x + gap, y + gap, size - gap * 2, size - gap * 2, radius);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(x + gap, y + gap, size - gap * 2, size - gap * 2, radius);
      ctx.stroke();
      ctx.setLineDash([]);
      // 光晕
      const glowPhase = (Date.now() / 1200) % 1;
      const glowAlpha = 0.25 + 0.2 * Math.sin(glowPhase * Math.PI * 2);
      const glowGrad = ctx.createRadialGradient(
        x + size / 2,
        y + size / 2,
        size * 0.3,
        x + size / 2,
        y + size / 2,
        size * 0.7,
      );
      glowGrad.addColorStop(0, `rgba(255,255,255,${glowAlpha})`);
      glowGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(x - size * 0.2, y - size * 0.2, size * 1.4, size * 1.4);
    };

    const drawBlock = (row: number, col: number) => {
      const blockIndex = g.grid[row][col];
      const x = col * g.blockSize;
      const y = row * g.blockSize;
      if (blockIndex === g.N * g.N - 1) {
        drawEmptyBlock(x, y, g.blockSize);
        return;
      }
      const srcCol = blockIndex % g.N;
      const srcRow = Math.floor(blockIndex / g.N);
      const radius = Math.max(4, g.blockSize * 0.07);
      const gap = 1.2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x + gap, y + gap, g.blockSize - gap * 2, g.blockSize - gap * 2, radius);
      ctx.clip();
      ctx.drawImage(
        sourceCanvasRef.current!,
        srcCol * g.blockSize,
        srcRow * g.blockSize,
        g.blockSize,
        g.blockSize,
        x,
        y,
        g.blockSize,
        g.blockSize,
      );
      // 半透明遮罩（非悬停时）
      if (!(row === g.hoveredRow && col === g.hoveredCol && isAdjacent(row, col, g.emptyRow, g.emptyCol))) {
        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(x, y, g.blockSize, g.blockSize);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.roundRect(x + gap, y + gap, g.blockSize - gap * 2, g.blockSize - gap * 2, radius);
      ctx.stroke();
    };

    const drawGame = () => {
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      ctx.fillStyle = "#0a0f1a";
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

      // 动画中的空白块偏移
      let animOffsetX = 0,
        animOffsetY = 0;
      if (g.isAnimating) {
        const t = easeOutCubic(Math.min(1, g.animProgress));
        const fromX = g.animFromCol * g.blockSize;
        const fromY = g.animFromRow * g.blockSize;
        const toX = g.animToCol * g.blockSize;
        const toY = g.animToRow * g.blockSize;
        animOffsetX = (toX - fromX) * t;
        animOffsetY = (toY - fromY) * t;
      }

      let sAnimOffsetX = 0,
        sAnimOffsetY = 0;
      if (g.isShuffleAnimating && g.shuffleAnimFromRow >= 0) {
        const st = easeOutCubic(Math.min(1, g.shuffleAnimProgress));
        const sFromX = g.shuffleAnimFromCol * g.blockSize;
        const sFromY = g.shuffleAnimFromRow * g.blockSize;
        const sToX = g.shuffleAnimToCol * g.blockSize;
        const sToY = g.shuffleAnimToRow * g.blockSize;
        sAnimOffsetX = (sToX - sFromX) * st;
        sAnimOffsetY = (sToY - sFromY) * st;
      }

      // 绘制所有静态图片块（胜利弹跳附加）
      for (let r = 0; r < g.N; r++) {
        for (let c = 0; c < g.N; c++) {
          // 如果当前位置是空白且不是动画源/目标，正常绘制空白
          // 动画中的空白块会在后面单独绘制
          if (g.isAnimating && (r === g.animFromRow && c === g.animFromCol)) continue; // 动画中的空白跳过原位置
          if (g.isAnimating && (r === g.animToRow && c === g.animToCol)) {
            // 目标位置先绘制图片块，空白会覆盖上去
            if (g.grid[r][c] !== g.N * g.N - 1) {
              let bounceScale = 1;
              if (g.victoryBounces.length) {
                const vb = g.victoryBounces.find((v: any) => v.row === r && v.col === c);
                if (vb) {
                  const elapsed = performance.now() - vb.startTime;
                  if (elapsed < vb.duration) {
                    const prog = elapsed / vb.duration;
                    bounceScale = 1 + 0.12 * Math.sin(prog * Math.PI) * (1 - prog);
                  }
                }
              }
              drawBlock(r, c);
            }
            continue;
          }
          if (g.isShuffleAnimating && (r === g.shuffleAnimFromRow && c === g.shuffleAnimFromCol)) continue;
          if (g.isShuffleAnimating && (r === g.shuffleAnimToRow && c === g.shuffleAnimToCol)) {
            if (g.grid[r][c] !== g.N * g.N - 1) drawBlock(r, c);
            continue;
          }
          // 正常绘制
          let bounceScale = 1;
          if (g.victoryBounces.length && g.grid[r][c] !== g.N * g.N - 1) {
            const vb = g.victoryBounces.find((v: any) => v.row === r && v.col === c);
            if (vb) {
              const elapsed = performance.now() - vb.startTime;
              if (elapsed < vb.duration) {
                const prog = elapsed / vb.duration;
                bounceScale = 1 + 0.12 * Math.sin(prog * Math.PI) * (1 - prog);
              }
            }
          }
          drawBlock(r, c);
        }
      }

      // 绘制动画中的空白块
      if (g.isAnimating) {
        const blankX = g.animFromCol * g.blockSize + animOffsetX;
        const blankY = g.animFromRow * g.blockSize + animOffsetY;
        drawEmptyBlock(blankX, blankY, g.blockSize);
      }
      if (g.isShuffleAnimating && g.shuffleAnimFromRow >= 0) {
        const blankX = g.shuffleAnimFromCol * g.blockSize + sAnimOffsetX;
        const blankY = g.shuffleAnimFromRow * g.blockSize + sAnimOffsetY;
        drawEmptyBlock(blankX, blankY, g.blockSize);
      }

      // 水波纹
      g.ripples.forEach((rip: any) => {
        rip.progress += 0.03;
        const alpha = rip.alpha * (1 - rip.progress);
        const r = rip.maxRadius * rip.progress;
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 2 * (1 - rip.progress);
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      g.ripples = g.ripples.filter((r: any) => r.progress < 1);

      // 悬停高亮
      if (
        g.hoveredRow >= 0 &&
        g.hoveredCol >= 0 &&
        isAdjacent(g.hoveredRow, g.hoveredCol, g.emptyRow, g.emptyCol) &&
        !g.isAnimating &&
        !g.isShuffleAnimating &&
        g.victoryBounces.length === 0
      ) {
        const hx = g.hoveredCol * g.blockSize;
        const hy = g.hoveredRow * g.blockSize;
        const hGrad = ctx.createRadialGradient(
          hx + g.blockSize / 2,
          hy + g.blockSize / 2,
          g.blockSize * 0.2,
          hx + g.blockSize / 2,
          hy + g.blockSize / 2,
          g.blockSize * 0.9,
        );
        hGrad.addColorStop(0, "rgba(255,255,255,0.15)");
        hGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = hGrad;
        ctx.fillRect(hx, hy, g.blockSize, g.blockSize);
        ctx.shadowColor = "rgba(255,255,255,0.35)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = -3;
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        const hr = Math.max(4, g.blockSize * 0.07);
        ctx.beginPath();
        ctx.roundRect(hx + 1.2, hy + 1.2, g.blockSize - 2.4, g.blockSize - 2.4, hr);
        ctx.stroke();
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
    };

    const animationLoop = (timestamp: number) => {
      if (g.isAnimating) {
        const elapsed = timestamp - g.animStartTime;
        g.animProgress = Math.min(1, elapsed / SNAP_ANIM_DURATION);
        if (g.animProgress >= 1) {
          // 交换网格中空白和目标
          swapGrid(g.animFromRow, g.animFromCol, g.animToRow, g.animToCol);
          g.emptyRow = g.animToRow;
          g.emptyCol = g.animToCol;
          g.isAnimating = false;
          g.animBlockIndex = -1;
          g.inputLocked = false;
          if (g.isGameActive && !g.victoryAchieved && checkVictory()) {
            g.victoryAchieved = true;
            g.isGameActive = false;
            stopTimer();
            const isNewBest = checkAndUpdateBest();
            g.onVictory();
            // 胜利弹跳
            g.victoryBounces = [];
            g.victoryParticlesSpawned = false;
            const now = performance.now();
            let delay = 0;
            for (let r = 0; r < g.N; r++) {
              for (let c = 0; c < g.N; c++) {
                if (g.grid[r][c] !== g.N * g.N - 1) {
                  g.victoryBounces.push({ row: r, col: c, startTime: now + delay, duration: 350 });
                  delay += VICTORY_BOUNCE_DELAY;
                }
              }
            }
            setTimeout(() => (g.victoryParticlesSpawned = true), 200);
            setTimeout(() => {
              if (g.victoryAchieved) g.inputLocked = false;
            }, 2500);
          }
        }
      }

      if (g.isShuffleAnimating && g.shuffleAnimFromRow >= 0) {
        const sElapsed = timestamp - g.shuffleStepStartTime;
        g.shuffleAnimProgress = Math.min(1, sElapsed / (SHUFFLE_STEP_INTERVAL * 0.8));
        if (g.shuffleAnimProgress >= 1) {
          if (g.shuffleAnimFromRow >= 0 && g.shuffleAnimToRow >= 0) {
            swapGrid(g.shuffleAnimFromRow, g.shuffleAnimFromCol, g.shuffleAnimToRow, g.shuffleAnimToCol);
            g.emptyRow = g.shuffleAnimToRow;
            g.emptyCol = g.shuffleAnimToCol;
          }
          g.shuffleAnimFromRow = -1;
          g.shuffleAnimProgress = 0;
          if (g.shuffleIndex < g.shuffleQueue.length) {
            const step = g.shuffleQueue[g.shuffleIndex];
            g.shuffleAnimFromRow = step.fromRow;
            g.shuffleAnimFromCol = step.fromCol;
            g.shuffleAnimToRow = step.toRow;
            g.shuffleAnimToCol = step.toCol;
            g.shuffleIndex++;
            g.shuffleStepStartTime = timestamp;
          } else {
            g.isShuffleAnimating = false;
            g.shuffleQueue = [];
            g.inputLocked = false;
            g.isGameActive = true;
            g.victoryAchieved = false;
            g.victoryBounces = [];
            startTimer();
          }
        }
      }

      drawGame();
      rafRef.current = requestAnimationFrame(animationLoop);
    };

    // 事件处理
    const getCanvasPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = BOARD_SIZE / rect.width;
      const scaleY = BOARD_SIZE / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      const col = Math.floor(x / g.blockSize);
      const row = Math.floor(y / g.blockSize);
      if (row >= 0 && row < g.N && col >= 0 && col < g.N) return { row, col };
      return null;
    };

    const handleClick = (e: MouseEvent) => {
      const pos = getCanvasPos(e.clientX, e.clientY);
      if (pos) attemptMove(pos.row, pos.col);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getCanvasPos(e.clientX, e.clientY);
      if (pos && isAdjacent(pos.row, pos.col, g.emptyRow, g.emptyCol) && !g.isAnimating && !g.isShuffleAnimating && g.victoryBounces.length === 0) {
        g.hoveredRow = pos.row;
        g.hoveredCol = pos.col;
        canvas.style.cursor = "pointer";
      } else {
        g.hoveredRow = -1;
        g.hoveredCol = -1;
        canvas.style.cursor = "default";
      }
    };

    const handleMouseLeave = () => {
      g.hoveredRow = -1;
      g.hoveredCol = -1;
      canvas.style.cursor = "default";
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (g.inputLocked && !g.victoryAchieved) return;
      if (g.isAnimating || g.isShuffleAnimating) return;
      if (!g.isGameActive) return;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          handleDirection(-1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleDirection(1, 0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleDirection(0, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleDirection(0, 1);
          break;
      }
    };

    let touchStart: { x: number; y: number; time: number } | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - touchStart.x;
      const dy = endY - touchStart.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = Date.now() - touchStart.time;
      if (dist < 8 && dt < 300) {
        const pos = getCanvasPos(endX, endY);
        if (pos) attemptMove(pos.row, pos.col);
      } else if (dist > 25 && dt < 500) {
        const startPos = getCanvasPos(touchStart.x, touchStart.y);
        if (startPos && isAdjacent(startPos.row, startPos.col, g.emptyRow, g.emptyCol)) {
          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && startPos.col < g.emptyCol) attemptMove(startPos.row, startPos.col);
            else if (dx < 0 && startPos.col > g.emptyCol) attemptMove(startPos.row, startPos.col);
          } else {
            if (dy > 0 && startPos.row < g.emptyRow) attemptMove(startPos.row, startPos.col);
            else if (dy < 0 && startPos.row > g.emptyRow) attemptMove(startPos.row, startPos.col);
          }
        }
      }
      touchStart = null;
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("keydown", handleKeyDown);

    // 初始化游戏
    g.N = difficulty;
    g.blockSize = BOARD_SIZE / g.N;
    resetGridToCompleted();
    const seq = generateShuffleSequence(SHUFFLE_TOTAL_STEPS);
    seq.forEach((step) => {
      swapGrid(step.fromRow, step.fromCol, step.toRow, step.toCol);
      g.emptyRow = step.toRow;
      g.emptyCol = step.toCol;
    });
    g.isGameActive = true;
    g.inputLocked = false;
    startTimer();
    updateBestDisplay();
    resetGameFnRef.current = () => resetGameState(true);
    instantShuffleFnRef.current = () => resetGameState(true);
    rafRef.current = requestAnimationFrame(animationLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyDown);
      stopTimer();
    };
  }, [difficulty]);

  const handleNewGame = () => {
    resetGameFnRef.current();
  };

  const handleShuffle = () => {
    instantShuffleFnRef.current();
    setShowShuffleToast(true);
    setTimeout(() => setShowShuffleToast(false), 2000);
  };

  const handleSwitchBg = () => {
    const nextIndex = (currentBgIndex + 1) % BG_IMAGES.length;
    setCurrentBgIndex(nextIndex);
    loadImageToSrcCanvas(BG_IMAGES[nextIndex], handleNewGame);
  };

  const handleShowOriginal = () => {
    const sc = sourceCanvasRef.current!;
    const src = dataURLRef.current || sc.toDataURL("image/png");
    setModalSrc(src);
    setShowModal(true);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const sc = sourceCanvasRef.current!;
        const ctx = sc.getContext("2d")!;
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, BOARD_SIZE, BOARD_SIZE);
        dataURLRef.current = sc.toDataURL("image/png");
        handleNewGame(); // 重置游戏
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-[70%] mx-auto py-8 px-4">
      <BackButton />
      <div className="flex flex-col lg:flex-row gap-6 items-start mt-6">
        {/* 游戏板 */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <div
            className={`rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-shadow duration-700 ${isVictory ? "ring-4 ring-emerald-400 dark:ring-emerald-500 shadow-2xl" : ""
              }`}
          >
            <canvas ref={canvasRef} className="w-full max-w-[500px] aspect-square block" />
          </div>
        </div>

        {/* 侧面板 */}
        <div className="flex-1 min-w-[240px] space-y-4">
          {/* 难度选择 */}
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-3">🎯 难度选择</h3>
            <div className="flex gap-2">
              {[3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setDifficulty(n)}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${difficulty === n
                      ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-md"
                      : "bg-white/40 dark:bg-slate-800/40 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60"
                    }`}
                >
                  {n}×{n}
                </button>
              ))}
            </div>
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-3 text-center">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">👣 步数</div>
              <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{moves}</div>
            </div>
            <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-3 text-center">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">⏱ 计时</div>
              <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{timeStr}</div>
            </div>
          </div>

          {/* 最佳成绩 */}
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-2">🏆 最佳成绩</h3>
            <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
              <span>
                最少步数：<strong className="text-slate-900 dark:text-white">{bestSteps}</strong>
              </span>
              <span>
                最快时间：<strong className="text-slate-900 dark:text-white">{bestTime}</strong>
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleNewGame}
              className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
            >
              🔄 新游戏
            </button>
            <button
              onClick={handleShuffle}
              className="flex-1 px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
            >
              🎲 打乱
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShowOriginal}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              🖼 显示原图
            </button>
            <button
              onClick={handleSwitchBg}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              🎨 随机切换
            </button>
            <label className="flex-1 cursor-pointer">
              <div className="w-full px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors text-center">
                📷 上传图片
              </div>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 胜利弹窗 */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${isVictory ? "translate-y-0 opacity-100" : "-translate-y-32 opacity-0 pointer-events-none"
          }`}
      >
        <div className="px-6 py-3 rounded-full bg-emerald-500 dark:bg-emerald-400 text-white font-bold shadow-lg flex items-center gap-2">
          <span className="text-xl">🎉</span> 完美！拼图完成！
        </div>
      </div>

      {/* 打乱提示 */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${showShuffleToast ? "translate-y-0 opacity-100" : "-translate-y-32 opacity-0 pointer-events-none"
          }`}
      >
        <div className="px-6 py-3 rounded-full bg-indigo-500 text-white font-bold shadow-lg flex items-center gap-2">
          <span>🎲</span> 已重新打乱！
        </div>
      </div>

      {/* 原图预览弹窗 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 max-w-[90vw] max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">📷 完整原图</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-red-500 transition-colors text-xl"
              >
                ✕
              </button>
            </div>
            <img src={modalSrc} alt="原图预览" className="max-w-full max-h-[70vh] rounded-xl shadow-md" />
          </div>
        </div>
      )}
    </div>
  );
}