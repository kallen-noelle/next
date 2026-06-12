"use client";

import { useEffect, useRef, useState, useCallback } from "react";
// 如果您的项目中 BackButton 不存在，可以注释掉下面这行，并自行替换返回按钮
import BackButton from "@/app/_components/article/BackButton";

// ---------- 游戏常量 ----------
const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1; // 玩家
const WHITE = 2; // AI
const CELL_SIZE = 40;
const PADDING = 38;
const CANVAS_SIZE = PADDING * 2 + CELL_SIZE * (BOARD_SIZE - 1);
const DPR = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);

// AI 难度深度映射
const DEPTH_MAP: Record<string, number> = {
  easy: 2,
  medium: 4,
  hard: 6,
};
const AI_TIME_LIMIT = 600; // ms

// 评估分数
const SCORE_FIVE = 1e8;
const SCORE_OPEN_FOUR = 1e6;
const SCORE_RUSH_FOUR = 1e5;
const SCORE_OPEN_THREE = 1e4;
const SCORE_SLEEP_THREE = 1e3;
const SCORE_OPEN_TWO = 1e2;
const SCORE_SLEEP_TWO = 1e1;
const DEFENSE_COEFF = 1.2;

// 方向向量
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

// 星位
const STAR_POINTS = [
  [3, 3],
  [3, 7],
  [3, 11],
  [7, 3],
  [7, 7],
  [7, 11],
  [11, 3],
  [11, 7],
  [11, 11],
];

// ---------- 辅助类型 ----------
interface Move {
  row: number;
  col: number;
  player: number;
}

interface WinLine {
  cells: { row: number; col: number }[];
  direction: [number, number];
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
  flashCells: { row: number; col: number }[];
  flashPhase: number;
  flashStartTime: number;
  sweepProgress: number;
  totalDuration: number;
}

// ---------- 缓动函数 ----------
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInQuad = (t: number) => t * t;

// ---------- 组件 ----------
export default function GomokuPage() {
  // ---- 引用 ----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardWrapperRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  // ---- 可变游戏状态（不触发渲染） ----
  const boardRef = useRef<number[][]>(
    Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY))
  );
  const moveHistoryRef = useRef<Move[]>([]);
  const currentPlayerRef = useRef<number>(BLACK);
  const gameOverRef = useRef<boolean>(false);
  const winnerRef = useRef<number | null>(null);
  const winLineRef = useRef<WinLine | null>(null);
  const isAiThinkingRef = useRef<boolean>(false);
  const animatingRef = useRef<boolean>(false); // 动画进行中，禁止输入
  const pieceAnimationsRef = useRef<Record<string, PieceAnimation>>({});
  const victoryAnimDataRef = useRef<VictoryAnimation | null>(null);
  const hoverPosRef = useRef<{ row: number; col: number } | null>(null);
  const animationQueueRef = useRef<Array<() => void>>([]);
  const boardEntranceProgressRef = useRef<number>(0);
  const boardEntranceDoneRef = useRef<boolean>(false);
  const starPointOpacityRef = useRef<number>(0);

  // Zobrist 表 & 置换表
  const zobristTableRef = useRef<[Record<number, number>, Record<number, number>]>([{}, {}]);
  const transpositionTableRef = useRef<Map<number, { depth: number; score: number; type: string }> | null>(null);

  // AI 搜索临时变量
  const aiSearchStartTimeRef = useRef<number>(0);
  const aiTimedOutRef = useRef<boolean>(false);
  const aiBestMoveRef = useRef<Move | null>(null);

  // ---- 状态（驱动 UI 更新） ----
  const [statusText, setStatusText] = useState("你的回合");
  const [statusIcon, setStatusIcon] = useState("⚫");
  const [statusAnimClass, setStatusAnimClass] = useState("player-turn");
  const [isBoardDimmed, setIsBoardDimmed] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [darkMode, setDarkMode] = useState(false);

  // ---- 深色模式检测 ----
  useEffect(() => {
    const checkDark = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const mediaHandler = (e: MediaQueryListEvent) => {
      if (!document.documentElement.classList.contains("dark")) {
        setDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener("change", mediaHandler);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", mediaHandler);
    };
  }, []);

  // ---- 初始化 Zobrist 表 ----
  const initZobrist = () => {
    const tbl: [Record<number, number>, Record<number, number>] = [{}, {}];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const idx = r * BOARD_SIZE + c;
        tbl[0][idx] = (Math.random() * 0xffffffff) >>> 0;
        tbl[1][idx] = (Math.random() * 0xffffffff) >>> 0;
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
          const idx = cell === BLACK ? 0 : 1;
          hash ^= zobristTableRef.current[idx][r * BOARD_SIZE + c];
        }
      }
    }
    return hash >>> 0;
  };

  // ---- 重置游戏状态 ----
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

  // ---- UI 状态更新 ----
  const updateStatusDisplay = () => {
    let text = "";
    let icon = "";
    let animClass = "";
    if (gameOverRef.current) {
      if (winnerRef.current === BLACK) {
        text = "🎉 恭喜，你赢了！";
        icon = "🏆";
        animClass = "victory";
      } else if (winnerRef.current === WHITE) {
        text = "😔 AI获胜了";
        icon = "💻";
        animClass = "defeat";
      } else {
        text = "🤝 平局";
        icon = "🤝";
        animClass = "draw-text";
      }
    } else if (isAiThinkingRef.current) {
      text = "AI思考中...";
      icon = "🤖";
      animClass = "ai-thinking";
    } else if (currentPlayerRef.current === BLACK) {
      text = "你的回合";
      icon = "⚫";
      animClass = "player-turn";
    } else {
      text = "AI思考中...";
      icon = "🤖";
      animClass = "ai-thinking";
    }
    setStatusText(text);
    setStatusIcon(icon);
    setStatusAnimClass(animClass);
  };

  // ---- 游戏逻辑：检查胜利 ----
  const checkWinAt = (row: number, col: number, player: number): WinLine | null => {
    const board = boardRef.current;
    for (const [dr, dc] of DIRECTIONS) {
      const cells: [number, number][] = [[row, col]];
      // 正方向
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
          cells.push([r, c]);
        } else break;
      }
      // 反方向
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
          cells.unshift([r, c]);
        } else break;
      }
      if (cells.length >= 5) {
        cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        for (let i = 0; i <= cells.length - 5; i++) {
          const slice = cells.slice(i, i + 5);
          const hasCenter = slice.some((c) => c[0] === row && c[1] === col);
          if (hasCenter) {
            return {
              cells: slice.map((c) => ({ row: c[0], col: c[1] })),
              direction: [dr, dc],
            };
          }
        }
      }
    }
    return null;
  };

  const isBoardFull = () => {
    const board = boardRef.current;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === EMPTY) return false;
      }
    }
    return true;
  };

  // ---- 落子与动画触发 ----
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
    const key = `${row},${col}`;
    pieceAnimationsRef.current[key] = {
      type: "place",
      progress: 0,
      duration: 150,
      startTime: performance.now(),
      onComplete,
    };
  };

  const animatePieceRemove = (row: number, col: number, onComplete?: () => void) => {
    const key = `${row},${col}`;
    pieceAnimationsRef.current[key] = {
      type: "remove",
      progress: 0,
      duration: 200,
      startTime: performance.now(),
      onComplete,
    };
  };

  const animateVictory = (winCells: { row: number; col: number }[]) => {
    victoryAnimDataRef.current = {
      active: true,
      startTime: performance.now(),
      flashCells: winCells,
      flashPhase: -1,
      flashStartTime: performance.now(),
      sweepProgress: 0,
      totalDuration: winCells.length * 100 + 200 + 700 + 300,
    };
  };

  // ---- 动画队列辅助 ----
  const isAnimating = () => {
    return (
      Object.keys(pieceAnimationsRef.current).length > 0 ||
      (victoryAnimDataRef.current?.active && victoryAnimDataRef.current.sweepProgress < 1) ||
      animationQueueRef.current.length > 0
    );
  };

  const waitForAnimations = (callback: () => void) => {
    if (!isAnimating()) {
      callback();
    } else {
      animationQueueRef.current.push(callback);
    }
  };

  // ---- 玩家操作 ----
  const handlePlayerMove = (row: number, col: number) => {
    if (
      gameOverRef.current ||
      isAiThinkingRef.current ||
      animatingRef.current ||
      currentPlayerRef.current !== BLACK
    )
      return;
    if (boardRef.current[row][col] !== EMPTY) return;
    if (isAnimating()) return;

    animatingRef.current = true;
    placePiece(row, col, BLACK);
    animatePiecePlace(row, col, () => {
      animatingRef.current = false;
    });

    const winResult = checkWinAt(row, col, BLACK);
    if (winResult) {
      gameOverRef.current = true;
      winnerRef.current = BLACK;
      winLineRef.current = winResult;
      updateStatusDisplay();
      waitForAnimations(() => animateVictory(winResult.cells));
      return;
    }
    if (isBoardFull()) {
      gameOverRef.current = true;
      winnerRef.current = null;
      winLineRef.current = null;
      updateStatusDisplay();
      return;
    }

    // 切换至 AI
    currentPlayerRef.current = WHITE;
    updateStatusDisplay();
    setIsBoardDimmed(true);
    setShowOverlay(true);
    isAiThinkingRef.current = true;

    // 异步 AI 计算
    computeAiMoveAsync().then((aiMove) => {
      isAiThinkingRef.current = false;
      setIsBoardDimmed(false);
      setShowOverlay(false);
      if (!aiMove || gameOverRef.current) {
        updateStatusDisplay();
        return;
      }
      waitForAnimations(() => {
        animatingRef.current = true;
        placePiece(aiMove.row, aiMove.col, WHITE);
        animatePiecePlace(aiMove.row, aiMove.col, () => {
          animatingRef.current = false;
        });
        const aiWin = checkWinAt(aiMove.row, aiMove.col, WHITE);
        if (aiWin) {
          gameOverRef.current = true;
          winnerRef.current = WHITE;
          winLineRef.current = aiWin;
          updateStatusDisplay();
          waitForAnimations(() => animateVictory(aiWin.cells));
          return;
        }
        if (isBoardFull()) {
          gameOverRef.current = true;
          winnerRef.current = null;
          winLineRef.current = null;
          updateStatusDisplay();
          return;
        }
        currentPlayerRef.current = BLACK;
        updateStatusDisplay();
      });
    });
  };

  // ---- AI 异步包装 ----
  const computeAiMoveAsync = (): Promise<Move | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const move = computeAiMove();
        resolve(move);
      }, 80);
    });
  };

  // ---- AI 核心算法 (Minimax + Alpha-Beta + 启发式评估) ----
  const computeAiMove = (): Move | null => {
    transpositionTableRef.current = new Map();
    aiSearchStartTimeRef.current = performance.now();
    aiTimedOutRef.current = false;
    aiBestMoveRef.current = null;

    const candidates = generateCandidateMoves(WHITE);
    if (candidates.length === 0) return { row: 7, col: 7, player: WHITE };
    if (candidates.length === 1) return { ...candidates[0], player: WHITE };

    const scoredCandidates = candidates.map((m) => ({
      move: m,
      score: quickEvaluate(m.row, m.col, WHITE),
    }));
    scoredCandidates.sort((a, b) => b.score - a.score);

    let bestMove = { ...scoredCandidates[0].move, player: WHITE };
    let bestScore = -Infinity;
    const depth = DEPTH_MAP[difficulty] || 4;

    for (const { move } of scoredCandidates) {
      boardRef.current[move.row][move.col] = WHITE;
      const score = minimax(depth - 1, -Infinity, Infinity, false);
      boardRef.current[move.row][move.col] = EMPTY;

      if (score > bestScore) {
        bestScore = score;
        bestMove = { ...move, player: WHITE };
      }
      if (aiTimedOutRef.current) break;
    }

    return aiBestMoveRef.current || bestMove;
  };

  const minimax = (
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number => {
    // 超时检查
    if (performance.now() - aiSearchStartTimeRef.current > AI_TIME_LIMIT) {
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

    // 检查终端状态
    const lastMove = moveHistoryRef.current.length > 0 ? moveHistoryRef.current[moveHistoryRef.current.length - 1] : null;
    if (lastMove) {
      const winCheck = checkWinAt(lastMove.row, lastMove.col, lastMove.player);
      if (winCheck) {
        const score = lastMove.player === WHITE ? SCORE_FIVE + depth : -(SCORE_FIVE + depth);
        storeTT(hash, depth, score, "exact");
        return score;
      }
    }
    if (isBoardFull()) {
      storeTT(hash, depth, 0, "exact");
      return 0;
    }
    if (depth <= 0) {
      const score = evaluateBoard();
      storeTT(hash, depth, score, "exact");
      return score;
    }

    const currentPlayer = isMaximizing ? WHITE : BLACK;
    const candidates = generateCandidateMoves(currentPlayer);
    if (candidates.length === 0) {
      const score = evaluateBoard();
      storeTT(hash, depth, score, "exact");
      return score;
    }

    const scored = candidates.map((m) => ({
      move: m,
      score: quickEvaluate(m.row, m.col, currentPlayer),
    }));
    scored.sort((a, b) => (isMaximizing ? b.score - a.score : a.score - b.score));

    let bestScore = isMaximizing ? -Infinity : Infinity;
    let entryType = isMaximizing ? "upper" : "lower";

    for (const { move } of scored) {
      if (aiTimedOutRef.current) break;
      board[move.row][move.col] = currentPlayer;
      const score = minimax(depth - 1, alpha, beta, !isMaximizing);
      board[move.row][move.col] = EMPTY;

      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          if (depth === (DEPTH_MAP[difficulty] || 4) - 1) {
            aiBestMoveRef.current = { ...move, player: currentPlayer };
          }
        }
        alpha = Math.max(alpha, score);
      } else {
        bestScore = Math.min(bestScore, score);
        beta = Math.min(beta, score);
      }
      if (beta <= alpha) {
        entryType = "exact";
        break;
      }
    }

    if (isMaximizing && bestScore === -Infinity) bestScore = evaluateBoard();
    if (!isMaximizing && bestScore === Infinity) bestScore = evaluateBoard();

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

  const generateCandidateMoves = (player: number) => {
    const occupied: { row: number; col: number }[] = [];
    const board = boardRef.current;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== EMPTY) occupied.push({ row: r, col: c });
      }
    }
    if (occupied.length === 0) return [{ row: 7, col: 7 }];

    const candidateSet = new Set<number>();
    for (const { row, col } of occupied) {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (Math.abs(dr) + Math.abs(dc) > 2) continue;
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === EMPTY) {
            candidateSet.add(nr * BOARD_SIZE + nc);
          }
        }
      }
    }
    return Array.from(candidateSet).map((key) => ({
      row: Math.floor(key / BOARD_SIZE),
      col: key % BOARD_SIZE,
    }));
  };

  const quickEvaluate = (row: number, col: number, player: number) => {
    let score = 0;
    const board = boardRef.current;
    for (const [dr, dc] of DIRECTIONS) {
      let count = 1;
      let openEnds = 0;
      for (let i = 1; i <= 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++;
        else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) {
          openEnds++;
          break;
        } else break;
      }
      for (let i = 1; i <= 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) count++;
        else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) {
          openEnds++;
          break;
        } else break;
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
      let count = 1;
      let openEnds = 0;
      for (let i = 1; i <= 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) count++;
        else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) {
          openEnds++;
          break;
        } else break;
      }
      for (let i = 1; i <= 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) count++;
        else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === EMPTY) {
          openEnds++;
          break;
        } else break;
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

  const evaluateBoard = () => {
    const board = boardRef.current;
    let blackScore = 0;
    let whiteScore = 0;

    const scanWindow = (r: number, c: number, dr: number, dc: number) => {
      const cells: number[] = [];
      for (let i = 0; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) cells.push(board[nr][nc]);
        else cells.push(-1);
      }
      let bCount = 0,
        wCount = 0;
      for (const cell of cells) {
        if (cell === BLACK) bCount++;
        else if (cell === WHITE) wCount++;
      }
      if (bCount > 0 && wCount > 0) return { b: 0, w: 0 };
      if (bCount === 0 && wCount === 0) return { b: 0, w: 0 };

      const isBlack = bCount > 0;
      const count = isBlack ? bCount : wCount;
      const leftOpen = cells[0] === EMPTY;
      const rightOpen = cells[4] === EMPTY;
      const beforeR = r - dr;
      const beforeC = c - dc;
      const afterR = r + dr * 5;
      const afterC = c + dc * 5;
      const beforeOpen =
        beforeR >= 0 && beforeR < BOARD_SIZE && beforeC >= 0 && beforeC < BOARD_SIZE && board[beforeR][beforeC] === EMPTY;
      const afterOpen =
        afterR >= 0 && afterR < BOARD_SIZE && afterC >= 0 && afterC < BOARD_SIZE && board[afterR][afterC] === EMPTY;
      const totalOpen = (leftOpen ? 1 : 0) + (rightOpen ? 1 : 0) + (beforeOpen && !leftOpen ? 1 : 0) + (afterOpen && !rightOpen ? 1 : 0);
      const effectiveOpen = Math.min(2, totalOpen);

      let score = 0;
      if (count === 5) score = SCORE_FIVE;
      else if (count === 4 && effectiveOpen >= 1) score = effectiveOpen >= 2 ? SCORE_OPEN_FOUR : SCORE_RUSH_FOUR;
      else if (count === 3 && effectiveOpen >= 1) score = effectiveOpen >= 2 ? SCORE_OPEN_THREE : SCORE_SLEEP_THREE;
      else if (count === 2 && effectiveOpen >= 1) score = effectiveOpen >= 2 ? SCORE_OPEN_TWO : SCORE_SLEEP_TWO;
      else if (count === 1 && effectiveOpen >= 2) score = 1;

      return { b: isBlack ? score : 0, w: isBlack ? 0 : score };
    };

    // 扫描所有5格窗口
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - 5; c++) {
        const res = scanWindow(r, c, 0, 1);
        blackScore += res.b;
        whiteScore += res.w;
      }
    }
    for (let r = 0; r <= BOARD_SIZE - 5; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const res = scanWindow(r, c, 1, 0);
        blackScore += res.b;
        whiteScore += res.w;
      }
    }
    for (let r = 0; r <= BOARD_SIZE - 5; r++) {
      for (let c = 0; c <= BOARD_SIZE - 5; c++) {
        const res = scanWindow(r, c, 1, 1);
        blackScore += res.b;
        whiteScore += res.w;
      }
    }
    for (let r = 0; r <= BOARD_SIZE - 5; r++) {
      for (let c = 4; c < BOARD_SIZE; c++) {
        const res = scanWindow(r, c, 1, -1);
        blackScore += res.b;
        whiteScore += res.w;
      }
    }

    return whiteScore - blackScore * DEFENSE_COEFF;
  };

  // ---- 悔棋 ----
  const handleUndo = () => {
    if (gameOverRef.current || isAiThinkingRef.current || animatingRef.current || isAnimating()) return;
    const history = moveHistoryRef.current;
    if (history.length === 0) return;

    const stepsToUndo: Move[] = [];
    if (history.length >= 2 && history[history.length - 1].player === WHITE) {
      stepsToUndo.push(history[history.length - 1]);
      stepsToUndo.push(history[history.length - 2]);
    } else if (history.length >= 1) {
      stepsToUndo.push(history[history.length - 1]);
    }

    animatingRef.current = true;
    let completed = 0;
    const total = stepsToUndo.length;

    for (const step of stepsToUndo) {
      const move = undoLastMove();
      if (move) {
        animatePieceRemove(move.row, move.col, () => {
          completed++;
          if (completed >= total) {
            currentPlayerRef.current = BLACK;
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
    if (isAnimating() && !gameOverRef.current) return;
    pieceAnimationsRef.current = {};
    victoryAnimDataRef.current = null;
    animationQueueRef.current = [];
    animatingRef.current = false;
    resetGame();
    // 入场动画重新播放
    boardEntranceProgressRef.current = 0;
    boardEntranceDoneRef.current = false;
    starPointOpacityRef.current = 0;
  };

  // ---- 难度切换 ----
  const handleDifficultyChange = (diff: string) => {
    if (difficulty === diff) return;
    setDifficulty(diff);
    pieceAnimationsRef.current = {};
    victoryAnimDataRef.current = null;
    animationQueueRef.current = [];
    animatingRef.current = false;
    resetGame();
    boardEntranceProgressRef.current = 0;
    boardEntranceDoneRef.current = false;
    starPointOpacityRef.current = 0;
  };

  // ---- Canvas 绘制 (动画循环) ----
  const getPixelPos = (row: number, col: number) => ({
    x: PADDING + col * CELL_SIZE,
    y: PADDING + row * CELL_SIZE,
  });

  const getBoardPos = (mx: number, my: number) => {
    const col = Math.round((mx - PADDING) / CELL_SIZE);
    const row = Math.round((my - PADDING) / CELL_SIZE);
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
    const pos = getPixelPos(row, col);
    const dist = Math.hypot(mx - pos.x, my - pos.y);
    if (dist < CELL_SIZE * 0.42) return { row, col };
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
      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;
      ctx.translate(cx, cy);
      ctx.scale(entranceScale, entranceScale);
      ctx.translate(-cx, -cy);
      ctx.globalAlpha = entranceAlpha;
    }

    // 背景棋盘
    const boardRectX = PADDING - CELL_SIZE * 0.6;
    const boardRectY = PADDING - CELL_SIZE * 0.6;
    const boardRectW = (BOARD_SIZE - 1) * CELL_SIZE + CELL_SIZE * 1.2;
    const boardRectH = (BOARD_SIZE - 1) * CELL_SIZE + CELL_SIZE * 1.2;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    (ctx as any).roundRect(boardRectX + 4, boardRectY + 4, boardRectW, boardRectH, 8);
    ctx.fill();

    const bgColor1 = darkMode ? "#1e1e3c" : "#1a1a35";
    const bgColor2 = darkMode ? "#252545" : "#1e1e3c";
    const grad = ctx.createLinearGradient(boardRectX, boardRectY, boardRectX + boardRectW, boardRectY + boardRectH);
    grad.addColorStop(0, bgColor1);
    grad.addColorStop(0.5, bgColor2);
    grad.addColorStop(1, darkMode ? "#1a1a35" : "#181830");
    ctx.fillStyle = grad;
    ctx.beginPath();
    (ctx as any).roundRect(boardRectX, boardRectY, boardRectW, boardRectH, 8);
    ctx.fill();

    ctx.strokeStyle = darkMode ? "rgba(100,180,255,0.4)" : "rgba(100,180,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    (ctx as any).roundRect(boardRectX, boardRectY, boardRectW, boardRectH, 8);
    ctx.stroke();

    // 网格线
    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = PADDING + i * CELL_SIZE;
      const progress = boardEntranceDoneRef.current
        ? 1
        : Math.max(0, Math.min(1, (boardEntranceProgressRef.current - 0.1 * Math.abs(i - 7) / 7) * 1.4));
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
      ? starPointOpacityRef.current
      : Math.max(0, (boardEntranceProgressRef.current - 0.4) * 1.8);
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

    // 绘制胜利光线
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
        let scale = 1;
        let alpha = 1;
        let glow = 0;
        let rotation = 0;

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

        // 胜利闪烁
        if (victoryAnimDataRef.current?.active && winLineRef.current) {
          const cellIdx = victoryAnimDataRef.current.flashCells.findIndex(
            (fc) => fc.row === r && fc.col === c
          );
          if (cellIdx >= 0 && cellIdx <= victoryAnimDataRef.current.flashPhase) {
            glow = Math.max(glow, 1.2);
          }
        }

        if (alpha <= 0.01 && scale <= 0.01) continue;
        drawPiece(ctx, r, c, cell, scale, alpha, glow, rotation);
      }
    }

    // 悬停预览
    if (
      hoverPosRef.current &&
      !gameOverRef.current &&
      !isAiThinkingRef.current &&
      !animatingRef.current &&
      currentPlayerRef.current === BLACK &&
      board[hoverPosRef.current.row][hoverPosRef.current.col] === EMPTY
    ) {
      const hp = hoverPosRef.current;
      const pos = getPixelPos(hp.row, hp.col);
      const breatheAlpha = 0.35 + 0.15 * Math.sin(Date.now() / 600);
      const pulseScale = 1 + 0.04 * Math.sin(Date.now() / 500);
      drawPieceAt(ctx, pos.x, pos.y, BLACK, pulseScale, breatheAlpha, 0.15, 0);
    }
  }, [darkMode]);

  const drawPiece = (
    ctx: CanvasRenderingContext2D,
    row: number,
    col: number,
    player: number,
    scale: number,
    alpha: number,
    glow: number,
    rotation: number
  ) => {
    const pos = getPixelPos(row, col);
    drawPieceAt(ctx, pos.x, pos.y, player, scale, alpha, glow, rotation);
  };

  const drawPieceAt = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    player: number,
    scale: number,
    alpha: number,
    glow: number,
    rotation: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    const radius = CELL_SIZE * 0.44;

    if (glow > 0.01) {
      const glowRadius = radius * 1.7;
      const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, glowRadius);
      if (player === BLACK) {
        glowGrad.addColorStop(0, `rgba(255,255,255,${0.35 * glow})`);
        glowGrad.addColorStop(0.5, `rgba(180,200,255,${0.18 * glow})`);
        glowGrad.addColorStop(1, "rgba(100,150,255,0)");
      } else {
        glowGrad.addColorStop(0, `rgba(255,255,255,${0.5 * glow})`);
        glowGrad.addColorStop(0.5, `rgba(255,220,180,${0.22 * glow})`);
        glowGrad.addColorStop(1, "rgba(255,200,100,0)");
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(1.5, 2, radius, 0, Math.PI * 2);
    ctx.fill();

    const pieceGrad = ctx.createRadialGradient(-radius * 0.25, -radius * 0.35, radius * 0.08, 0, 0, radius);
    if (player === BLACK) {
      pieceGrad.addColorStop(0, "#707080");
      pieceGrad.addColorStop(0.4, "#3a3a48");
      pieceGrad.addColorStop(0.75, "#1a1a24");
      pieceGrad.addColorStop(1, "#0a0a12");
    } else {
      pieceGrad.addColorStop(0, "#ffffff");
      pieceGrad.addColorStop(0.3, "#f0f0f5");
      pieceGrad.addColorStop(0.6, "#d8d8e2");
      pieceGrad.addColorStop(0.85, "#b8b8c8");
      pieceGrad.addColorStop(1, "#9090a0");
    }
    ctx.fillStyle = pieceGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    const highlight = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.04, -radius * 0.1, -radius * 0.15, radius * 0.55);
    if (player === BLACK) {
      highlight.addColorStop(0, "rgba(255,255,255,0.45)");
      highlight.addColorStop(0.5, "rgba(255,255,255,0.1)");
      highlight.addColorStop(1, "rgba(255,255,255,0)");
    } else {
      highlight.addColorStop(0, "rgba(255,255,255,0.8)");
      highlight.addColorStop(0.4, "rgba(255,255,255,0.25)");
      highlight.addColorStop(1, "rgba(255,255,255,0)");
    }
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
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
        const glowGrad = ctx.createRadialGradient(cp.x, cp.y, CELL_SIZE * 0.3, cp.x, cp.y, CELL_SIZE * 0.9);
        glowGrad.addColorStop(0, `rgba(255,220,100,${0.85 * glowIntensity})`);
        glowGrad.addColorStop(0.5, `rgba(255,180,60,${0.5 * glowIntensity})`);
        glowGrad.addColorStop(1, "rgba(255,150,30,0)");
        ctx.fillStyle = glowGrad;
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
      const beamGrad = ctx.createRadialGradient(lx, ly, 1, lx, ly, CELL_SIZE * 0.7);
      beamGrad.addColorStop(0, "rgba(255,255,220,0.9)");
      beamGrad.addColorStop(0.3, "rgba(255,200,100,0.6)");
      beamGrad.addColorStop(1, "rgba(255,150,50,0)");
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.arc(lx, ly, CELL_SIZE * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // ---- 动画循环更新 ----
  const updateAnimations = (dt: number, timestamp: number) => {
    // 入场动画
    if (!boardEntranceDoneRef.current && boardEntranceProgressRef.current < 1) {
      boardEntranceProgressRef.current = Math.min(1, boardEntranceProgressRef.current + dt / 700);
      starPointOpacityRef.current = Math.max(0, Math.min(1, (boardEntranceProgressRef.current - 0.35) * 2.2));
      if (boardEntranceProgressRef.current >= 1) {
        boardEntranceDoneRef.current = true;
        starPointOpacityRef.current = 1;
      }
    }

    // 棋子动画
    const pieces = pieceAnimationsRef.current;
    const keysToRemove: string[] = [];
    for (const [key, anim] of Object.entries(pieces)) {
      anim.progress += dt / anim.duration;
      if (anim.progress >= 1) {
        anim.progress = 1;
        if (anim.onComplete) {
          anim.onComplete();
          anim.onComplete = undefined;
        }
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) delete pieces[key];

    // 胜利动画
    const vict = victoryAnimDataRef.current;
    if (vict && vict.active) {
      const elapsed = timestamp - vict.startTime;
      if (vict.flashPhase < vict.flashCells.length) {
        const flashElapsed = elapsed - vict.flashStartTime;
        const newPhase = Math.min(Math.floor(flashElapsed / 100), vict.flashCells.length);
        if (newPhase > vict.flashPhase) vict.flashPhase = newPhase;
      }
      const sweepDelay = vict.flashCells.length * 100 + 200;
      if (elapsed > sweepDelay) {
        vict.sweepProgress = Math.min(1, (elapsed - sweepDelay) / 700);
      }
      if (elapsed > vict.totalDuration) vict.sweepProgress = 1;
    }

    // 处理队列
    if (
      animationQueueRef.current.length > 0 &&
      Object.keys(pieces).length === 0 &&
      !(vict && vict.active && vict.sweepProgress < 1)
    ) {
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
    resetGame(true);
    boardEntranceProgressRef.current = 0;
    boardEntranceDoneRef.current = false;
    starPointOpacityRef.current = 0;

    let lastTime = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.min(timestamp - lastTime, 50);
      lastTime = timestamp;
      updateAnimations(dt, timestamp);
      drawBoard();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawBoard]);

  // ---- 事件处理 ----
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
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
    if (
      pos &&
      boardRef.current[pos.row][pos.col] === EMPTY &&
      !gameOverRef.current &&
      !isAiThinkingRef.current &&
      currentPlayerRef.current === BLACK &&
      !animatingRef.current
    ) {
      hoverPosRef.current = pos;
    } else {
      hoverPosRef.current = null;
    }
  };

  const handleCanvasMouseLeave = () => {
    hoverPosRef.current = null;
  };

  // 触摸事件（移动端）
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
    if (
      pos &&
      boardRef.current[pos.row][pos.col] === EMPTY &&
      !gameOverRef.current &&
      !isAiThinkingRef.current &&
      currentPlayerRef.current === BLACK &&
      !animatingRef.current
    ) {
      hoverPosRef.current = pos;
    } else {
      hoverPosRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    hoverPosRef.current = null;
  };

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        handleRestart();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ---- UI 渲染 ----
  return (
    <div className="w-[70%] mx-auto py-8 px-4 max-md:w-[95%]">
      <BackButton />
      <div className="flex flex-col items-center gap-4 mt-6">
        {/* 状态栏 */}
        <div
          className={`w-full p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-500
            bg-white/10 border-white/20 dark:bg-black/20 dark:border-white/10
            ${statusAnimClass === "player-turn" ? "ring-2 ring-cyan-400/30" : ""}
            ${statusAnimClass === "ai-thinking" ? "ring-2 ring-amber-400/30" : ""}
            ${statusAnimClass === "victory" ? "ring-2 ring-yellow-400/40" : ""}
          `}
        >
          <div className="flex items-center justify-center gap-3">
            <span
              className={`text-3xl transition-transform duration-300 ${statusAnimClass ? "animate-flip" : ""
                }`}
            >
              {statusIcon}
            </span>
            <span
              className={`text-lg font-semibold tracking-wide transition-colors duration-500
                text-gray-200 dark:text-gray-100
                ${statusAnimClass === "player-turn" ? "text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]" : ""}
                ${statusAnimClass === "ai-thinking" ? "text-cyan-300 animate-pulse" : ""}
                ${statusAnimClass === "victory" ? "text-yellow-300 animate-bounce-in" : ""}
                ${statusAnimClass === "defeat" ? "text-pink-400" : ""}
                ${statusAnimClass === "draw-text" ? "text-gray-400" : ""}
              `}
            >
              {statusText}
            </span>
          </div>
        </div>

        {/* 棋盘区域 */}
        <div
          ref={boardWrapperRef}
          className={`relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,200,255,0.2)] transition-all duration-500
            ${isBoardDimmed ? "brightness-50 saturate-50" : ""}
          `}
        >
          <canvas
            ref={canvasRef}
            className="block cursor-pointer rounded-2xl"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          {showOverlay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_20px_rgba(0,229,255,0.6)]" />
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(0,229,255,0.7)]"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 控制面板 */}
        <div className="w-full p-4 flex flex-wrap gap-3 justify-center rounded-2xl border backdrop-blur-xl bg-white/5 border-white/15 dark:bg-black/20 dark:border-white/10 shadow-2xl">
          <button
            onClick={handleRestart}
            className="px-5 py-2.5 rounded-full font-semibold text-sm border transition-all duration-200 bg-amber-500/10 border-amber-400/40 text-amber-200 hover:bg-amber-500/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95"
          >
            🔄 重新开始
          </button>
          <button
            onClick={handleUndo}
            className="px-5 py-2.5 rounded-full font-semibold text-sm border transition-all duration-200 bg-pink-500/10 border-pink-400/40 text-pink-200 hover:bg-pink-500/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/20 active:scale-95"
          >
            ↩ 悔棋
          </button>
          {["easy", "medium", "hard"].map((diff) => (
            <button
              key={diff}
              onClick={() => handleDifficultyChange(diff)}
              className={`px-5 py-2.5 rounded-full font-semibold text-sm border transition-all duration-200 ${difficulty === diff ? "bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,229,255,0.4)]" : "bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-cyan-400/40"} hover:-translate-y-1 active:scale-95`}
            >
              {diff === "easy" ? "🟢 简单" : diff === "medium" ? "🟡 中等" : "🔴 困难"}
            </button>
          ))}
        </div>
      </div>

      {/* 自定义关键帧动画 */}
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
        .animate-flip {
          animation: flip 0.5s ease-in-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}