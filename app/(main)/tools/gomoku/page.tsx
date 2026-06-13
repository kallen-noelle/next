"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import BackButton from "@/app/_components/article/BackButton";

// ============ 游戏常量 ============
const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const CELL_SIZE = 40;
const PADDING = 38;
const CANVAS_SIZE = PADDING * 2 + CELL_SIZE * (BOARD_SIZE - 1);
const DPR = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);

// 评估分数
const SCORE_FIVE = 1e8;
const SCORE_OPEN_FOUR = 1e6;
const SCORE_RUSH_FOUR = 1e5;
const SCORE_OPEN_THREE = 1e4;
const SCORE_SLEEP_THREE = 1e3;
const SCORE_OPEN_TWO = 1e2;
const SCORE_SLEEP_TWO = 1e1;
const DEFENSE_COEFF = 1.2;

// 方向
const DIRECTIONS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

// 星位
const STAR_POINTS: [number, number][] = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11],
];

// ---------- 类型 ----------
interface Move {
  row: number;
  col: number;
  player: number;
}
interface WinLine {
  cells: { row: number; col: number }[];
}
interface PieceAnimation {
  type: "place" | "remove";
  progress: number;
  duration: number;
  startTime: number;
  onComplete?: () => void;
}
interface VictoryAnimation {
  active: boolean;
  startTime: number;
  flashStartTime: number;
  flashCells: { row: number; col: number }[];
  flashPhase: number;
  sweepProgress: number;
  totalDuration: number;
}
type GameMode = "pve" | "pvp" | "evs";

// 缓动
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  return 1 + c1 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInQuad = (t: number) => t * t;

// ============ 音效 ============
let audioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { /* no audio */ }
  }
  return audioCtx;
};
const playBeep = (freq: number, dur: number, vol = 0.08, type: OscillatorType = "sine") => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
};
const sfxPlace = () => playBeep(800, 0.05);
const sfxWin = () => {
  playBeep(523, 0.1);
  setTimeout(() => playBeep(659, 0.1), 100);
  setTimeout(() => playBeep(784, 0.15), 200);
};

// ============ 主组件 ============
export default function GomokuPage() {
  // ---- Refs ----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const boardRef = useRef<number[][]>(
    Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY))
  );
  const moveHistoryRef = useRef<Move[]>([]);
  const currentPlayerRef = useRef<number>(BLACK);
  const gameOverRef = useRef<boolean>(false);
  const winnerRef = useRef<number | null>(null);
  const winLineRef = useRef<WinLine | null>(null);
  const isAiThinkingRef = useRef<boolean>(false);
  const animatingRef = useRef<boolean>(false);
  const pieceAnimationsRef = useRef<Record<string, PieceAnimation>>({});
  const victoryAnimDataRef = useRef<VictoryAnimation | null>(null);
  const hoverPosRef = useRef<{ row: number; col: number } | null>(null);
  const animationQueueRef = useRef<Array<() => void>>([]);
  const boardEntranceProgressRef = useRef<number>(0);
  const boardEntranceDoneRef = useRef<boolean>(false);
  const starPointOpacityRef = useRef<number>(0);
  // AI 改进
  const zobristTableRef = useRef<[Record<number, number>, Record<number, number>]>([{}, {}]);
  const transpositionTableRef = useRef<Map<number, { depth: number; score: number; type: string }> | null>(null);
  const aiSearchStartTimeRef = useRef<number>(0);
  const aiTimedOutRef = useRef<boolean>(false);
  const aiBestMoveRef = useRef<Move | null>(null);
  // 新增优化
  const historyTableRef = useRef<number[][]>(
    Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0))
  );
  const positionWeightRef = useRef<number[][]>([]);
  const aiTimeLimitRef = useRef<number>(600);
  const showHintRef = useRef<boolean>(false);
  const hintMoveRef = useRef<{ row: number; col: number } | null>(null);

  // ---- State ----
  const [statusText, setStatusText] = useState("你的回合");
  const [statusIcon, setStatusIcon] = useState("⚫");
  const [statusAnimClass, setStatusAnimClass] = useState("player-turn");
  const [isBoardDimmed, setIsBoardDimmed] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState<GameMode>("pve");
  const [difficultyTime, setDifficultyTime] = useState(600);

  // ---- 深色模式 ----
  useEffect(() => {
    const checkDark = () => setDarkMode(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const mqHandler = (e: MediaQueryListEvent) => {
      if (!document.documentElement.classList.contains("dark")) setDarkMode(e.matches);
    };
    mq.addEventListener("change", mqHandler);
    return () => { observer.disconnect(); mq.removeEventListener("change", mqHandler); };
  }, []);

  // ---- 初始化 Zobrist（确定性种子） ----
  const initZobrist = () => {
    let seed = 123456789;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return seed >>> 0;
    };
    const tbl: [Record<number, number>, Record<number, number>] = [{}, {}];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * BOARD_SIZE + c;
        tbl[0][idx] = random();
        tbl[1][idx] = random();
      }
    }
    zobristTableRef.current = tbl;
  };

  const computeZobristHash = (board: number[][]) => {
    let hash = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = board[r][c];
        if (cell !== EMPTY) {
          hash ^= zobristTableRef.current[cell === BLACK ? 0 : 1][r * BOARD_SIZE + c];
        }
      }
    }
    return hash >>> 0;
  };

  // ---- 位置权重 ----
  const initPositionWeight = () => {
    const center = (BOARD_SIZE - 1) / 2;
    const w = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        w[r][c] = Math.max(0, 10 - Math.sqrt((r - center) ** 2 + (c - center) ** 2) * 0.7);
      }
    }
    positionWeightRef.current = w;
  };

  // ---- 重置 ----
  const resetGame = (keepEntrance = false) => {
    boardRef.current = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
    moveHistoryRef.current = [];
    currentPlayerRef.current = BLACK;
    gameOverRef.current = false;
    winnerRef.current = null;
    winLineRef.current = null;
    isAiThinkingRef.current = false;
    animatingRef.current = false;
    pieceAnimationsRef.current = {};
    victoryAnimDataRef.current = null;
    hoverPosRef.current = null;
    animationQueueRef.current = [];
    historyTableRef.current = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    transpositionTableRef.current = null;
    aiTimedOutRef.current = false;
    aiBestMoveRef.current = null;
    if (!keepEntrance) {
      boardEntranceProgressRef.current = 0;
      boardEntranceDoneRef.current = false;
      starPointOpacityRef.current = 0;
    }
    updateStatusDisplay();
    setIsBoardDimmed(false);
    setShowOverlay(false);
  };

  // ---- 状态更新 ----
  const updateStatusDisplay = () => {
    let text = "";
    let icon = "";
    let animClass = "";
    if (gameOverRef.current) {
      if (winnerRef.current === BLACK) {
        text = mode === "pvp" ? "⚫ 黑方胜！" : "🎉 你赢了！";
        icon = "🏆";
        animClass = "victory";
      } else if (winnerRef.current === WHITE) {
        text = mode === "pvp" ? "⚪ 白方胜！" : "😔 AI 胜了";
        icon = "💻";
        animClass = "defeat";
      } else {
        text = "🤝 平局";
        icon = "🤝";
        animClass = "draw-text";
      }
    } else if (isAiThinkingRef.current) {
      text = "AI 思考中...";
      icon = "🤖";
      animClass = "ai-thinking";
    } else if (currentPlayerRef.current === BLACK) {
      text = mode === "pve" ? "你的回合" : "⚫ 黑方回合";
      icon = "⚫";
      animClass = "player-turn";
    } else {
      text = mode === "pve" ? "AI 思考中..." : "⚪ 白方回合";
      icon = "⚪";
      animClass = "ai-thinking";
    }
    setStatusText(text);
    setStatusIcon(icon);
    setStatusAnimClass(animClass);
  };

  // ---- 胜利检查 ----
  const checkWinAt = (row: number, col: number, player: number): WinLine | null => {
    const board = boardRef.current;
    for (const [dr, dc] of DIRECTIONS) {
      const cells: [number, number][] = [[row, col]];
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) cells.push([r, c]);
        else break;
      }
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) cells.unshift([r, c]);
        else break;
      }
      if (cells.length >= 5) {
        cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        for (let i = 0; i <= cells.length - 5; i++) {
          const slice = cells.slice(i, i + 5);
          if (slice.some(c => c[0] === row && c[1] === col)) {
            return { cells: slice.map(c => ({ row: c[0], col: c[1] })) };
          }
        }
      }
    }
    return null;
  };

  const isBoardFull = () => {
    const board = boardRef.current;
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (board[r][c] === EMPTY) return false;
    return true;
  };

  // ---- 落子/悔棋/动画 ----
  const placePiece = (row: number, col: number, player: number) => {
    boardRef.current[row][col] = player;
    moveHistoryRef.current.push({ row, col, player });
  };

  const undoLastMove = (): Move | null => {
    const history = moveHistoryRef.current;
    if (history.length === 0) return null;
    const move = history.pop()!;
    boardRef.current[move.row][move.col] = EMPTY;
    return move;
  };

  const animatePiecePlace = (row: number, col: number, onComplete?: () => void) => {
    pieceAnimationsRef.current[`${row},${col}`] = {
      type: "place", progress: 0, duration: 150, startTime: performance.now(), onComplete,
    };
  };

  const animatePieceRemove = (row: number, col: number, onComplete?: () => void) => {
    pieceAnimationsRef.current[`${row},${col}`] = {
      type: "remove", progress: 0, duration: 200, startTime: performance.now(), onComplete,
    };
  };

  const animateVictory = (winCells: { row: number; col: number }[]) => {
    const now = performance.now();
    victoryAnimDataRef.current = {
      active: true, startTime: now, flashStartTime: now,
      flashCells: winCells, flashPhase: -1, sweepProgress: 0,
      totalDuration: winCells.length * 100 + 200 + 700 + 300,
    };
  };

  const isAnimating = () =>
    Object.keys(pieceAnimationsRef.current).length > 0 ||
    (victoryAnimDataRef.current?.active && victoryAnimDataRef.current.sweepProgress < 1) ||
    animationQueueRef.current.length > 0;

  const waitForAnimations = (callback: () => void) => {
    if (!isAnimating()) callback();
    else animationQueueRef.current.push(callback);
  };

  // ---- 线扫描评估 ----
  const evaluateBoard = (): number => {
    const board = boardRef.current;
    let blackScore = 0;
    let whiteScore = 0;

    const scoreWindow = (cells: number[]) => {
      let bCount = 0, wCount = 0;
      for (const c of cells) {
        if (c === BLACK) bCount++;
        else if (c === WHITE) wCount++;
      }
      if (bCount > 0 && wCount > 0) return { b: 0, w: 0 };
      if (bCount === 0 && wCount === 0) return { b: 0, w: 0 };

      const isBlack = bCount > 0;
      const count = isBlack ? bCount : wCount;
      const leftOpen = cells[0] === EMPTY ? 1 : 0;
      const rightOpen = cells[4] === EMPTY ? 1 : 0;
      const effectiveOpen = leftOpen + rightOpen;

      let score = 0;
      if (count === 5) score = SCORE_FIVE;
      else if (count === 4) score = effectiveOpen >= 2 ? SCORE_OPEN_FOUR : effectiveOpen >= 1 ? SCORE_RUSH_FOUR : 0;
      else if (count === 3) score = effectiveOpen >= 2 ? SCORE_OPEN_THREE : effectiveOpen >= 1 ? SCORE_SLEEP_THREE : 0;
      else if (count === 2) score = effectiveOpen >= 2 ? SCORE_OPEN_TWO : effectiveOpen >= 1 ? SCORE_SLEEP_TWO : 0;
      else if (count === 1 && effectiveOpen >= 2) score = 1;

      return isBlack ? { b: score, w: 0 } : { b: 0, w: score };
    };

    // 水平
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c <= BOARD_SIZE - 5; c++) {
        const cells: number[] = [];
        for (let i = 0; i < 5; i++) cells.push(board[r][c + i]);
        const res = scoreWindow(cells);
        blackScore += res.b; whiteScore += res.w;
      }
    // 垂直
    for (let r = 0; r <= BOARD_SIZE - 5; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cells: number[] = [];
        for (let i = 0; i < 5; i++) cells.push(board[r + i][c]);
        const res = scoreWindow(cells);
        blackScore += res.b; whiteScore += res.w;
      }
    // 对角 ↘
    for (let r = 0; r <= BOARD_SIZE - 5; r++)
      for (let c = 0; c <= BOARD_SIZE - 5; c++) {
        const cells: number[] = [];
        for (let i = 0; i < 5; i++) cells.push(board[r + i][c + i]);
        const res = scoreWindow(cells);
        blackScore += res.b; whiteScore += res.w;
      }
    // 对角 ↙
    for (let r = 0; r <= BOARD_SIZE - 5; r++)
      for (let c = 4; c < BOARD_SIZE; c++) {
        const cells: number[] = [];
        for (let i = 0; i < 5; i++) cells.push(board[r + i][c - i]);
        const res = scoreWindow(cells);
        blackScore += res.b; whiteScore += res.w;
      }

    let bPos = 0, wPos = 0;
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === BLACK) bPos += positionWeightRef.current[r][c];
        else if (board[r][c] === WHITE) wPos += positionWeightRef.current[r][c];
      }
    return (whiteScore + wPos * 0.1) - (blackScore * DEFENSE_COEFF + bPos * 0.1);
  };

  // ---- 威胁空间搜索 ----
  const threatSpaceSearch = (player: number): Move | null => {
    const board = boardRef.current;
    const opponent = player === BLACK ? WHITE : BLACK;
    const candidates: { row: number; col: number; score: number }[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== EMPTY) continue;

        // 检查直接五连
        board[r][c] = player;
        const win = checkWinAt(r, c, player);
        board[r][c] = EMPTY;
        if (win) return { row: r, col: c, player };

        // 检查威胁等级
        let threatScore = 0;
        for (const [dr, dc] of DIRECTIONS) {
          let count = 1, openEnds = 0;
          for (let i = 1; i <= 4; i++) {
            const nr = r + dr * i, nc = c + dc * i;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) count++;
            else if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === EMPTY) { openEnds++; break; }
            else break;
          }
          for (let i = 1; i <= 4; i++) {
            const nr = r - dr * i, nc = c - dc * i;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) count++;
            else if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === EMPTY) { openEnds++; break; }
            else break;
          }
          if (count === 4 && openEnds >= 1) threatScore += 50;
          else if (count === 3 && openEnds === 2) threatScore += 10;
        }
        if (threatScore >= 60) candidates.push({ row: r, col: c, score: threatScore });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return { row: candidates[0].row, col: candidates[0].col, player };
    }
    return null;
  };

  // ---- AI：迭代加深 Minimax ----
  const computeAiMove = (): Move | null => {
    aiSearchStartTimeRef.current = performance.now();
    aiTimedOutRef.current = false;
    aiBestMoveRef.current = null;
    const player = WHITE;
    const opponent = BLACK;

    // 1. 杀棋检测
    const tssMove = threatSpaceSearch(player);
    if (tssMove) return tssMove;
    const oppTss = threatSpaceSearch(opponent);
    if (oppTss) return { row: oppTss.row, col: oppTss.col, player };

    // 2. 迭代加深
    const maxDepth = 12;
    let bestMove: Move | null = null;
    const timeLimit = aiTimeLimitRef.current;
    transpositionTableRef.current = new Map();

    for (let depth = 1; depth <= maxDepth; depth++) {
      if (performance.now() - aiSearchStartTimeRef.current > timeLimit * 0.8) break;
      let currentBest: Move | null = null;
      let bestScore = -Infinity;
      const candidates = generateCandidateMoves();
      if (candidates.length === 0) return { row: 7, col: 7, player };
      if (candidates.length === 1) return { ...candidates[0], player };

      const scored = candidates.map(m => ({
        move: m,
        score: quickEvaluate(m.row, m.col, player) + historyTableRef.current[m.row][m.col],
      }));
      scored.sort((a, b) => b.score - a.score);

      for (const { move } of scored) {
        if (aiTimedOutRef.current) break;
        boardRef.current[move.row][move.col] = player;
        const score = minimax(depth - 1, -Infinity, Infinity, false);
        boardRef.current[move.row][move.col] = EMPTY;
        if (score > bestScore) {
          bestScore = score;
          currentBest = { ...move, player };
        }
        if (aiTimedOutRef.current) break;
      }
      if (currentBest && !aiTimedOutRef.current) {
        bestMove = currentBest;
        historyTableRef.current[bestMove.row][bestMove.col] += depth * depth;
      }
      if (bestScore >= SCORE_FIVE) break;
    }
    return bestMove || { row: 7, col: 7, player };
  };

  const minimax = (depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
    if (performance.now() - aiSearchStartTimeRef.current > aiTimeLimitRef.current) {
      aiTimedOutRef.current = true;
      return isMaximizing ? -Infinity : Infinity;
    }
    if (aiTimedOutRef.current) return isMaximizing ? -Infinity : Infinity;

    const board = boardRef.current;
    const hash = computeZobristHash(board);
    const tt = transpositionTableRef.current!;
    if (tt.has(hash)) {
      const entry = tt.get(hash)!;
      if (entry.depth >= depth) {
        if (entry.type === "exact") return entry.score;
        if (entry.type === "lower" && entry.score > alpha) alpha = entry.score;
        if (entry.type === "upper" && entry.score < beta) beta = entry.score;
        if (alpha >= beta) return entry.score;
      }
    }

    const lastMove = moveHistoryRef.current[moveHistoryRef.current.length - 1];
    if (lastMove) {
      const winCheck = checkWinAt(lastMove.row, lastMove.col, lastMove.player);
      if (winCheck) {
        const score = lastMove.player === WHITE ? SCORE_FIVE + depth : -(SCORE_FIVE + depth);
        storeTT(hash, depth, score, "exact");
        return score;
      }
    }
    if (isBoardFull()) { storeTT(hash, depth, 0, "exact"); return 0; }
    if (depth <= 0) {
      const score = evaluateBoard();
      storeTT(hash, depth, score, "exact");
      return score;
    }

    const currentPlayer = isMaximizing ? WHITE : BLACK;
    const candidates = generateCandidateMoves();
    if (candidates.length === 0) {
      const score = evaluateBoard();
      storeTT(hash, depth, score, "exact");
      return score;
    }

    const scored = candidates.map(m => ({
      move: m,
      score: quickEvaluate(m.row, m.col, currentPlayer) + historyTableRef.current[m.row][m.col] * 2,
    }));
    scored.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score);

    let bestScore = isMaximizing ? -Infinity : Infinity;
    let entryType = isMaximizing ? "upper" : "lower";
    let bestMove: { row: number; col: number } | null = null;

    for (const { move } of scored) {
      if (aiTimedOutRef.current) break;
      board[move.row][move.col] = currentPlayer;
      const score = minimax(depth - 1, alpha, beta, !isMaximizing);
      board[move.row][move.col] = EMPTY;

      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, score);
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
        beta = Math.min(beta, score);
      }
      if (beta <= alpha) {
        entryType = "exact";
        if (bestMove) historyTableRef.current[bestMove.row][bestMove.col] += depth * depth;
        break;
      }
    }
    storeTT(hash, depth, bestScore, entryType);
    return bestScore;
  };

  const storeTT = (hash: number, depth: number, score: number, type: string) => {
    const tt = transpositionTableRef.current!;
    if (tt.size > 500000) {
      const keys = [...tt.keys()];
      for (let i = 0; i < keys.length / 2; i++) tt.delete(keys[i]);
    }
    const existing = tt.get(hash);
    if (!existing || existing.depth <= depth) {
      tt.set(hash, { depth, score, type });
    }
  };

  const generateCandidateMoves = () => {
    const occupied: { row: number; col: number }[] = [];
    const board = boardRef.current;
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (board[r][c] !== EMPTY) occupied.push({ row: r, col: c });
    if (occupied.length === 0) return [{ row: 7, col: 7 }];

    const candidateSet = new Set<number>();
    for (const { row, col } of occupied) {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (Math.abs(dr) + Math.abs(dc) > 3) continue;
          const nr = row + dr, nc = col + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === EMPTY) {
            candidateSet.add(nr * BOARD_SIZE + nc);
          }
        }
      }
    }
    return Array.from(candidateSet).map(key => ({ row: Math.floor(key / BOARD_SIZE), col: key % BOARD_SIZE }));
  };

  const quickEvaluate = (row: number, col: number, player: number) => {
    let score = 0;
    const board = boardRef.current;
    for (const [dr, dc] of DIRECTIONS) {
      let count = 1, openEnds = 0;
      for (let i = 1; i <= 4; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++;
        else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) { openEnds++; break; }
        else break;
      }
      for (let i = 1; i <= 4; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++;
        else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) { openEnds++; break; }
        else break;
      }
      if (count >= 5) score += SCORE_FIVE;
      else if (count === 4 && openEnds === 2) score += SCORE_OPEN_FOUR;
      else if (count === 4 && openEnds === 1) score += SCORE_RUSH_FOUR;
      else if (count === 3 && openEnds === 2) score += SCORE_OPEN_THREE;
      else if (count === 3 && openEnds === 1) score += SCORE_SLEEP_THREE;
      else if (count === 2 && openEnds === 2) score += SCORE_OPEN_TWO;
      else if (count === 2 && openEnds === 1) score += SCORE_SLEEP_TWO;
    }
    // 防守价值
    const opponent = player === BLACK ? WHITE : BLACK;
    const orig = board[row][col];
    board[row][col] = opponent;
    let oppScore = 0;
    for (const [dr, dc] of DIRECTIONS) {
      let count = 1, openEnds = 0;
      for (let i = 1; i <= 4; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) count++;
        else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) { openEnds++; break; }
        else break;
      }
      for (let i = 1; i <= 4; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) count++;
        else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) { openEnds++; break; }
        else break;
      }
      if (count >= 5) oppScore += SCORE_FIVE;
      else if (count === 4 && openEnds === 2) oppScore += SCORE_OPEN_FOUR;
      else if (count === 4 && openEnds === 1) oppScore += SCORE_RUSH_FOUR;
      else if (count === 3 && openEnds === 2) oppScore += SCORE_OPEN_THREE;
      else if (count === 3 && openEnds === 1) oppScore += SCORE_SLEEP_THREE;
    }
    board[row][col] = orig;
    return score + oppScore * 0.9;
  };

  // ---- 玩家操作 ----
  const handlePlayerMove = (row: number, col: number) => {
    if (gameOverRef.current || isAiThinkingRef.current || animatingRef.current || isAnimating()) return;
    if (boardRef.current[row][col] !== EMPTY) return;
    if (mode === "pve" && currentPlayerRef.current !== BLACK) return;
    if (mode === "evs") return;

    animatingRef.current = true;
    placePiece(row, col, currentPlayerRef.current);
    sfxPlace();
    animatePiecePlace(row, col, () => { animatingRef.current = false; });

    const win = checkWinAt(row, col, currentPlayerRef.current);
    if (win) {
      gameOverRef.current = true;
      winnerRef.current = currentPlayerRef.current;
      winLineRef.current = win;
      updateStatusDisplay();
      waitForAnimations(() => { animateVictory(win.cells); sfxWin(); });
      return;
    }
    if (isBoardFull()) {
      gameOverRef.current = true;
      updateStatusDisplay();
      return;
    }

    if (mode === "pvp") {
      currentPlayerRef.current = currentPlayerRef.current === BLACK ? WHITE : BLACK;
      updateStatusDisplay();
    } else {
      // PvE: AI 回合
      currentPlayerRef.current = WHITE;
      updateStatusDisplay();
      setIsBoardDimmed(true);
      setShowOverlay(true);
      isAiThinkingRef.current = true;
      computeAiMoveAsync().then(aiMove => {
        isAiThinkingRef.current = false;
        setIsBoardDimmed(false);
        setShowOverlay(false);
        if (!aiMove || gameOverRef.current) { updateStatusDisplay(); return; }
        waitForAnimations(() => {
          animatingRef.current = true;
          placePiece(aiMove.row, aiMove.col, WHITE);
          sfxPlace();
          animatePiecePlace(aiMove.row, aiMove.col, () => { animatingRef.current = false; });
          const aiWin = checkWinAt(aiMove.row, aiMove.col, WHITE);
          if (aiWin) {
            gameOverRef.current = true;
            winnerRef.current = WHITE;
            winLineRef.current = aiWin;
            updateStatusDisplay();
            waitForAnimations(() => { animateVictory(aiWin.cells); sfxWin(); });
            return;
          }
          if (isBoardFull()) { gameOverRef.current = true; updateStatusDisplay(); return; }
          currentPlayerRef.current = BLACK;
          updateStatusDisplay();
        });
      });
    }
  };

  const computeAiMoveAsync = (): Promise<Move | null> => {
    return new Promise(resolve => {
      setTimeout(() => resolve(computeAiMove()), 50);
    });
  };

  // ---- 悔棋 ----
  const handleUndo = () => {
    if (gameOverRef.current || isAiThinkingRef.current || animatingRef.current || isAnimating()) return;
    const history = moveHistoryRef.current;
    if (history.length === 0) return;

    let steps = mode === "pve" ? 2 : 1;
    if (mode === "pve" && currentPlayerRef.current === WHITE && history.length < 2) steps = 1;
    if (mode === "pve" && currentPlayerRef.current === BLACK && history.length < 2) return;

    animatingRef.current = true;
    let completed = 0;
    const total = steps;
    for (let i = 0; i < steps; i++) {
      const move = undoLastMove();
      if (move) {
        animatePieceRemove(move.row, move.col, () => {
          completed++;
          if (completed >= total) {
            currentPlayerRef.current = mode === "pve"
              ? BLACK
              : (history.length > 0 ? history[history.length - 1].player : BLACK);
            gameOverRef.current = false;
            winnerRef.current = null;
            winLineRef.current = null;
            victoryAnimDataRef.current = null;
            updateStatusDisplay();
            setIsBoardDimmed(false);
            setShowOverlay(false);
            isAiThinkingRef.current = false;
            animatingRef.current = false;
          }
        });
      }
    }
  };

  // ---- 重新开始 ----
  const handleRestart = () => {
    pieceAnimationsRef.current = {};
    victoryAnimDataRef.current = null;
    animationQueueRef.current = [];
    animatingRef.current = false;
    resetGame();
    boardEntranceProgressRef.current = 0;
    boardEntranceDoneRef.current = false;
    starPointOpacityRef.current = 0;
  };

  // ---- 模式切换 ----
  const changeMode = (newMode: GameMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    handleRestart();
  };

  // ---- 存档/读档/导出/导入 ----
  const saveToLocal = () => {
    const state = {
      board: boardRef.current,
      history: moveHistoryRef.current,
      currentPlayer: currentPlayerRef.current,
      gameOver: gameOverRef.current,
      winner: winnerRef.current,
      mode,
      difficultyTime,
    };
    localStorage.setItem("gomoku_save", JSON.stringify(state));
  };

  const loadFromLocal = () => {
    const raw = localStorage.getItem("gomoku_save");
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      boardRef.current = state.board;
      moveHistoryRef.current = state.history;
      currentPlayerRef.current = state.currentPlayer;
      gameOverRef.current = state.gameOver;
      winnerRef.current = state.winner;
      setMode(state.mode);
      setDifficultyTime(state.difficultyTime);
      aiTimeLimitRef.current = state.difficultyTime;
      updateStatusDisplay();
      pieceAnimationsRef.current = {};
      victoryAnimDataRef.current = null;
    } catch { /* ignore */ }
  };

  const exportGame = () => {
    const data = JSON.stringify(moveHistoryRef.current, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gomoku_replay.json";
    a.click();
  };

  const importGame = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const moves: Move[] = JSON.parse(ev.target?.result as string);
        resetGame();
        moves.forEach(m => placePiece(m.row, m.col, m.player));
        currentPlayerRef.current = moves.length % 2 === 0 ? BLACK : WHITE;
        updateStatusDisplay();
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ---- 旁观模式自动对弈 ----
  useEffect(() => {
    if (mode !== "evs" || gameOverRef.current) return;
    const fn = () => {
      if (isAiThinkingRef.current || animatingRef.current || gameOverRef.current) return;
      const player = currentPlayerRef.current;
      aiTimeLimitRef.current = difficultyTime;
      aiSearchStartTimeRef.current = performance.now();
      aiTimedOutRef.current = false;
      aiBestMoveRef.current = null;
      isAiThinkingRef.current = true;
      updateStatusDisplay();
      computeAiMoveAsync().then(move => {
        isAiThinkingRef.current = false;
        if (!move || gameOverRef.current) { updateStatusDisplay(); return; }
        waitForAnimations(() => {
          animatingRef.current = true;
          placePiece(move.row, move.col, player);
          sfxPlace();
          animatePiecePlace(move.row, move.col, () => { animatingRef.current = false; });
          const win = checkWinAt(move.row, move.col, player);
          if (win) {
            gameOverRef.current = true;
            winnerRef.current = player;
            winLineRef.current = win;
            updateStatusDisplay();
            waitForAnimations(() => { animateVictory(win.cells); sfxWin(); });
            return;
          }
          if (isBoardFull()) { gameOverRef.current = true; updateStatusDisplay(); return; }
          currentPlayerRef.current = player === BLACK ? WHITE : BLACK;
          updateStatusDisplay();
        });
      });
    };
    const timer = setInterval(fn, 500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ---- H 键提示 ----
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "h" || e.key === "H") && !gameOverRef.current && !isAiThinkingRef.current && currentPlayerRef.current === BLACK) {
        showHintRef.current = true;
        const origLimit = aiTimeLimitRef.current;
        aiTimeLimitRef.current = 300;
        const hint = computeAiMove();
        hintMoveRef.current = hint ? { row: hint.row, col: hint.col } : null;
        aiTimeLimitRef.current = origLimit;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "h" || e.key === "H") {
        showHintRef.current = false;
        hintMoveRef.current = null;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Canvas 绘制 ----
  const getPixelPos = (row: number, col: number) => ({
    x: PADDING + col * CELL_SIZE, y: PADDING + row * CELL_SIZE,
  });

  const getBoardPos = (mx: number, my: number) => {
    const col = Math.round((mx - PADDING) / CELL_SIZE);
    const row = Math.round((my - PADDING) / CELL_SIZE);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
    const pos = getPixelPos(row, col);
    if (Math.hypot(mx - pos.x, my - pos.y) < CELL_SIZE * 0.42) return { row, col };
    return null;
  };

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const entranceScale = boardEntranceDoneRef.current ? 1 : easeOutCubic(boardEntranceProgressRef.current);
    const entranceAlpha = boardEntranceDoneRef.current ? 1 : Math.max(0, boardEntranceProgressRef.current * 1.2);

    if (!boardEntranceDoneRef.current && boardEntranceProgressRef.current < 1) {
      ctx.save();
      const cx = CANVAS_SIZE / 2, cy = CANVAS_SIZE / 2;
      ctx.translate(cx, cy);
      ctx.scale(entranceScale, entranceScale);
      ctx.translate(-cx, -cy);
      ctx.globalAlpha = entranceAlpha;
    }

    // 棋盘阴影
    const bx = PADDING - CELL_SIZE * 0.6, by = PADDING - CELL_SIZE * 0.6;
    const bw = (BOARD_SIZE - 1) * CELL_SIZE + CELL_SIZE * 1.2;
    const bh = (BOARD_SIZE - 1) * CELL_SIZE + CELL_SIZE * 1.2;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    (ctx as any).roundRect(bx + 4, by + 4, bw, bh, 8);
    ctx.fill();

    const grad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    const bg1 = darkMode ? "#1e1e3c" : "#1a1a35";
    const bg2 = darkMode ? "#252545" : "#1e1e3c";
    grad.addColorStop(0, bg1);
    grad.addColorStop(0.5, bg2);
    grad.addColorStop(1, darkMode ? "#1a1a35" : "#181830");
    ctx.fillStyle = grad;
    ctx.beginPath();
    (ctx as any).roundRect(bx, by, bw, bh, 8);
    ctx.fill();

    ctx.strokeStyle = darkMode ? "rgba(100,180,255,0.4)" : "rgba(100,180,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    (ctx as any).roundRect(bx, by, bw, bh, 8);
    ctx.stroke();

    // 网格线
    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = PADDING + i * CELL_SIZE;
      const progress = boardEntranceDoneRef.current
        ? 1 : Math.max(0, Math.min(1, (boardEntranceProgressRef.current - 0.1 * Math.abs(i - 7) / 7) * 1.4));
      const alpha = entranceAlpha * progress;
      ctx.strokeStyle = `rgba(140,200,255,${0.55 * alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = `rgba(120,200,255,${0.3 * alpha})`;
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(PADDING, pos);
      ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, pos);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(pos, PADDING);
      ctx.lineTo(pos, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 星位
    const starAlpha = boardEntranceDoneRef.current
      ? starPointOpacityRef.current : Math.max(0, (boardEntranceProgressRef.current - 0.4) * 1.8);
    for (const [sr, sc] of STAR_POINTS) {
      const sp = getPixelPos(sr, sc);
      const halo = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 8);
      halo.addColorStop(0, `rgba(180,220,255,${0.8 * starAlpha})`);
      halo.addColorStop(0.5, `rgba(140,200,255,${0.35 * starAlpha})`);
      halo.addColorStop(1, "rgba(140,200,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(200,230,255,${0.9 * starAlpha})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!boardEntranceDoneRef.current && boardEntranceProgressRef.current < 1) {
      ctx.restore();
    }

    // 胜利光线
    if (victoryAnimDataRef.current?.active && winLineRef.current) {
      drawVictoryLineEffect(ctx);
    }

    // 绘制棋子
    const board = boardRef.current;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = board[r][c];
        if (cell === EMPTY) continue;
        const key = `${r},${c}`;
        const anim = pieceAnimationsRef.current[key];
        let scale = 1, alpha = 1, glow = 0, rotation = 0;
        if (anim) {
          if (anim.type === "place") {
            scale = easeOutBack(Math.min(1, anim.progress));
            glow = Math.max(0, (1 - anim.progress) * 0.7);
          } else if (anim.type === "remove") {
            scale = 1 - easeInQuad(Math.min(1, anim.progress));
            rotation = anim.progress * Math.PI * 1.5;
            alpha = 1 - anim.progress;
            glow = anim.progress * 0.5;
          }
        }
        if (victoryAnimDataRef.current?.active && winLineRef.current) {
          const ci = victoryAnimDataRef.current.flashCells.findIndex(fc => fc.row === r && fc.col === c);
          if (ci >= 0 && ci <= victoryAnimDataRef.current.flashPhase) glow = Math.max(glow, 1.2);
        }
        if (alpha <= 0.01 && scale <= 0.01) continue;
        drawPiece(ctx, r, c, cell, scale, alpha, glow, rotation);
      }
    }

    // 走法提示
    if (showHintRef.current && hintMoveRef.current && !gameOverRef.current && currentPlayerRef.current === BLACK && board[hintMoveRef.current.row][hintMoveRef.current.col] === EMPTY) {
      const hp = getPixelPos(hintMoveRef.current.row, hintMoveRef.current.col);
      ctx.save();
      const pulse = 0.4 + 0.3 * Math.sin(Date.now() / 400);
      const hintGlow = ctx.createRadialGradient(hp.x, hp.y, 2, hp.x, hp.y, CELL_SIZE * 0.7);
      hintGlow.addColorStop(0, `rgba(100,255,100,${pulse * 0.9})`);
      hintGlow.addColorStop(0.4, `rgba(100,255,100,${pulse * 0.4})`);
      hintGlow.addColorStop(1, "rgba(100,255,100,0)");
      ctx.fillStyle = hintGlow;
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, CELL_SIZE * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(100,255,100,${pulse * 0.8})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, CELL_SIZE * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 悬停预览
    if (hoverPosRef.current && !gameOverRef.current && !isAiThinkingRef.current && currentPlayerRef.current === BLACK && board[hoverPosRef.current.row][hoverPosRef.current.col] === EMPTY) {
      const hp = hoverPosRef.current;
      const pos = getPixelPos(hp.row, hp.col);
      const breatheAlpha = 0.35 + 0.15 * Math.sin(Date.now() / 600);
      const pulseScale = 1 + 0.04 * Math.sin(Date.now() / 500);
      drawPieceAt(ctx, pos.x, pos.y, BLACK, pulseScale, breatheAlpha, 0.15, 0);
    }
  }, [darkMode]);

  const drawPiece = (ctx: CanvasRenderingContext2D, row: number, col: number, player: number, scale: number, alpha: number, glow: number, rotation: number) => {
    const pos = getPixelPos(row, col);
    drawPieceAt(ctx, pos.x, pos.y, player, scale, alpha, glow, rotation);
  };

  const drawPieceAt = (ctx: CanvasRenderingContext2D, x: number, y: number, player: number, scale: number, alpha: number, glow: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    const r = CELL_SIZE * 0.44;

    if (glow > 0.01) {
      const g = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 1.7);
      if (player === BLACK) {
        g.addColorStop(0, `rgba(255,255,255,${0.35 * glow})`);
        g.addColorStop(0.5, `rgba(180,200,255,${0.18 * glow})`);
        g.addColorStop(1, "rgba(100,150,255,0)");
      } else {
        g.addColorStop(0, `rgba(255,255,255,${0.5 * glow})`);
        g.addColorStop(0.5, `rgba(255,220,180,${0.22 * glow})`);
        g.addColorStop(1, "rgba(255,200,100,0)");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(1.5, 2, r, 0, Math.PI * 2);
    ctx.fill();

    const pg = ctx.createRadialGradient(-r * 0.25, -r * 0.35, r * 0.08, 0, 0, r);
    if (player === BLACK) {
      pg.addColorStop(0, "#707080"); pg.addColorStop(0.4, "#3a3a48");
      pg.addColorStop(0.75, "#1a1a24"); pg.addColorStop(1, "#0a0a12");
    } else {
      pg.addColorStop(0, "#ffffff"); pg.addColorStop(0.3, "#f0f0f5");
      pg.addColorStop(0.6, "#d8d8e2"); pg.addColorStop(0.85, "#b8b8c8"); pg.addColorStop(1, "#9090a0");
    }
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    const hl = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.04, -r * 0.1, -r * 0.15, r * 0.55);
    if (player === BLACK) {
      hl.addColorStop(0, "rgba(255,255,255,0.45)");
      hl.addColorStop(0.5, "rgba(255,255,255,0.1)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
    } else {
      hl.addColorStop(0, "rgba(255,255,255,0.8)");
      hl.addColorStop(0.4, "rgba(255,255,255,0.25)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
    }
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawVictoryLineEffect = (ctx: CanvasRenderingContext2D) => {
    const winLine = winLineRef.current!;
    const cells = winLine.cells;
    const anim = victoryAnimDataRef.current!;
    const sweepProgress = anim.sweepProgress || 0;
    const totalSegments = cells.length - 1;
    const floatIndex = sweepProgress * totalSegments;
    const segIdx = Math.floor(floatIndex);
    const segFrac = floatIndex - segIdx;

    for (let i = 0; i < cells.length; i++) {
      const cp = getPixelPos(cells[i].row, cells[i].col);
      let glowIntensity = 0;
      if (i < segIdx) glowIntensity = 0.9;
      else if (i === segIdx) glowIntensity = 0.9 * (1 - segFrac) + 0.3 * segFrac;
      else if (i === segIdx + 1 && segIdx + 1 < cells.length) glowIntensity = 0.3 * (1 - segFrac) + 0.9 * segFrac;

      if (glowIntensity > 0.01) {
        const gg = ctx.createRadialGradient(cp.x, cp.y, CELL_SIZE * 0.3, cp.x, cp.y, CELL_SIZE * 0.9);
        gg.addColorStop(0, `rgba(255,220,100,${0.85 * glowIntensity})`);
        gg.addColorStop(0.5, `rgba(255,180,60,${0.5 * glowIntensity})`);
        gg.addColorStop(1, "rgba(255,150,30,0)");
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, CELL_SIZE * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (segIdx >= 0 && segIdx < cells.length - 1) {
      const p1 = getPixelPos(cells[segIdx].row, cells[segIdx].col);
      const p2 = getPixelPos(cells[Math.min(segIdx + 1, cells.length - 1)].row, cells[Math.min(segIdx + 1, cells.length - 1)].col);
      const lx = p1.x + (p2.x - p1.x) * segFrac;
      const ly = p1.y + (p2.y - p1.y) * segFrac;
      const bg = ctx.createRadialGradient(lx, ly, 1, lx, ly, CELL_SIZE * 0.7);
      bg.addColorStop(0, "rgba(255,255,220,0.9)");
      bg.addColorStop(0.3, "rgba(255,200,100,0.6)");
      bg.addColorStop(1, "rgba(255,150,50,0)");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(lx, ly, CELL_SIZE * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // ---- 动画循环 ----
  const updateAnimations = (dt: number, timestamp: number) => {
    if (!boardEntranceDoneRef.current && boardEntranceProgressRef.current < 1) {
      boardEntranceProgressRef.current = Math.min(1, boardEntranceProgressRef.current + dt / 700);
      starPointOpacityRef.current = Math.max(0, Math.min(1, (boardEntranceProgressRef.current - 0.35) * 2.2));
      if (boardEntranceProgressRef.current >= 1) {
        boardEntranceDoneRef.current = true;
        starPointOpacityRef.current = 1;
      }
    }

    const pieces = pieceAnimationsRef.current;
    const toRemove: string[] = [];
    for (const [key, anim] of Object.entries(pieces)) {
      anim.progress += dt / anim.duration;
      if (anim.progress >= 1) {
        anim.progress = 1;
        if (anim.onComplete) {
          anim.onComplete();
          anim.onComplete = undefined;
        }
        toRemove.push(key);
      }
    }
    for (const key of toRemove) delete pieces[key];

    const vict = victoryAnimDataRef.current;
    if (vict?.active) {
      const elapsed = timestamp - vict.startTime;
      if (vict.flashPhase < vict.flashCells.length) {
        const newPhase = Math.min(Math.floor((elapsed - vict.flashStartTime) / 100), vict.flashCells.length);
        if (newPhase > vict.flashPhase) vict.flashPhase = newPhase;
      }
      const sweepDelay = vict.flashCells.length * 100 + 200;
      if (elapsed > sweepDelay) vict.sweepProgress = Math.min(1, (elapsed - sweepDelay) / 700);
      if (elapsed > vict.totalDuration) vict.sweepProgress = 1;
    }

    if (animationQueueRef.current.length > 0 && Object.keys(pieces).length === 0 && !(vict?.active && vict.sweepProgress < 1)) {
      const next = animationQueueRef.current.shift();
      if (next) next();
    }
  };

  // ---- 动画帧循环 ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_SIZE * DPR;
    canvas.height = CANVAS_SIZE * DPR;
    canvas.style.width = CANVAS_SIZE + "px";
    canvas.style.height = CANVAS_SIZE + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    initZobrist();
    initPositionWeight();
    resetGame(true);

    let lastTime = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;
      updateAnimations(dt, timestamp);
      drawBoard();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawBoard]);

  // ---- 事件处理 ----
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const my = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    const pos = getBoardPos(mx, my);
    if (pos) handlePlayerMove(pos.row, pos.col);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const my = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    const pos = getBoardPos(mx, my);
    if (pos && boardRef.current[pos.row][pos.col] === EMPTY && !gameOverRef.current && !isAiThinkingRef.current && currentPlayerRef.current === BLACK && !animatingRef.current) {
      hoverPosRef.current = pos;
    } else {
      hoverPosRef.current = null;
    }
  };

  const handleCanvasMouseLeave = () => { hoverPosRef.current = null; };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = (touch.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const my = (touch.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    const pos = getBoardPos(mx, my);
    if (pos) handlePlayerMove(pos.row, pos.col);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = (touch.clientX - rect.left) * (CANVAS_SIZE / rect.width);
    const my = (touch.clientY - rect.top) * (CANVAS_SIZE / rect.height);
    const pos = getBoardPos(mx, my);
    if (pos && boardRef.current[pos.row][pos.col] === EMPTY && !gameOverRef.current && !isAiThinkingRef.current && currentPlayerRef.current === BLACK && !animatingRef.current) {
      hoverPosRef.current = pos;
    } else {
      hoverPosRef.current = null;
    }
  };

  const handleTouchEnd = () => { hoverPosRef.current = null; };

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); handleUndo(); }
      if (e.ctrlKey && e.key === "r") { e.preventDefault(); handleRestart(); }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); saveToLocal(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // ---- 渲染 ----
  return (
    <div className="w-[70%] mx-auto py-8 px-4 max-md:w-[95%]">
      <BackButton />
      <div className="flex flex-col items-center gap-4 mt-6">
        {/* 状态栏 */}
        <div className={`w-full p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-500 bg-white/10 border-white/20 dark:bg-black/20 dark:border-white/10 ${statusAnimClass === "player-turn" ? "ring-2 ring-cyan-400/30" : ""} ${statusAnimClass === "ai-thinking" ? "ring-2 ring-amber-400/30" : ""} ${statusAnimClass === "victory" ? "ring-2 ring-yellow-400/40" : ""}`}>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-3xl transition-transform duration-300 ${statusAnimClass ? "animate-flip" : ""}`}>
              {statusIcon}
            </span>
            <span className={`text-lg font-semibold tracking-wide transition-colors duration-500 text-gray-200 dark:text-gray-100 ${statusAnimClass === "player-turn" ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" : ""} ${statusAnimClass === "ai-thinking" ? "text-cyan-300 animate-pulse" : ""} ${statusAnimClass === "victory" ? "text-yellow-300 animate-bounce-in" : ""} ${statusAnimClass === "defeat" ? "text-pink-400" : ""} ${statusAnimClass === "draw-text" ? "text-gray-400" : ""}`}>
              {statusText}
            </span>
          </div>
        </div>

        {/* 棋盘 */}
        <div className={`relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,200,255,0.2)] transition-all duration-500 ${isBoardDimmed ? "brightness-50 saturate-50" : ""}`}>
          <canvas ref={canvasRef} className="block cursor-pointer rounded-2xl" onClick={handleCanvasClick} onMouseMove={handleCanvasMouseMove} onMouseLeave={handleCanvasMouseLeave} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} />
          {showOverlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_20px_rgba(0,229,255,0.6)]" />
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(0,229,255,0.7)]" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 控制面板 */}
        <div className="w-full p-4 flex flex-wrap gap-3 justify-center rounded-2xl border backdrop-blur-xl bg-white/5 border-white/15 dark:bg-black/20 dark:border-white/10 shadow-2xl">
          <button onClick={handleRestart} className="px-5 py-2.5 rounded-full font-semibold text-sm border transition-all duration-200 bg-amber-500/10 border-amber-400/40 text-amber-200 hover:bg-amber-500/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95">🔄 重新开始</button>
          <button onClick={handleUndo} className="px-5 py-2.5 rounded-full font-semibold text-sm border transition-all duration-200 bg-pink-500/10 border-pink-400/40 text-pink-200 hover:bg-pink-500/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/20 active:scale-95">↩ 悔棋</button>

          {/* 模式切换 */}
          <div className="flex gap-1 items-center px-3 py-1 rounded-full bg-white/5 border border-white/20">
            {(["pve", "pvp", "evs"] as const).map(m => (
              <button key={m} onClick={() => changeMode(m)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${mode === m ? "bg-cyan-500/20 border border-cyan-400 text-white" : "text-gray-400 hover:text-gray-200"}`}>
                {m === "pve" ? "🤖 人机" : m === "pvp" ? "👥 双人" : "🎬 旁观"}
              </button>
            ))}
          </div>

          {/* 时间滑块 */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/20">
            <span className="text-xs text-gray-400">AI 时间</span>
            <input type="range" min="100" max="2000" step="100" value={difficultyTime} onChange={e => { const v = parseInt(e.target.value); setDifficultyTime(v); aiTimeLimitRef.current = v; }} className="w-24 h-1" />
            <span className="text-xs text-gray-400 w-10 text-right">{difficultyTime}ms</span>
          </div>

          {/* 存档功能 */}
          <button onClick={saveToLocal} className="px-3 py-1.5 rounded-full text-xs border transition-all bg-white/5 border-white/20 text-gray-300 hover:bg-white/10">💾 保存</button>
          <button onClick={loadFromLocal} className="px-3 py-1.5 rounded-full text-xs border transition-all bg-white/5 border-white/20 text-gray-300 hover:bg-white/10">📂 读取</button>
          <button onClick={exportGame} className="px-3 py-1.5 rounded-full text-xs border transition-all bg-white/5 border-white/20 text-gray-300 hover:bg-white/10">📤 导出</button>
          <label className="px-3 py-1.5 rounded-full text-xs border transition-all bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 cursor-pointer">
            📥 导入
            <input type="file" accept=".json" onChange={importGame} className="hidden" />
          </label>
        </div>
      </div>

      <style jsx>{`
        @keyframes flip {
          0% { transform: rotateY(0) scale(1); }
          40% { transform: rotateY(180deg) scale(1.3); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        @keyframes bounce-in {
          0% { transform: translateY(-40px); opacity: 0; }
          60% { transform: translateY(6px); opacity: 1; }
          80% { transform: translateY(-8px); }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-flip { animation: flip 0.5s ease-in-out; }
        .animate-bounce-in { animation: bounce-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
    </div>
  );
}
