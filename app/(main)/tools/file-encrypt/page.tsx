"use client";

import BackButton from "@/app/_components/article/BackButton";
import { useState, useRef, useEffect } from "react";

// ============ 加密/解密工具函数（基于 Web Crypto API）============
const ENC_SUFFIX = ".enc";
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = "SHA-256";
const AES_KEY_LENGTH = 256;
const MIN_FILE_SIZE_FOR_LOADING = 5 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = (bytes / Math.pow(k, i)).toFixed(i >= 1 ? 2 : 0);
  return `${size} ${units[i]}`;
}

function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function generateRandomBaseName() {
  const randomBytes = new Uint8Array(16);
  window.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateRandomKey() {
  const randomBytes = new Uint8Array(20);
  window.crypto.getRandomValues(randomBytes);
  let base64 = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64.substring(0, 32);
}

async function readFileAsArrayBuffer(file: File, onProgress?: (pct: number) => void) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("文件读取失败"));
    if (onProgress) {
      reader.onprogress = (e) => {
        if (e.lengthComputable && e.loaded < e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }
    reader.readAsArrayBuffer(file);
  });
}

async function deriveKey(password: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: AES_KEY_LENGTH,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptFile(fileBuffer: ArrayBuffer, password: string, aadBaseName: string, originalFileName: string) {
  const salt = new Uint8Array(SALT_LENGTH);
  const iv = new Uint8Array(IV_LENGTH);
  window.crypto.getRandomValues(salt);
  window.crypto.getRandomValues(iv);

  const cryptoKey = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(originalFileName);
  if (nameBytes.length > 65535) {
    throw new Error("原始文件名过长（超过65535字节），无法加密。");
  }
  const nameLengthBuffer = new ArrayBuffer(2);
  const nameLengthView = new DataView(nameLengthBuffer);
  nameLengthView.setUint16(0, nameBytes.length, false);

  const combinedLength = 2 + nameBytes.length + fileBuffer.byteLength;
  const combined = new Uint8Array(combinedLength);
  combined.set(new Uint8Array(nameLengthBuffer), 0);
  combined.set(nameBytes, 2);
  combined.set(new Uint8Array(fileBuffer), 2 + nameBytes.length);

  const aad = encoder.encode(aadBaseName);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
      additionalData: aad,
      tagLength: 128,
    },
    cryptoKey,
    combined.buffer
  );

  const totalLength = salt.length + iv.length + ciphertext.byteLength;
  const result = new Uint8Array(totalLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return result.buffer;
}

async function decryptFile(encryptedBuffer: ArrayBuffer, password: string, aadBaseName: string) {
  const data = new Uint8Array(encryptedBuffer);
  if (data.length < SALT_LENGTH + IV_LENGTH + 1) {
    throw new Error("文件格式错误：文件太小，不是有效的加密文件。");
  }

  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH);

  const cryptoKey = await deriveKey(password, salt);
  const encoder = new TextEncoder();
  const aad = encoder.encode(aadBaseName);

  const plaintext = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
      additionalData: aad,
      tagLength: 128,
    },
    cryptoKey,
    ciphertext
  );

  const plainBytes = new Uint8Array(plaintext);
  if (plainBytes.length < 2) {
    throw new Error("解密数据损坏：无法读取文件名长度。");
  }
  const nameLengthView = new DataView(
    plainBytes.buffer,
    plainBytes.byteOffset,
    2
  );
  const nameLength = nameLengthView.getUint16(0, false);
  if (plainBytes.length < 2 + nameLength) {
    throw new Error("解密数据损坏：文件名长度与实际不符。");
  }
  const nameBytes = plainBytes.slice(2, 2 + nameLength);
  const decoder = new TextDecoder();
  const originalFileName = decoder.decode(nameBytes);
  const fileContent = plainBytes.slice(2 + nameLength);

  return {
    plaintext: fileContent.buffer as ArrayBuffer,
    originalFileName: originalFileName,
  };
}

function triggerDownload(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

// ============ 组件主体 ============
export default function FileEncryptPage() {
  // 状态管理
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [keyValue, setKeyValue] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [logs, setLogs] = useState<{ message: string; type: string; time: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("处理中...");
  const [toast, setToast] = useState({ message: "", type: "info", show: false });
  const [dropOver, setDropOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 添加日志
  const addLog = (message: string, type = "info") => {
    setLogs((prev) => {
      const newLogs = [...prev, { message, type, time: getTimestamp() }];
      return newLogs.length > 50 ? newLogs.slice(-50) : newLogs;
    });
  };

  // 显示 Toast
  const showToast = (message: string, type = "info", duration = 2800) => {
    setToast({ message, type, show: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, duration);
  };

  // 自动滚动日志
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 全局快捷键 Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleAction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, selectedFile, keyValue]);

  // 处理文件选择
  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (mode === "decrypt") {
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith(ENC_SUFFIX)) {
        addLog(`⚠️ 警告：所选文件 "${file.name}" 不是 .enc 文件，解密可能会失败。`, "warning");
        showToast("建议选择 .enc 后缀的加密文件", "warning", 2500);
      }
    }
    setSelectedFile(file);
    addLog(`📂 已选择文件：${file.name}（${formatFileSize(file.size)}）`, "info");
  };

  // 拖拽事件处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  };
  const handleDropZoneClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // 生成随机密钥
  const handleGenerateKey = () => {
    const newKey = generateRandomKey();
    setKeyValue(newKey);
    setKeyVisible(true);
    addLog("🎲 已生成随机密钥（32字符，约190位熵）", "success");
    showToast("随机密钥已生成并显示，请妥善保存！", "success", 3000);
    handleCopyKey(true);
  };

  // 复制密钥到剪贴板
  const handleCopyKey = async (silent = false) => {
    const key = keyValue.trim();
    if (!key) {
      if (!silent) showToast("密钥为空，无法复制", "error", 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(key);
      if (!silent) {
        showToast("✅ 密钥已复制到剪贴板", "success", 2200);
        addLog("📋 密钥已复制到剪贴板", "success");
      } else {
        addLog("📋 密钥已自动复制到剪贴板", "info");
      }
    } catch (err) {
      // 降级方案
      try {
        const tempInput = document.createElement("textarea");
        tempInput.value = key;
        tempInput.style.position = "fixed";
        tempInput.style.opacity = "0";
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        if (!silent) showToast("✅ 密钥已复制到剪贴板", "success", 2200);
      } catch (fallbackErr) {
        if (!silent) showToast("❌ 复制失败，请手动复制", "error", 2500);
        addLog("❌ 复制密钥失败", "error");
      }
    }
  };

  // 加密操作
  const performEncrypt = async () => {
    if (!selectedFile) {
      showToast("请先选择要加密的文件", "error", 2500);
      addLog("❌ 未选择文件", "error");
      return;
    }
    const password = keyValue.trim();
    if (!password) {
      showToast("请输入密钥（密码）", "error", 2500);
      addLog("❌ 密钥为空", "error");
      return;
    }
    if (password.length < 6) {
      addLog("⚠️ 密钥长度较短（少于6位），建议使用更长的密钥。", "warning");
    }

    const originalFileName = selectedFile.name;
    const randomBaseName = generateRandomBaseName();
    const outputFileName = randomBaseName + ENC_SUFFIX;
    const fileSize = selectedFile.size;

    addLog(`🔒 开始加密：${originalFileName}（${formatFileSize(fileSize)}）`, "info");
    addLog(`🎲 加密文件将保存为随机名：${outputFileName}`, "info");

    if (fileSize >= MIN_FILE_SIZE_FOR_LOADING) {
      setLoading(true);
      setLoadingText("读取文件中...");
    } else {
      setLoading(true);
      setLoadingText("加密中...");
    }

    try {
      const fileBuffer = await readFileAsArrayBuffer(selectedFile, (pct) => {
        if (fileSize >= MIN_FILE_SIZE_FOR_LOADING) {
          setLoadingText(`读取文件中... ${pct}%`);
        }
      });
      const startTime = performance.now();
      const encryptedBuffer = await encryptFile(fileBuffer, password, randomBaseName, originalFileName);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      setLoading(false);

      triggerDownload(encryptedBuffer, outputFileName);

      addLog(`✅ 加密成功！耗时 ${elapsed} 秒`, "success");
      addLog(`📦 加密文件：${outputFileName}（${formatFileSize(encryptedBuffer.byteLength)}）`, "info");
      addLog(`⚠️ 重要：请勿重命名 "${outputFileName}"，否则将无法解密！`, "warning");
      addLog(`💾 原始文件名已受密码学保护，解密时会自动还原。`, "info");
      showToast(`✅ 加密成功！文件：${outputFileName}`, "success", 3500);
    } catch (err: unknown) {
      setLoading(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`❌ 加密失败：${errMsg}`, "error");
      showToast(`❌ 加密失败：${errMsg}`, "error", 4000);
      console.error(err);
    }
  };

  // 解密操作
  const performDecrypt = async () => {
    if (!selectedFile) {
      showToast("请先选择要解密的 .enc 文件", "error", 2500);
      addLog("❌ 未选择文件", "error");
      return;
    }
    const password = keyValue.trim();
    if (!password) {
      showToast("请输入密钥（密码）", "error", 2500);
      addLog("❌ 密钥为空", "error");
      return;
    }

    const encFileName = selectedFile.name;
    const baseNameForAAD = encFileName.toLowerCase().endsWith(ENC_SUFFIX)
      ? encFileName.substring(0, encFileName.length - ENC_SUFFIX.length)
      : encFileName;
    const fileSize = selectedFile.size;

    addLog(`🔓 开始解密：${encFileName}（${formatFileSize(fileSize)}）`, "info");
    addLog(`🔍 使用文件名 "${baseNameForAAD}" 进行认证验证`, "info");

    if (fileSize >= MIN_FILE_SIZE_FOR_LOADING) {
      setLoading(true);
      setLoadingText("读取文件中...");
    } else {
      setLoading(true);
      setLoadingText("解密中...");
    }

    try {
      const encryptedBuffer = await readFileAsArrayBuffer(selectedFile, (pct) => {
        if (fileSize >= MIN_FILE_SIZE_FOR_LOADING) {
          setLoadingText(`读取文件中... ${pct}%`);
        }
      });
      const startTime = performance.now();
      const { plaintext, originalFileName } = await decryptFile(encryptedBuffer, password, baseNameForAAD);
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      setLoading(false);

      triggerDownload(plaintext, originalFileName);

      addLog(`✅ 解密成功！耗时 ${elapsed} 秒`, "success");
      addLog(`📦 还原文件：${originalFileName}（${formatFileSize(plaintext.byteLength)}）`, "info");
      addLog(`🎉 文件名认证通过，文件完整无损。`, "success");
      showToast(`✅ 解密成功！已还原：${originalFileName}`, "success", 3500);
    } catch (err: unknown) {
      setLoading(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      const errName = err instanceof Error ? err.name : "";
      if (
        errName === "OperationError" ||
        errMsg.includes("operation") ||
        errMsg.includes("AES-GCM") ||
        errMsg.includes("decrypt")
      ) {
        addLog(`❌ 解密失败：认证未通过！`, "error");
        addLog(`🔍 可能原因：密钥错误、文件被重命名、文件内容被篡改或损坏。`, "warning");
        addLog(`💡 请确认密钥正确，且文件名未被修改（当前验证名："${baseNameForAAD}"）。`, "warning");
        showToast("❌ 解密失败：密钥错误或文件已被修改（含重命名）", "error", 5000);
      } else {
        addLog(`❌ 解密失败：${errMsg}`, "error");
        showToast(`❌ 解密失败：${errMsg}`, "error", 4000);
      }
      console.error(err);
    }
  };

  // 主操作按钮
  const handleAction = () => {
    if (mode === "encrypt") {
      performEncrypt();
    } else {
      performDecrypt();
    }
  };

  // 切换模式时清空文件
  const switchMode = (newMode: "encrypt" | "decrypt") => {
    setMode(newMode);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 初始化日志
  useEffect(() => {
    addLog("🚀 工具就绪。AES-GCM 认证加密，随机文件名保护。", "info");
    addLog("💡 加密后文件名为随机生成，请勿重命名，否则将无法解密。", "info");
    addLog("⌨️ 快捷键：Ctrl+Enter 触发操作。", "info");
  }, []);

  // 密钥强度计算
  const keyStrength =
    keyValue.length === 0 ? "" : keyValue.length < 8 ? "强度：弱" : keyValue.length < 16 ? "强度：中等" : "强度：强 ✓";
  const keyStrengthColor =
    keyValue.length === 0
      ? ""
      : keyValue.length < 8
        ? "text-red-500 dark:text-red-400"
        : keyValue.length < 16
          ? "text-amber-500 dark:text-amber-400"
          : "text-emerald-500 dark:text-emerald-400";

  return (
    <div className="min-h-screen">
      {/* 统一纵轴容器：包含返回按钮和主卡片 */}
      <div className="w-[70%] max-w-2xl mx-auto px-4 mt-20 pb-20">
        {/* 返回按钮：与下方卡片左对齐 */}
        <div className="mb-4">
          <BackButton />
        </div>

        {/* 主卡片：玻璃拟态 */}
        <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 md:p-8">
          {/* 头部 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 mb-3">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-1">
              文件加密 / 解密工具
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AES-GCM 认证加密 · 随机文件名 · 防篡改
            </p>
          </div>

          {/* 模式切换标签 */}
          <div className="flex gap-1.5 bg-white/30 dark:bg-slate-900/20 rounded-2xl p-1 mb-6 border border-white/40 dark:border-white/10">
            <button
              onClick={() => switchMode("encrypt")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${mode === "encrypt"
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
            >
              🔒 加密
            </button>
            <button
              onClick={() => switchMode("decrypt")}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${mode === "decrypt"
                  ? "bg-indigo-500 text-white shadow-lg"
                  : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
            >
              🔓 解密
            </button>
          </div>

          {/* 拖拽上传区域 */}
          <div
            onClick={handleDropZoneClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-6 ${dropOver
                ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10 scale-[1.01]"
                : selectedFile
                  ? "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/10"
                  : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400 bg-white/20 dark:bg-slate-800/20"
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={mode === "decrypt" ? ".enc" : "*/*"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0] ?? null;
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-1">
                <div className="text-3xl">{mode === "encrypt" ? "📄" : "🔐"}</div>
                <p className="font-bold text-slate-900 dark:text-white break-all">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl opacity-70">📁</div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {mode === "encrypt"
                    ? "拖拽文件到此处或点击选择"
                    : "拖拽 .enc 文件到此处或点击选择"}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {mode === "encrypt" ? "支持任意格式文件" : "仅支持 .enc 加密文件"}
                </p>
              </div>
            )}
          </div>

          {/* 密钥输入区 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                🔑 加密密钥（密码）
              </span>
              {keyStrength && (
                <span className={`text-xs font-bold ${keyStrengthColor}`}>
                  {keyStrength}
                </span>
              )}
            </div>
            <div className="flex gap-2 items-stretch">
              <div className="relative flex-1">
                <input
                  type={keyVisible ? "text" : "password"}
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder="输入密码或点击生成随机密钥"
                  className="w-full bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none text-slate-800 dark:text-slate-200 font-mono"
                />
                <button
                  onClick={() => setKeyVisible(!keyVisible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                  title={keyVisible ? "隐藏密钥" : "显示密钥"}
                >
                  {keyVisible ? "🙈" : "👁️"}
                </button>
              </div>
              {mode === "encrypt" && (
                <>
                  <button
                    onClick={handleGenerateKey}
                    className="px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all whitespace-nowrap"
                  >
                    🎲 生成
                  </button>
                  <button
                    onClick={() => handleCopyKey(false)}
                    className="px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all whitespace-nowrap"
                  >
                    📋 复制
                  </button>
                </>
              )}
              {mode === "decrypt" && (
                <button
                  onClick={() => handleCopyKey(false)}
                  className="px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all whitespace-nowrap"
                >
                  📋 复制
                </button>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <button
            onClick={handleAction}
            disabled={loading}
            className="w-full px-4 py-3 text-white text-sm font-bold rounded-xl transition-colors bg-indigo-500 hover:bg-indigo-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === "encrypt" ? "🔒 开始加密" : "🔓 开始解密"}
          </button>

          {/* 提示信息 */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
            {mode === "encrypt"
              ? "⚠️ 加密后文件名为随机生成，请勿重命名加密文件，否则将无法解密。"
              : "🔍 解密时会使用当前文件名（去掉.enc后缀）进行验证，请勿重命名加密文件。"}
          </p>

          {/* 日志区域 */}
          {logs.length > 0 && (
            <div
              ref={logContainerRef}
              className="mt-6 rounded-xl bg-black/10 dark:bg-black/20 border border-white/10 p-4 max-h-48 overflow-y-auto text-xs font-mono space-y-1 scrollbar-thin"
            >
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${log.type === "success"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : log.type === "error"
                        ? "text-red-500 dark:text-red-400"
                        : log.type === "warning"
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-slate-600 dark:text-slate-300"
                    }`}
                >
                  <span className="opacity-70 shrink-0">[{log.time}]</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 加载遮罩 */}
      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
          <div className="w-10 h-10 border-4 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-white font-medium">{loadingText}</span>
        </div>
      )}

      {/* Toast 通知 */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 px-6 py-3 rounded-2xl backdrop-blur-lg border shadow-2xl text-sm font-medium text-white text-center max-w-[90vw] pointer-events-none ${toast.show ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
          } ${toast.type === "success"
            ? "bg-emerald-500/90 border-emerald-400/50"
            : toast.type === "error"
              ? "bg-red-500/90 border-red-400/50"
              : "bg-slate-700/90 border-white/10"
          }`}
      >
        {toast.message}
      </div>
    </div>
  );
}