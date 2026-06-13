"use client";

import { useEffect, useRef } from "react";
import BackButton from "@/app/_components/article/BackButton";

export default function Game2048Page() {
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    const initGame = (container: HTMLElement) => {
      // ----- 获取容器内的 DOM 元素 -----
      const gridBackground = container.querySelector<HTMLElement>("#gridBackground");
      const tileLayer = container.querySelector<HTMLElement>("#tileLayer");
      const scoreDisplay = container.querySelector<HTMLElement>("#scoreDisplay");
      const bestScoreDisplay = container.querySelector<HTMLElement>("#bestScoreDisplay");
      const btnNewGame = container.querySelector<HTMLElement>("#btnNewGame");
      const btnExport = container.querySelector<HTMLElement>("#btnExport");
      const btnImport = container.querySelector<HTMLElement>("#btnImport");
      const importFileInput = container.querySelector<HTMLInputElement>("#importFileInput");
      const modalOverlay = container.querySelector<HTMLElement>("#modalOverlay");
      const modalEmoji = container.querySelector<HTMLElement>("#modalEmoji");
      const modalTitle = container.querySelector<HTMLElement>("#modalTitle");
      const modalMessage = container.querySelector<HTMLElement>("#modalMessage");
      const modalButtons = container.querySelector<HTMLElement>("#modalButtons");
      const gameBoardContainer = container.querySelector<HTMLElement>("#gameBoardContainer");

      if (
        !gridBackground || !tileLayer || !scoreDisplay || !bestScoreDisplay ||
        !btnNewGame || !btnExport || !btnImport || !importFileInput ||
        !modalOverlay || !modalEmoji || !modalTitle || !modalMessage ||
        !modalButtons || !gameBoardContainer
      ) {
        console.error("2048 游戏初始化失败：缺少必要的 DOM 元素");
        return;
      }

      // ----- 游戏常量 -----
      const GRID_SIZE = 4;
      const ANIMATION_DURATION = 150;
      const NEW_TILE_PROB_2 = 0.9;
      const WIN_VALUE = 2048;

      // ----- 游戏状态 -----
      let grid: (number | null)[][] = [];
      let tileDataMap = new Map<number, { id: number; value: number; row: number; col: number; isNew?: boolean; mergedFrom?: [number, number] | null }>();
      let tileElementMap = new Map<number, HTMLElement>();
      let nextTileId = 1;
      let score = 0;
      let bestScore = 0;
      let hasWon = false;
      let isGameOver = false;
      let isMoving = false;
      let moveTimeoutId: ReturnType<typeof setTimeout> | null = null;

      // 具名函数引用，用于解绑事件
      const onNewGame = () => newGame();
      const onExport = () => exportSave();
      const onImport = () => importFileInput.click();
      const onFileChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          importSave(target.files[0]);
          target.value = "";
        }
      };

      // ----- 工具函数 -----
      const getLayoutParams = () => {
        const style = getComputedStyle(document.documentElement);
        const cellSize = parseInt(style.getPropertyValue("--cell-size").trim()) || 100;
        const gap = parseInt(style.getPropertyValue("--gap").trim()) || 12;
        return { cellSize, gap };
      };

      const getTilePosition = (row: number, col: number) => {
        const { cellSize, gap } = getLayoutParams();
        return { left: col * (cellSize + gap), top: row * (cellSize + gap), size: cellSize };
      };

      // ----- 初始化背景网格 -----
      if (gridBackground.children.length !== GRID_SIZE * GRID_SIZE) {
        gridBackground.innerHTML = "";
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
          const cell = document.createElement("div");
          cell.className = "grid-cell";
          gridBackground.appendChild(cell);
        }
      }

      // ----- UI 更新 -----
      const updateScoreDisplay = () => {
        scoreDisplay.textContent = String(score);
        bestScoreDisplay.textContent = String(bestScore);
      };

      const saveBestScore = () => {
        try {
          localStorage.setItem("2048_bestScore", String(bestScore));
        } catch (e) { }
      };

      const loadBestScore = () => {
        try {
          const saved = localStorage.getItem("2048_bestScore");
          if (saved !== null) {
            const val = parseInt(saved, 10);
            if (!isNaN(val) && val >= 0) bestScore = val;
          }
        } catch (e) { }
      };

      const animateScorePop = () => {
        scoreDisplay.classList.remove("pop");
        void scoreDisplay.offsetWidth;
        scoreDisplay.classList.add("pop");
        setTimeout(() => scoreDisplay.classList.remove("pop"), 420);
      };

      const animateBestScore = () => {
        bestScoreDisplay.classList.remove("pop");
        void bestScoreDisplay.offsetWidth;
        bestScoreDisplay.classList.add("pop");
        setTimeout(() => bestScoreDisplay.classList.remove("pop"), 420);
      };

      // ----- 方块逻辑 -----
      const createTileElement = (data: { value: number; row: number; col: number }) => {
        const el = document.createElement("div");
        el.className = "tile";
        el.setAttribute("data-value", String(data.value));
        el.textContent = String(data.value);
        const { left, top, size } = getTilePosition(data.row, data.col);
        el.style.left = left + "px";
        el.style.top = top + "px";
        el.style.width = size + "px";
        el.style.height = size + "px";
        if (data.value > 65536) el.classList.add("super-large");
        return el;
      };

      const renderAllTiles = () => {
        tileLayer.innerHTML = "";
        tileElementMap.clear();
        const fragment = document.createDocumentFragment();
        for (const [id, data] of tileDataMap) {
          const el = createTileElement(data);
          tileElementMap.set(id, el);
          fragment.appendChild(el);
        }
        tileLayer.appendChild(fragment);
        requestAnimationFrame(() => {
          for (const [id, data] of tileDataMap) {
            if (data.isNew) {
              const el = tileElementMap.get(id);
              if (el) {
                el.classList.add("new-tile");
                setTimeout(() => el.classList.remove("new-tile"), 260);
              }
              data.isNew = false;
            }
          }
        });
      };

      const spawnRandomTile = () => {
        const emptyCells: { row: number; col: number }[] = [];
        for (let r = 0; r < GRID_SIZE; r++)
          for (let c = 0; c < GRID_SIZE; c++)
            if (grid[r][c] === null) emptyCells.push({ row: r, col: c });
        if (emptyCells.length === 0) return null;
        const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < NEW_TILE_PROB_2 ? 2 : 4;
        const id = nextTileId++;
        grid[row][col] = id;
        tileDataMap.set(id, { id, value, row, col, isNew: true, mergedFrom: null });
        return { id, row, col, value };
      };

      const serializeGrid = () => {
        const arr: string[] = [];
        for (let r = 0; r < GRID_SIZE; r++)
          for (let c = 0; c < GRID_SIZE; c++) {
            const tid = grid[r][c];
            arr.push(tid === null ? "0" : String(tileDataMap.get(tid)?.value ?? "0"));
          }
        return arr.join(",");
      };

      const getVectorsForDirection = (direction: string) => {
        const vectors: { row: number; col: number }[][] = [];
        if (direction === "left") {
          for (let r = 0; r < GRID_SIZE; r++) {
            const vec = [];
            for (let c = 0; c < GRID_SIZE; c++) vec.push({ row: r, col: c });
            vectors.push(vec);
          }
        } else if (direction === "right") {
          for (let r = 0; r < GRID_SIZE; r++) {
            const vec = [];
            for (let c = GRID_SIZE - 1; c >= 0; c--) vec.push({ row: r, col: c });
            vectors.push(vec);
          }
        } else if (direction === "up") {
          for (let c = 0; c < GRID_SIZE; c++) {
            const vec = [];
            for (let r = 0; r < GRID_SIZE; r++) vec.push({ row: r, col: c });
            vectors.push(vec);
          }
        } else if (direction === "down") {
          for (let c = 0; c < GRID_SIZE; c++) {
            const vec = [];
            for (let r = GRID_SIZE - 1; r >= 0; r--) vec.push({ row: r, col: c });
            vectors.push(vec);
          }
        }
        return vectors;
      };

      const compressAndMerge = (
        lineTiles: { id: number; value: number; origRow: number; origCol: number }[],
        _vec: { row: number; col: number }[]
      ) => {
        let scoreGain = 0;
        const work = lineTiles.map((t) => ({ ...t, mergedFrom: null as [number, number] | null }));
        const result: { id: number | null; value: number; mergedFrom: [number, number] | null }[] = [];
        let i = 0;
        const merged = new Set<number>();
        while (i < work.length) {
          if (i < work.length - 1 && work[i].value === work[i + 1].value && !merged.has(i) && !merged.has(i + 1)) {
            const newValue = work[i].value * 2;
            scoreGain += newValue;
            result.push({ id: null, value: newValue, mergedFrom: [work[i].id, work[i + 1].id] });
            merged.add(i); merged.add(i + 1);
            i += 2;
          } else {
            result.push({ id: work[i].id, value: work[i].value, mergedFrom: null });
            i += 1;
          }
        }
        return { tiles: result, scoreGain };
      };

      const executeMove = (direction: string) => {
        const beforeSnapshot = serializeGrid();
        const moves: { tileId: number; fromRow: number; fromCol: number; toRow: number; toCol: number }[] = [];
        const merges: { tileId1: number; tileId2: number; mergedId: number; value: number; row: number; col: number }[] = [];
        const removedTileIds = new Set<number>();
        let moveScoreGain = 0;

        const vectors = getVectorsForDirection(direction);
        for (const vec of vectors) {
          const lineTiles: { id: number; value: number; origRow: number; origCol: number }[] = [];
          for (const { row, col } of vec) {
            const tileId = grid[row][col];
            if (tileId !== null) {
              const tileData = tileDataMap.get(tileId)!;
              lineTiles.push({ id: tileId, value: tileData.value, origRow: row, origCol: col });
            }
          }
          if (lineTiles.length === 0) continue;

          const result = compressAndMerge(lineTiles, vec);
          moveScoreGain += result.scoreGain;

          for (const { row, col } of vec) grid[row][col] = null;
          for (let i = 0; i < result.tiles.length; i++) {
            const t = result.tiles[i];
            const targetPos = vec[i];
            if (t.mergedFrom) {
              const newId = nextTileId++;
              grid[targetPos.row][targetPos.col] = newId;
              tileDataMap.set(newId, { id: newId, value: t.value, row: targetPos.row, col: targetPos.col, isNew: false, mergedFrom: t.mergedFrom });
              merges.push({ tileId1: t.mergedFrom[0], tileId2: t.mergedFrom[1], mergedId: newId, value: t.value, row: targetPos.row, col: targetPos.col });
              removedTileIds.add(t.mergedFrom[0]); removedTileIds.add(t.mergedFrom[1]);
            } else if (t.id) {
              grid[targetPos.row][targetPos.col] = t.id;
              const tileData = tileDataMap.get(t.id)!;
              if (tileData.row !== targetPos.row || tileData.col !== targetPos.col) {
                moves.push({ tileId: t.id, fromRow: tileData.row, fromCol: tileData.col, toRow: targetPos.row, toCol: targetPos.col });
                tileData.row = targetPos.row; tileData.col = targetPos.col;
              }
            }
          }
        }
        for (const tid of removedTileIds) tileDataMap.delete(tid);

        if (moveScoreGain > 0) {
          score += moveScoreGain;
          updateScoreDisplay();
          if (score > bestScore) {
            bestScore = score;
            saveBestScore();
            updateScoreDisplay();
            animateBestScore();
          }
        }

        const afterSnapshot = serializeGrid();
        const hasChanged = beforeSnapshot !== afterSnapshot;
        if (hasChanged) {
          const newTileInfo = spawnRandomTile();
          renderAfterMove(moves, merges, removedTileIds, newTileInfo);
        }
        return hasChanged;
      };

      const renderAfterMove = (
        moves: { tileId: number; fromRow: number; fromCol: number; toRow: number; toCol: number }[],
        merges: { tileId1: number; tileId2: number; mergedId: number; value: number; row: number; col: number }[],
        removedTileIds: Set<number>,
        newTileInfo: { id: number; row: number; col: number; value: number } | null
      ) => {
        for (const [id, el] of tileElementMap) {
          if (removedTileIds.has(id)) continue;
          const data = tileDataMap.get(id);
          if (data) {
            const { left, top, size } = getTilePosition(data.row, data.col);
            el.style.left = left + "px";
            el.style.top = top + "px";
            el.style.width = size + "px";
            el.style.height = size + "px";
          }
        }
        for (const merge of merges) {
          const el1 = tileElementMap.get(merge.tileId1);
          const el2 = tileElementMap.get(merge.tileId2);
          const { left, top, size } = getTilePosition(merge.row, merge.col);
          if (el1) {
            el1.style.left = left + "px"; el1.style.top = top + "px";
            el1.style.width = size + "px"; el1.style.height = size + "px";
            el1.style.opacity = "0"; el1.style.zIndex = "3";
            el1.style.transition = "left 0.12s ease, top 0.12s ease, opacity 0.08s ease 0.08s, transform 0.1s ease";
          }
          if (el2) {
            el2.style.left = left + "px"; el2.style.top = top + "px";
            el2.style.width = size + "px"; el2.style.height = size + "px";
            el2.style.opacity = "0"; el2.style.zIndex = "3";
            el2.style.transition = "left 0.12s ease, top 0.12s ease, opacity 0.08s ease 0.08s, transform 0.1s ease";
          }
        }
        setTimeout(() => {
          for (const tid of removedTileIds) {
            const el = tileElementMap.get(tid);
            if (el) { el.remove(); tileElementMap.delete(tid); }
          }
          for (const merge of merges) {
            const data = tileDataMap.get(merge.mergedId);
            if (data) {
              const el = createTileElement(data);
              el.classList.add("merging");
              tileElementMap.set(merge.mergedId, el);
              tileLayer.appendChild(el);
              setTimeout(() => el.classList.remove("merging"), 220);
            }
          }
          if (newTileInfo && newTileInfo.id) {
            const data = tileDataMap.get(newTileInfo.id);
            if (data) {
              const el = createTileElement(data);
              el.classList.add("new-tile");
              tileElementMap.set(newTileInfo.id, el);
              tileLayer.appendChild(el);
              setTimeout(() => { el.classList.remove("new-tile"); if (data) data.isNew = false; }, 260);
            }
          }
        }, 100);
        if (merges.length > 0) animateScorePop();
      };

      const checkWin = () => {
        if (hasWon) return false;
        for (const [, data] of tileDataMap) if (data.value >= WIN_VALUE) return true;
        return false;
      };

      const checkLose = () => {
        for (let r = 0; r < GRID_SIZE; r++)
          for (let c = 0; c < GRID_SIZE; c++)
            if (grid[r][c] === null) return false;
        for (let r = 0; r < GRID_SIZE; r++)
          for (let c = 0; c < GRID_SIZE - 1; c++) {
            const v1 = tileDataMap.get(grid[r][c]!)?.value;
            const v2 = tileDataMap.get(grid[r][c + 1]!)?.value;
            if (v1 === v2) return false;
          }
        for (let r = 0; r < GRID_SIZE - 1; r++)
          for (let c = 0; c < GRID_SIZE; c++) {
            const v1 = tileDataMap.get(grid[r][c]!)?.value;
            const v2 = tileDataMap.get(grid[r + 1][c]!)?.value;
            if (v1 === v2) return false;
          }
        return true;
      };

      const hideModal = () => {
        modalOverlay.style.display = "none";
        // 清除弹窗内容，自动解绑内部按钮事件
        modalButtons.innerHTML = "";
      };

      const showWinModal = () => {
        modalEmoji.textContent = "🎉";
        modalTitle.textContent = "恭喜获胜！";
        modalMessage.textContent = "你成功拼出了 2048！\n太厉害了！是否继续挑战更高分数？";
        modalButtons.innerHTML = `
          <button class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95" id="btnContinue">🚀 继续游戏</button>
          <button class="px-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95" id="btnModalNewGame">🔄 新游戏</button>
        `;
        modalOverlay.style.display = "flex";
        const btnContinue = document.getElementById("btnContinue");
        const btnModalNewGame = document.getElementById("btnModalNewGame");
        btnContinue?.addEventListener("click", () => {
          hasWon = true;
          hideModal();
          gameBoardContainer.focus();
        });
        btnModalNewGame?.addEventListener("click", () => {
          hideModal();
          newGame();
        });
      };

      const showLoseModal = () => {
        modalEmoji.textContent = "😢";
        modalTitle.textContent = "游戏结束";
        modalMessage.textContent = "没有可用的移动了。\n别灰心，再来一局吧！";
        modalButtons.innerHTML = `
          <button class="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95" id="btnModalNewGame">🔄 新游戏</button>
          <button class="px-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95" id="btnModalClose">✕ 关闭</button>
        `;
        modalOverlay.style.display = "flex";
        const btnModalNewGame = document.getElementById("btnModalNewGame");
        const btnModalClose = document.getElementById("btnModalClose");
        btnModalNewGame?.addEventListener("click", () => {
          hideModal();
          newGame();
        });
        btnModalClose?.addEventListener("click", hideModal);
      };

      const handleMove = (direction: string) => {
        if (isMoving || isGameOver) return;
        isMoving = true;
        const hasChanged = executeMove(direction);
        if (!hasChanged) { isMoving = false; return; }
        const debounceTime = ANIMATION_DURATION + 120;
        if (moveTimeoutId) clearTimeout(moveTimeoutId);
        moveTimeoutId = setTimeout(() => {
          isMoving = false;
          moveTimeoutId = null;
          if (checkWin()) showWinModal();
          else if (checkLose()) { isGameOver = true; showLoseModal(); }
        }, debounceTime);
      };

      // ----- 导出/导入存档（修复：增加 bestScore 字段） -----
      const exportSave = () => {
        const saveData = {
          version: 1,
          grid: [] as number[][],
          score,
          bestScore,          // ✅ 保存最高分
          hasWon,
          isGameOver,
          timestamp: new Date().toISOString(),
        };
        for (let r = 0; r < GRID_SIZE; r++) {
          const row: number[] = [];
          for (let c = 0; c < GRID_SIZE; c++) {
            const tid = grid[r][c];
            row.push(tid === null ? 0 : (tileDataMap.get(tid)?.value ?? 0));
          }
          saveData.grid.push(row);
        }
        const jsonStr = JSON.stringify(saveData, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `2048-save-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("✅ 存档已导出");
      };

      const validateSaveData = (data: any) => {
        if (!data || typeof data !== "object") return false;
        if (!Array.isArray(data.grid) || data.grid.length !== GRID_SIZE) return false;
        for (const row of data.grid) {
          if (!Array.isArray(row) || row.length !== GRID_SIZE) return false;
          for (const val of row) {
            if (typeof val !== "number" || isNaN(val) || val < 0) return false;
          }
        }
        if (typeof data.score !== "number" || isNaN(data.score) || data.score < 0) return false;
        return true;
      };

      const importSave = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const saveData = JSON.parse(e.target?.result as string);
            if (!validateSaveData(saveData)) {
              showToast("❌ 存档数据格式无效，请检查文件");
              return;
            }
            // 清理当前状态
            grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
            tileDataMap.clear();
            tileElementMap.clear();
            tileLayer.innerHTML = "";
            nextTileId = 1;
            isMoving = false;
            if (moveTimeoutId) clearTimeout(moveTimeoutId);

            for (let r = 0; r < GRID_SIZE; r++) {
              for (let c = 0; c < GRID_SIZE; c++) {
                const val = saveData.grid[r][c];
                if (val > 0) {
                  const id = nextTileId++;
                  grid[r][c] = id;
                  tileDataMap.set(id, { id, value: val, row: r, col: c, isNew: false, mergedFrom: null });
                }
              }
            }
            score = saveData.score;
            // ✅ 合并最高分：取存档中的 bestScore 和当前本地最高分的较大值
            if (typeof saveData.bestScore === 'number' && saveData.bestScore > bestScore) {
              bestScore = saveData.bestScore;
            }
            if (score > bestScore) {
              bestScore = score;
            }
            saveBestScore(); // 更新 localStorage
            hasWon = saveData.hasWon || false;
            isGameOver = saveData.isGameOver || false;
            updateScoreDisplay();
            renderAllTiles();
            hideModal();
            if (isGameOver) {
              setTimeout(() => showLoseModal(), 300);
            }
            showToast("✅ 存档已成功导入");
          } catch {
            showToast("❌ 无法解析存档文件，请确认是有效的JSON文件");
          }
        };
        reader.onerror = () => showToast("❌ 读取文件失败，请重试");
        reader.readAsText(file);
      };

      const showToast = (message: string) => {
        const oldToast = document.querySelector(".toast-msg");
        if (oldToast) oldToast.remove();
        const toast = document.createElement("div");
        toast.className = "toast-msg";
        toast.textContent = message;
        toast.style.cssText = `
          position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
          background: #3c3a32; color: #f9f6f2; padding: 12px 24px; border-radius: 25px;
          font-size: 0.9rem; font-weight: 600; z-index: 2000;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
          animation: toastIn 0.35s ease forwards; pointer-events: none; white-space: nowrap;
          font-family: inherit;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.animation = "toastOut 0.3s ease forwards";
          setTimeout(() => toast.remove(), 300);
        }, 2500);
      };

      const newGame = () => {
        grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
        tileDataMap.clear();
        tileElementMap.clear();
        tileLayer.innerHTML = "";
        nextTileId = 1;
        score = 0;
        hasWon = false;
        isGameOver = false;
        isMoving = false;
        if (moveTimeoutId) clearTimeout(moveTimeoutId);
        updateScoreDisplay();
        spawnRandomTile();
        spawnRandomTile();
        renderAllTiles();
        hideModal();
        gameBoardContainer.focus();
      };

      // ----- 事件绑定（使用具名函数，以便清理时移除） -----
      const keydownHandler = (e: KeyboardEvent) => {
        if (modalOverlay.style.display === "flex") {
          if (e.key === "Escape") {
            hideModal();
            gameBoardContainer.focus();
          }
          return;
        }
        let direction: string | null = null;
        switch (e.key) {
          case "ArrowLeft": case "Left": direction = "left"; break;
          case "ArrowRight": case "Right": direction = "right"; break;
          case "ArrowUp": case "Up": direction = "up"; break;
          case "ArrowDown": case "Down": direction = "down"; break;
          default: return;
        }
        e.preventDefault();
        handleMove(direction);
      };

      document.addEventListener("keydown", keydownHandler);
      btnNewGame.addEventListener("click", onNewGame);
      btnExport.addEventListener("click", onExport);
      btnImport.addEventListener("click", onImport);
      importFileInput.addEventListener("change", onFileChange);

      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
          hideModal();
          gameBoardContainer.focus();
        }
      });

      // 触摸滑动支持
      let touchStartX = 0, touchStartY = 0;
      const SWIPE_THRESHOLD = 30;
      const touchStartHandler = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      };
      const touchEndHandler = (e: TouchEvent) => {
        if (isMoving || isGameOver) return;
        if (modalOverlay.style.display === "flex") return;
        const dx = (e.changedTouches[0]?.clientX || touchStartX) - touchStartX;
        const dy = (e.changedTouches[0]?.clientY || touchStartY) - touchStartY;
        const absDx = Math.abs(dx), absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < SWIPE_THRESHOLD) return;
        const direction = absDx > absDy ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        e.preventDefault();
        handleMove(direction);
      };
      gameBoardContainer.addEventListener("touchstart", touchStartHandler, { passive: true });
      gameBoardContainer.addEventListener("touchend", touchEndHandler);
      gameBoardContainer.setAttribute("tabindex", "0");
      gameBoardContainer.style.outline = "none";
      gameBoardContainer.addEventListener("click", () => gameBoardContainer.focus());

      // 响应式更新
      const updateSizeVariables = () => {
        const style = getComputedStyle(document.documentElement);
        const cellSize = parseInt(style.getPropertyValue("--cell-size").trim()) || 100;
        const gap = parseInt(style.getPropertyValue("--gap").trim()) || 12;
        const totalSize = 4 * cellSize + 3 * gap;
        tileLayer.style.width = totalSize + "px";
        tileLayer.style.height = totalSize + "px";
        tileLayer.style.top = style.getPropertyValue("--grid-padding").trim() || "12px";
        tileLayer.style.left = style.getPropertyValue("--grid-padding").trim() || "12px";
      };
      window.addEventListener("resize", updateSizeVariables);

      // 启动
      loadBestScore();
      updateSizeVariables();
      newGame();

      // ✅ 返回清理函数：移除所有绑定的事件监听器
      return () => {
        document.removeEventListener("keydown", keydownHandler);
        window.removeEventListener("resize", updateSizeVariables);
        gameBoardContainer.removeEventListener("touchstart", touchStartHandler);
        gameBoardContainer.removeEventListener("touchend", touchEndHandler);
        btnNewGame.removeEventListener("click", onNewGame);
        btnExport.removeEventListener("click", onExport);
        btnImport.removeEventListener("click", onImport);
        importFileInput.removeEventListener("change", onFileChange);
        if (moveTimeoutId) clearTimeout(moveTimeoutId);
        modalOverlay.style.display = "none";
      };
    };

    const cleanup = initGame(gameContainerRef.current!);
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // ==================== 渲染 JSX ====================
  return (
    <div className="w-[70%] mx-auto py-8 px-4">
      <BackButton />

      <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
        2048
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        经典数字拼图游戏，使用方向键移动方块，合并相同数字拼出 2048！
      </p>

      {/* 游戏容器 */}
      <div ref={gameContainerRef} className="flex flex-wrap gap-6 items-start justify-center w-full">
        {/* 左侧：游戏棋盘 */}
        <div className="game-board-container" id="gameBoardContainer">
          <div className="grid-background" id="gridBackground">
            {/* 16个背景单元格由 JS 动态生成 */}
          </div>
          <div className="tile-layer" id="tileLayer"></div>
        </div>

        {/* 右侧：操作面板 */}
        <div className="flex flex-col gap-4 min-w-[200px] max-w-[220px]">
          {/* 计分板 */}
          <div className="flex gap-2.5">
            <div className="flex-1 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl px-4 py-2.5 text-center">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">得分</div>
              <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white score-value" id="scoreDisplay">0</div>
            </div>
            <div className="flex-1 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl px-4 py-2.5 text-center">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">最高分</div>
              <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white score-value" id="bestScoreDisplay">0</div>
            </div>
          </div>

          {/* 按钮 - 竖向排列 */}
          <div className="flex flex-col gap-2">
            <button className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors active:scale-95" id="btnNewGame">
              🔄 新游戏
            </button>
            <button className="w-full px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95" id="btnExport">
              📤 导出存档
            </button>
            <button className="w-full px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95" id="btnImport">
              📥 导入存档
            </button>
            <input type="file" id="importFileInput" accept=".json" style={{ display: "none" }} />
          </div>

          {/* 操作说明 */}
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2.5">操作说明</h3>
            <ul>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>⌨️</span>
                <span>方向键 <span className="inline-block bg-white/60 dark:bg-slate-700/60 px-1 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-white/40 dark:border-white/10">↑↓←→</span> 移动</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>➕</span>
                <span>相同数字合并得分</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>💾</span>
                <span>存档可保存/恢复进度</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>🏆</span>
                <span>拼出 2048 获胜！</span>
              </li>
              <li className="flex items-start gap-1.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 border-b border-white/40 dark:border-white/10 last:border-none">
                <span>📱</span>
                <span>支持触摸滑动</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 弹窗遮罩 */}
        <div className="fixed inset-0 bg-black/55 z-[1000] flex items-center justify-center" id="modalOverlay" style={{ display: "none" }}>
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 text-center max-w-[380px] w-[90%]">
            <span className="text-4xl block mb-1.5" id="modalEmoji">🎉</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2" id="modalTitle">恭喜！</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed" id="modalMessage">你达到了2048！</p>
            <div className="flex gap-2 flex-wrap justify-center" id="modalButtons"></div>
          </div>
        </div>
      </div>

      {/* 游戏核心样式 */}
      <style>{`
        :root {
          --cell-size: 100px;
          --gap: 12px;
          --grid-padding: 12px;
          --tile-size: 100px;
          --grid-bg: #cbd5e1;
          --cell-bg: #f1f5f9;
        }
        .dark {
          --grid-bg: #334155;
          --cell-bg: #475569;
        }

        .game-board-container {
          position: relative;
          background: var(--grid-bg);
          border-radius: 16px;
          padding: var(--grid-padding);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          width: fit-content;
        }

        .grid-background {
          display: grid;
          grid-template-columns: repeat(4, var(--cell-size));
          grid-template-rows: repeat(4, var(--cell-size));
          gap: var(--gap);
          position: relative;
          z-index: 1;
        }
        .grid-cell {
          background: var(--cell-bg);
          border-radius: 10px;
        }

        .tile-layer {
          position: absolute;
          top: var(--grid-padding);
          left: var(--grid-padding);
          z-index: 2;
          pointer-events: none;
        }

        .tile {
          position: absolute;
          width: var(--tile-size);
          height: var(--tile-size);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 2.2rem;
          color: #475569;
          transition: left 0.15s ease, top 0.15s ease, transform 0.12s ease;
          will-change: left, top, transform;
          line-height: 1;
        }
        .tile.merging { animation: mergePop 0.2s ease forwards; z-index: 10; }
        .tile.new-tile { animation: fadeInPop 0.25s ease forwards; z-index: 5; }

        @keyframes scorePop {
          0% { transform: scale(1); }
          30% { transform: scale(1.25); color: #818cf8; }
          100% { transform: scale(1); }
        }
        @keyframes mergePop {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        @keyframes fadeInPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes toastIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastOut {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-15px); }
        }

        .score-value.pop {
          animation: scorePop 0.4s ease;
        }

        .tile[data-value="2"]   { background: #e0e7ff; color: #475569; }
        .tile[data-value="4"]   { background: #c7d2fe; color: #475569; }
        .tile[data-value="8"]   { background: #a5b4fc; color: #ffffff; }
        .tile[data-value="16"]  { background: #818cf8; color: #ffffff; }
        .tile[data-value="32"]  { background: #6366f1; color: #ffffff; }
        .tile[data-value="64"]  { background: #4f46e5; color: #ffffff; }
        .tile[data-value="128"] { background: #8b5cf6; color: #ffffff; font-size: 1.9rem; }
        .tile[data-value="256"] { background: #7c3aed; color: #ffffff; font-size: 1.9rem; }
        .tile[data-value="512"] { background: #6d28d9; color: #ffffff; font-size: 1.9rem; }
        .tile[data-value="1024"] { background: #10b981; color: #ffffff; font-size: 1.55rem; }
        .tile[data-value="2048"] { background: #34d399; color: #ffffff; font-size: 1.55rem; box-shadow: 0 0 20px rgba(52, 211, 153, 0.5); }
        .tile[data-value="4096"] { background: #f59e0b; color: #ffffff; font-size: 1.4rem; }
        .tile[data-value="8192"] { background: #d97706; color: #ffffff; font-size: 1.3rem; }
        .tile[data-value="16384"] { background: #b45309; color: #ffffff; font-size: 1.1rem; }
        .tile[data-value="32768"] { background: #78350f; color: #ffffff; font-size: 1rem; }
        .tile[data-value="65536"] { background: #451a03; color: #ffffff; font-size: 0.85rem; }
        .tile.super-large { background: #451a03; color: #ffffff; font-size: 0.9rem; }

        @media (max-width: 700px) {
          :root { --cell-size: 70px; --gap: 8px; --grid-padding: 8px; --tile-size: 70px; }
          .tile { font-size: 1.5rem; }
        }
        @media (max-width: 380px) {
          :root { --cell-size: 58px; --gap: 6px; --grid-padding: 6px; --tile-size: 58px; }
          .tile { font-size: 1.2rem; border-radius: 5px; }
        }
      `}</style>
    </div>
  );
}