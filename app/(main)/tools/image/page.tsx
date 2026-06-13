"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import BackButton from "@/app/_components/article/BackButton";
import SelectDropdown from "@/app/_components/admin/SelectDropdown";

// ============ 常量 ============
const ORIGINAL_PREVIEW_MAX = 480;
const PROCESSED_PREVIEW_MAX = 450;
const MIN_CROP_SIZE = 30;

// ============ 工具函数 ============
const getResizeCursor = (handle: string) => {
  const cursors: Record<string, string> = { tl: 'nwse-resize', br: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize', t: 'ns-resize', b: 'ns-resize', l: 'ew-resize', r: 'ew-resize' };
  return cursors[handle] || 'crosshair';
};

const getFormatLabel = (f: string) => ({ 'image/png': 'PNG', 'image/jpeg': 'JPEG', 'image/webp': 'WebP', 'image/bmp': 'BMP' }[f] || f);
const getFormatExt = (f: string) => ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/bmp': 'bmp' }[f] || 'png');

// ============ 主组件 ============
export default function ImageToolsPage() {
  // ---- 状态 (仅保留必要的) ----
  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalFileName, setOriginalFileName] = useState("");
  const [originalFileSize, setOriginalFileSize] = useState(0);
  const [cropRect, setCropRect] = useState({ cx: 0, cy: 0, cw: 0, ch: 0 }); // 仅用于非拖动时的同步
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [targetWidth, setTargetWidth] = useState(800);
  const [targetHeight, setTargetHeight] = useState(600);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [quality, setQuality] = useState(0.85);
  const [currentFormat, setCurrentFormat] = useState("image/png");
  const [cropAspectMode, setCropAspectMode] = useState("free");
  const [estimatedSize, setEstimatedSize] = useState("");
  const [toast, setToast] = useState({ message: "", type: "", visible: false });
  const [dragOver, setDragOver] = useState(false);
  const [processedFlash, setProcessedFlash] = useState(false);

  // ---- Refs (存储可变数据，避免渲染) ----
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const originalPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedPreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropRectRef = useRef({ cx: 0, cy: 0, cw: 0, ch: 0 }); // 实时裁剪框
  const cropScaleRef = useRef(1);
  const cropDragState = useRef({
    isDragging: false,
    isResizing: false,
    resizeHandle: null as string | null,
    startMouse: { x: 0, y: 0 },
    startCrop: { cx: 0, cy: 0, cw: 0, ch: 0 },
  });
  const rafIdRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sizeEstimateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- 辅助函数 ----
  const showToast = useCallback((message: string, type = "") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type, visible: true });
    toastTimerRef.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2200);
  }, []);

  const getImage = () => originalImageRef.current;

  // ---- 裁剪框实时绘制 (直接操作Canvas，不触发React渲染) ----
  const drawOriginalPreview = useCallback(() => {
    const canvas = originalPreviewCanvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    const crop = cropRectRef.current;
    const scale = Math.min(ORIGINAL_PREVIEW_MAX / img.naturalWidth, ORIGINAL_PREVIEW_MAX / img.naturalHeight, 1);
    const cw = Math.round(img.naturalWidth * scale);
    const ch = Math.round(img.naturalHeight * scale);
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    cropScaleRef.current = scale;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);

    const cx = crop.cx * scale;
    const cy = crop.cy * scale;
    const crW = crop.cw * scale;
    const crH = crop.ch * scale;

    // 遮罩（只覆盖裁剪框外部，不遮挡图片）
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    ctx.rect(cx, cy, crW, crH);
    ctx.clip('evenodd');
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();

    // 虚线框
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.strokeRect(cx, cy, crW, crH);
    ctx.restore();

    // 角点（半透明小圆环）
    const isDark = document.documentElement.classList.contains('dark');
    const accentColor = isDark ? '#818cf8' : '#6366f1';
    const handleRadius = 6;
    const handles = [
      { x: cx, y: cy }, { x: cx + crW, y: cy },
      { x: cx, y: cy + crH }, { x: cx + crW, y: cy + crH },
      { x: cx + crW / 2, y: cy }, { x: cx + crW / 2, y: cy + crH },
      { x: cx, y: cy + crH / 2 }, { x: cx + crW, y: cy + crH / 2 },
    ];
    handles.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleRadius - 2, 0, Math.PI * 2);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = accentColor;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }, []);

  // ---- 渲染管线 (处理后预览) ----
  const renderPipeline = useCallback(() => {
    const img = originalImageRef.current;
    const procCanvas = processedPreviewCanvasRef.current;
    if (!img || !procCanvas) return null;
    const crop = cropRectRef.current;

    // 裁剪
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = Math.round(crop.cw);
    cropCanvas.height = Math.round(crop.ch);
    const cropCtx = cropCanvas.getContext('2d')!;
    cropCtx.drawImage(img, crop.cx, crop.cy, crop.cw, crop.ch, 0, 0, crop.cw, crop.ch);

    // 旋转+翻转
    const rad = rotation * Math.PI / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const rotW = Math.max(1, Math.round(crop.cw * cos + crop.ch * sin));
    const rotH = Math.max(1, Math.round(crop.cw * sin + crop.ch * cos));
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = rotW;
    rotCanvas.height = rotH;
    const rotCtx = rotCanvas.getContext('2d')!;
    rotCtx.translate(rotW / 2, rotH / 2);
    rotCtx.rotate(rad);
    if (flipH) rotCtx.scale(-1, 1);
    if (flipV) rotCtx.scale(1, -1);
    rotCtx.drawImage(cropCanvas, -crop.cw / 2, -crop.ch / 2);

    // 缩放
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext('2d')!;
    finalCtx.drawImage(rotCanvas, 0, 0, targetWidth, targetHeight);

    // 输出到预览canvas
    const previewScale = Math.min(PROCESSED_PREVIEW_MAX / targetWidth, PROCESSED_PREVIEW_MAX / targetHeight, 1);
    const pw = Math.round(targetWidth * previewScale);
    const ph = Math.round(targetHeight * previewScale);
    procCanvas.width = pw;
    procCanvas.height = ph;
    procCanvas.style.width = pw + 'px';
    procCanvas.style.height = ph + 'px';
    const procCtx = procCanvas.getContext('2d')!;
    procCtx.clearRect(0, 0, pw, ph);
    procCtx.drawImage(finalCanvas, 0, 0, pw, ph);

    return finalCanvas;
  }, [rotation, flipH, flipV, targetWidth, targetHeight]); // 依赖项

  // ---- 触发处理后预览更新 (带防抖) ----
  const triggerPreviewUpdate = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      renderPipeline();
      // 闪烁效果
      setProcessedFlash(true);
      setTimeout(() => setProcessedFlash(false), 350);
      // 异步估算大小
      if (sizeEstimateTimerRef.current) clearTimeout(sizeEstimateTimerRef.current);
      sizeEstimateTimerRef.current = setTimeout(estimateFileSize, 400);
    }, 40);
  }, [renderPipeline]);

  // ---- 文件大小估算 ----
  const estimateFileSize = useCallback(async () => {
    const finalCanvas = renderPipeline();
    if (!finalCanvas) { setEstimatedSize(""); return; }
    const format = currentFormat;
    const q = (format === 'image/jpeg' || format === 'image/webp') ? quality : undefined;
    try {
      const blob = await new Promise<Blob>((resolve, reject) => finalCanvas.toBlob(b => b ? resolve(b) : reject(new Error('Empty blob')), format, q));
      if (blob && blob.size > 0) {
        const str = blob.size > 1024 * 1024 ? (blob.size / (1024 * 1024)).toFixed(2) + ' MB' : (blob.size / 1024).toFixed(1) + ' KB';
        setEstimatedSize('📦 预估文件大小: ' + str);
      } else {
        setEstimatedSize('📦 预估: 格式可能不被浏览器支持');
      }
    } catch { setEstimatedSize('📦 无法估算'); }
  }, [renderPipeline, currentFormat, quality]);

  // ---- 裁剪交互逻辑 ----
  const getCropHandleAt = useCallback((mx: number, my: number) => {
    const scale = cropScaleRef.current;
    const crop = cropRectRef.current;
    const cx = crop.cx * scale;
    const cy = crop.cy * scale;
    const crW = crop.cw * scale;
    const crH = crop.ch * scale;
    const threshold = 16;
    const handles = [
      { x: cx, y: cy, id: 'tl' }, { x: cx + crW, y: cy, id: 'tr' },
      { x: cx, y: cy + crH, id: 'bl' }, { x: cx + crW, y: cy + crH, id: 'br' },
      { x: cx + crW / 2, y: cy, id: 't' }, { x: cx + crW / 2, y: cy + crH, id: 'b' },
      { x: cx, y: cy + crH / 2, id: 'l' }, { x: cx + crW, y: cy + crH / 2, id: 'r' },
    ];
    for (const h of handles) {
      if (Math.sqrt((mx - h.x) ** 2 + (my - h.y) ** 2) < threshold) return h.id;
    }
    if (mx >= cx && mx <= cx + crW && my >= cy && my <= cy + crH) return 'move';
    return null;
  }, []);

  const applyResizeLogic = useCallback((dx: number, dy: number, handle: string, startCrop: { cx: number; cy: number; cw: number; ch: number }, aspectMode: string) => {
    let newCx = startCrop.cx;
    let newCy = startCrop.cy;
    let newCw = startCrop.cw;
    let newCh = startCrop.ch;
    let targetRatio = null;
    if (aspectMode === '1:1') targetRatio = 1;
    else if (aspectMode === '4:3') targetRatio = 4 / 3;
    else if (aspectMode === '16:9') targetRatio = 16 / 9;
    else if (aspectMode === '3:2') targetRatio = 3 / 2;
    else if (aspectMode === '2:3') targetRatio = 2 / 3;

    switch (handle) {
      case 'br': newCw = startCrop.cw + dx; newCh = startCrop.ch + dy; break;
      case 'bl': newCx = startCrop.cx + dx; newCw = startCrop.cw - dx; newCh = startCrop.ch + dy; break;
      case 'tr': newCy = startCrop.cy + dy; newCw = startCrop.cw + dx; newCh = startCrop.ch - dy; break;
      case 'tl': newCx = startCrop.cx + dx; newCy = startCrop.cy + dy; newCw = startCrop.cw - dx; newCh = startCrop.ch - dy; break;
      case 't': newCy = startCrop.cy + dy; newCh = startCrop.ch - dy; break;
      case 'b': newCh = startCrop.ch + dy; break;
      case 'l': newCx = startCrop.cx + dx; newCw = startCrop.cw - dx; break;
      case 'r': newCw = startCrop.cw + dx; break;
    }

    if (targetRatio && ['tl', 'tr', 'bl', 'br'].includes(handle)) {
      const absCw = Math.abs(newCw);
      const absCh = Math.abs(newCh);
      if (absCw / absCh > targetRatio) newCw = Math.sign(newCw) * absCh * targetRatio;
      else newCh = Math.sign(newCh) * absCw / targetRatio;
    }

    if (Math.abs(newCw) < MIN_CROP_SIZE) {
      if (newCw < 0 && handle.includes('l')) newCx = startCrop.cx + startCrop.cw - MIN_CROP_SIZE;
      newCw = (newCw >= 0 ? 1 : -1) * MIN_CROP_SIZE;
    }
    if (Math.abs(newCh) < MIN_CROP_SIZE) {
      if (newCh < 0 && handle.includes('t')) newCy = startCrop.cy + startCrop.ch - MIN_CROP_SIZE;
      newCh = (newCh >= 0 ? 1 : -1) * MIN_CROP_SIZE;
    }

    const img = originalImageRef.current;
    const imgW = img?.naturalWidth || 1;
    const imgH = img?.naturalHeight || 1;
    if (newCx < 0) { newCw += newCx; newCx = 0; }
    if (newCy < 0) { newCh += newCy; newCy = 0; }
    if (newCx + newCw > imgW) newCw = imgW - newCx;
    if (newCy + newCh > imgH) newCh = imgH - newCy;
    if (newCw < MIN_CROP_SIZE) newCw = MIN_CROP_SIZE;
    if (newCh < MIN_CROP_SIZE) newCh = MIN_CROP_SIZE;

    return { cx: newCx, cy: newCy, cw: newCw, ch: newCh };
  }, []);

  const onCropStart = useCallback((e: React.MouseEvent | React.TouchEvent, clientX: number, clientY: number) => {
    const canvas = originalPreviewCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);
    const handle = getCropHandleAt(mx, my);
    if (handle) {
      e.preventDefault();
      cropDragState.current = {
        isDragging: handle === 'move',
        isResizing: handle !== 'move',
        resizeHandle: handle !== 'move' ? handle : null,
        startMouse: { x: mx, y: my },
        startCrop: { ...cropRectRef.current },
      };
      canvas.style.cursor = handle === 'move' ? 'move' : getResizeCursor(handle);
    }
  }, [getCropHandleAt]);

  const onCropMove = useCallback((clientX: number, clientY: number) => {
    const canvas = originalPreviewCanvasRef.current;
    const ds = cropDragState.current;
    if (!canvas || !originalImageRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);

    if (!ds.isDragging && !ds.isResizing) {
      const handle = getCropHandleAt(mx, my);
      canvas.style.cursor = handle && handle !== 'move' ? getResizeCursor(handle) : handle === 'move' ? 'move' : 'crosshair';
      return;
    }

    const scale = cropScaleRef.current;
    if (ds.isDragging) {
      const dx = (mx - ds.startMouse.x) / scale;
      const dy = (my - ds.startMouse.y) / scale;
      const img = originalImageRef.current;
      let newCx = ds.startCrop.cx + dx;
      let newCy = ds.startCrop.cy + dy;
      newCx = Math.max(0, Math.min(img.naturalWidth - cropRectRef.current.cw, newCx));
      newCy = Math.max(0, Math.min(img.naturalHeight - cropRectRef.current.ch, newCy));
      cropRectRef.current = { ...cropRectRef.current, cx: newCx, cy: newCy };
    } else if (ds.isResizing && ds.resizeHandle) {
      const dx = (mx - ds.startMouse.x) / scale;
      const dy = (my - ds.startMouse.y) / scale;
      cropRectRef.current = applyResizeLogic(dx, dy, ds.resizeHandle, ds.startCrop, cropAspectMode);
    }

    // 使用RAF绘制
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(drawOriginalPreview);
  }, [applyResizeLogic, cropAspectMode, drawOriginalPreview, getCropHandleAt]);

  const onCropEnd = useCallback(() => {
    const ds = cropDragState.current;
    if (ds.isDragging || ds.isResizing) {
      cropDragState.current = { isDragging: false, isResizing: false, resizeHandle: null, startMouse: { x: 0, y: 0 }, startCrop: { cx: 0, cy: 0, cw: 0, ch: 0 } };
      if (originalPreviewCanvasRef.current) originalPreviewCanvasRef.current.style.cursor = 'crosshair';
      // 同步到React状态
      const finalCrop = cropRectRef.current;
      setCropRect({ ...finalCrop });
      // 更新目标尺寸比例
      const ar = finalCrop.cw / finalCrop.ch;
      const effectiveAr = (rotation === 90 || rotation === 270) ? finalCrop.ch / finalCrop.cw : ar;
      if (aspectLocked) {
        setTargetHeight(prev => Math.round(targetWidth / effectiveAr));
      }
    }
  }, [rotation, aspectLocked, targetWidth]);

  // ---- 文件处理 ----
  const processFile = useCallback((file: File) => {
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExts.some(ext => fileName.endsWith(ext));
    if (!hasValidExt && file.type && !['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(file.type)) {
      showToast('⚠️ 不支持的文件格式', '');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        const initialCrop = { cx: 0, cy: 0, cw: img.naturalWidth, ch: img.naturalHeight };
        cropRectRef.current = initialCrop;
        setCropRect(initialCrop);
        setOriginalFileName(file.name);
        setOriginalFileSize(file.size);
        setImageLoaded(true);
        setTargetWidth(img.naturalWidth);
        setTargetHeight(img.naturalHeight);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setQuality(0.85);
        setCurrentFormat("image/png");
        setCropAspectMode("free");
        setAspectLocked(true);
        setEstimatedSize("");
        showToast('✅ 图片已加载', 'success');
        // 初始化绘制
        setTimeout(() => {
          drawOriginalPreview();
          triggerPreviewUpdate();
        }, 50);
      };
      img.onerror = () => showToast('⚠️ 图片加载失败', '');
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [showToast, drawOriginalPreview, triggerPreviewUpdate]);

  // ---- 全局鼠标/触摸事件绑定 ----
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cropDragState.current.isDragging || cropDragState.current.isResizing) {
        onCropMove(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = () => onCropEnd();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onCropMove, onCropEnd]);

  // 参数变化时更新处理后预览
  useEffect(() => {
    if (imageLoaded) {
      triggerPreviewUpdate();
    }
  }, [cropRect, rotation, flipH, flipV, targetWidth, targetHeight, quality, currentFormat, imageLoaded, triggerPreviewUpdate]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (originalImageRef.current) {
          const fullCrop = { cx: 0, cy: 0, cw: originalImageRef.current.naturalWidth, ch: originalImageRef.current.naturalHeight };
          cropRectRef.current = fullCrop;
          setCropRect(fullCrop);
          setTargetWidth(fullCrop.cw);
          setTargetHeight(fullCrop.ch);
          setRotation(0);
          setFlipH(false);
          setFlipV(false);
          setQuality(0.85);
          setCurrentFormat("image/png");
          setCropAspectMode("free");
          setAspectLocked(true);
          drawOriginalPreview();
          showToast('🔄 已重置所有设置', '');
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [drawOriginalPreview, showToast]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (sizeEstimateTimerRef.current) clearTimeout(sizeEstimateTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // ---- 交互处理函数 ----
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, [processFile]);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
    e.target.value = '';
  };

  const resetCrop = () => {
    const img = originalImageRef.current;
    if (!img) return;
    const fullCrop = { cx: 0, cy: 0, cw: img.naturalWidth, ch: img.naturalHeight };
    cropRectRef.current = fullCrop;
    setCropRect(fullCrop);
    setTargetWidth(fullCrop.cw);
    setTargetHeight(fullCrop.ch);
    drawOriginalPreview();
    triggerPreviewUpdate();
  };

  const handleDownload = async () => {
    const finalCanvas = renderPipeline();
    if (!finalCanvas) return;
    const format = currentFormat;
    const q = (format === 'image/jpeg' || format === 'image/webp') ? quality : undefined;
    let downloadCanvas = finalCanvas;
    if (format === 'image/jpeg') {
      downloadCanvas = document.createElement('canvas');
      downloadCanvas.width = finalCanvas.width;
      downloadCanvas.height = finalCanvas.height;
      const dc = downloadCanvas.getContext('2d')!;
      dc.fillStyle = '#ffffff';
      dc.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
      dc.drawImage(finalCanvas, 0, 0);
    }
    try {
      const blob = await new Promise<Blob>((resolve, reject) => downloadCanvas.toBlob(b => b ? resolve(b) : reject(new Error('Empty blob')), format, q));
      if (!blob || blob.size === 0) throw new Error('Empty blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (originalFileName || 'image').replace(/\.[^.]+$/, '') + '_processed.' + getFormatExt(format);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✅ 已保存', 'success');
    } catch {
      showToast('⚠️ 下载失败或格式不支持', '');
    }
  };

  // ---- 子组件定义 ----
  const FormatPanel = ({ format, setFormat, quality, setQuality, estimatedSize }: {
    format: string; setFormat: (v: string) => void; quality: number; setQuality: (v: number) => void; estimatedSize: string;
  }) => (
    <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 transition-colors">
      <h2 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-4">📦 格式转换 & 压缩</h2>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">输出格式</label>
      <div className="w-full">
              <SelectDropdown
                options={["image/png", "image/jpeg", "image/webp", "image/bmp"]}
                value={format}
                onChange={(v) => setFormat(String(v))}
                placeholder="输出格式"
                renderOption={(v) => ({ "image/png": "PNG（无损）", "image/jpeg": "JPEG（有损压缩）", "image/webp": "WebP（高效压缩）", "image/bmp": "BMP（位图）" }[v] || v)}
                getValue={(v) => v}
              />
            </div>
      {(format === 'image/jpeg' || format === 'image/webp') && (
        <div className="mt-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">压缩质量</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600"
              style={{ accentColor: '#6366f1' }}
            />
            <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 min-w-[36px] text-center bg-indigo-500/10 rounded-xl px-2 py-1">
              {quality.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-emerald-500 dark:text-emerald-400 mt-2 min-h-[18px]">{estimatedSize}</div>
        </div>
      )}
    </div>
  );

  const CropPanel = ({ aspectMode, setAspectMode, cropRectDisplay, onResetCrop }: {
    aspectMode: string; setAspectMode: (v: string) => void; cropRectDisplay: { cx: number; cy: number; cw: number; ch: number }; onResetCrop: () => void;
  }) => (
    <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5">
      <h2 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-4">✂️ 裁剪</h2>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">裁剪比例</label>
      <div className="w-full">
              <SelectDropdown
                options={["free", "1:1", "4:3", "16:9", "3:4", "9:16"]}
                value={aspectMode}
                onChange={(v) => setAspectMode(String(v))}
                placeholder="裁剪比例"
                renderOption={(v) => ({ free: "自由", "1:1": "1:1 方形", "4:3": "4:3 标准", "16:9": "16:9 宽屏", "3:4": "3:4 竖版", "9:16": "9:16 手机" }[v] || v)}
                getValue={(v) => v}
              />
            </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
        裁剪区域: {Math.round(cropRectDisplay.cx)},{Math.round(cropRectDisplay.cy)} → {Math.round(cropRectDisplay.cw)}×{Math.round(cropRectDisplay.ch)} px
      </div>
      <button
        onClick={onResetCrop}
        className="w-full mt-3 px-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95"
      >
        ↺ 重置裁剪框（全图）
      </button>
    </div>
  );

  const RotatePanel = ({ rotation, setRotation, flipH, setFlipH, flipV, setFlipV, onRotateLeft, onRotateRight }: {
    rotation: number; setRotation: (v: number) => void; flipH: boolean; setFlipH: (v: boolean) => void; flipV: boolean; setFlipV: (v: boolean) => void; onRotateLeft: () => void; onRotateRight: () => void;
  }) => (
    <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5">
      <h2 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-4">🔄 旋转 & 翻转</h2>
      <div className="flex gap-2 flex-wrap">
        <button onClick={onRotateLeft} className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white/50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-90">↰</button>
        <button onClick={onRotateRight} className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white/50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-90">↱</button>
        <button
          onClick={() => setFlipH(!flipH)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border transition-all active:scale-90 ${flipH ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-white/50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-500'}`}
        >↔</button>
        <button
          onClick={() => setFlipV(!flipV)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border transition-all active:scale-90 ${flipV ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-white/50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-500'}`}
        >↕</button>
      </div>
      <div className="mt-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-1">自由旋转角度</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-300 dark:bg-slate-600"
            style={{ accentColor: '#6366f1' }}
          />
          <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 min-w-[36px] text-center bg-indigo-500/10 rounded-xl px-2 py-1">{rotation}°</span>
        </div>
      </div>
    </div>
  );

  const ResizePanel = ({ width, height, locked, setLocked, onWidthChange, onHeightChange, onPreset }: {
    width: number; height: number; locked: boolean; setLocked: (v: boolean) => void; onWidthChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onHeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onPreset: (w: number, h: number) => void;
  }) => (
    <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5">
      <h2 className="text-lg font-black text-slate-700 dark:text-slate-300 mb-4">📐 尺寸调整</h2>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[70px]">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">宽度(px)</label>
          <input
            type="number"
            min="1"
            max="8000"
            value={width}
            onChange={onWidthChange}
            className="w-full bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-200 text-center transition-all focus:border-indigo-500"
          />
        </div>
        <div className="flex-1 min-w-[70px]">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">高度(px)</label>
          <input
            type="number"
            min="1"
            max="8000"
            value={height}
            onChange={onHeightChange}
            className="w-full bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none text-slate-800 dark:text-slate-200 text-center transition-all focus:border-indigo-500"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 mt-3 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
        <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} className="rounded accent-indigo-500 w-5 h-5" />
        🔒 锁定宽高比
      </label>
      <div className="mt-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">预设尺寸</span>
        <div className="flex gap-2 flex-wrap">
          {[[800, 600], [1024, 768], [1920, 1080], [400, 400]].map(([w, h]) => (
            <button key={`${w}x${h}`} onClick={() => onPreset(w, h)} className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all active:scale-95">
              {w}×{h}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // 处理尺寸变化的函数
  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const w = Math.max(1, Math.min(8000, parseInt(e.target.value) || 1));
    setTargetWidth(w);
    if (aspectLocked && originalImageRef.current) {
      const crop = cropRectRef.current;
      let ar = crop.cw / crop.ch;
      if (rotation === 90 || rotation === 270) ar = crop.ch / crop.cw;
      setTargetHeight(Math.round(w / ar));
    }
  }, [aspectLocked, rotation]);
  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const h = Math.max(1, Math.min(8000, parseInt(e.target.value) || 1));
    setTargetHeight(h);
    if (aspectLocked && originalImageRef.current) {
      const crop = cropRectRef.current;
      let ar = crop.cw / crop.ch;
      if (rotation === 90 || rotation === 270) ar = crop.ch / crop.cw;
      setTargetWidth(Math.round(h * ar));
    }
  }, [aspectLocked, rotation]);
  const applyPreset = useCallback((w: number, h: number) => {
    setTargetWidth(w);
    setTargetHeight(h);
    if (aspectLocked && originalImageRef.current) {
      const crop = cropRectRef.current;
      let ar = crop.cw / crop.ch;
      if (rotation === 90 || rotation === 270) ar = crop.ch / crop.cw;
      setTargetHeight(Math.round(w / ar));
    }
  }, [aspectLocked, rotation]);

  const rotateLeft = () => setRotation(r => ((r - 90) % 360 + 360) % 360);
  const rotateRight = () => setRotation(r => ((r + 90) % 360 + 360) % 360);

  // 用于显示的裁剪信息
  const cropRectDisplay = cropRect;
  const sizeStr = originalFileSize > 1024 * 1024
    ? (originalFileSize / (1024 * 1024)).toFixed(2) + ' MB'
    : originalFileSize > 0 ? (originalFileSize / 1024).toFixed(1) + ' KB' : '';

  return (
    <div className="min-h-screen">
      <div className="pt-6 px-4 sm:px-6 lg:px-10">
        <BackButton />
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-20">
        {/* 标题 */}
        <div className="text-center mt-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
            🖼️ Image Forge
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            全能图片工具箱 · 格式转换 · 压缩 · 裁剪 · 旋转 · 尺寸调整
          </p>
        </div>

        {/* 上传区域 */}
        <div
          className={`rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 border-2 border-dashed backdrop-blur-md shadow-xl mb-6
            ${dragOver
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
              : imageLoaded
                ? 'border-white/30 dark:border-white/20 bg-white/30 dark:bg-slate-800/40'
                : 'border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-400 hover:scale-[1.01]'
            }`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {!imageLoaded ? (
            <>
              <span className="text-4xl block mb-3 animate-bounce">📤</span>
              <div className="font-bold text-slate-700 dark:text-slate-200 text-lg">拖拽图片到此处，或点击上传</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">支持 JPG / PNG / WebP / BMP</div>
            </>
          ) : (
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <span className="text-2xl">📄</span>
              <div className="text-sm text-slate-500 dark:text-slate-400 flex-1 min-w-[140px] text-left">
                {originalFileName} · {originalImageRef.current?.naturalWidth}×{originalImageRef.current?.naturalHeight} · {sizeStr}
              </div>
              <button
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold transition-all active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                🔄 替换图片
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* 主内容区域 */}
        {imageLoaded && (
          <>
            {/* 顶部控制面板：三列网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
              {/* 第1列: 格式&压缩 + 尺寸调整 */}
              <div className="flex flex-col gap-4">
                <FormatPanel
                  format={currentFormat}
                  setFormat={setCurrentFormat}
                  quality={quality}
                  setQuality={setQuality}
                  estimatedSize={estimatedSize}
                />
                <ResizePanel
                  width={targetWidth}
                  height={targetHeight}
                  locked={aspectLocked}
                  setLocked={setAspectLocked}
                  onWidthChange={handleWidthChange}
                  onHeightChange={handleHeightChange}
                  onPreset={applyPreset}
                />
              </div>

              {/* 第2列: 裁剪 + 操作按钮 */}
              <div className="flex flex-col gap-4">
                <CropPanel
                  aspectMode={cropAspectMode}
                  setAspectMode={setCropAspectMode}
                  cropRectDisplay={cropRectDisplay}
                  onResetCrop={resetCrop}
                />
                <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 flex-1 flex flex-col justify-center">
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-2.5 text-white text-sm font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-all active:scale-95"
                    >
                      💾 下载图片
                    </button>
                    <button
                      onClick={() => {
                        if (originalImageRef.current) {
                          const fullCrop = { cx: 0, cy: 0, cw: originalImageRef.current.naturalWidth, ch: originalImageRef.current.naturalHeight };
                          cropRectRef.current = fullCrop;
                          setCropRect(fullCrop);
                          setTargetWidth(fullCrop.cw);
                          setTargetHeight(fullCrop.ch);
                          setRotation(0);
                          setFlipH(false);
                          setFlipV(false);
                          setQuality(0.85);
                          setCurrentFormat("image/png");
                          setCropAspectMode("free");
                          setAspectLocked(true);
                          drawOriginalPreview();
                          showToast('🔄 已重置所有设置', '');
                        }
                      }}
                      className="flex-1 px-4 py-2.5 text-white text-sm font-bold rounded-xl bg-red-500 hover:bg-red-600 transition-all active:scale-95"
                    >
                      🔄 重置全部
                    </button>
                  </div>
                </div>
              </div>

              {/* 第3列: 旋转&翻转 */}
              <div className="flex flex-col gap-4">
                <RotatePanel
                  rotation={rotation}
                  setRotation={setRotation}
                  flipH={flipH}
                  setFlipH={setFlipH}
                  flipV={flipV}
                  setFlipV={setFlipV}
                  onRotateLeft={rotateLeft}
                  onRotateRight={rotateRight}
                />
              </div>
            </div>

            {/* 底部预览区：两列 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 原始图片预览 */}
              <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 flex flex-col min-h-[360px]">
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-3">📷 原始图片（裁剪操作区）</h3>
                <div className="flex-1 flex items-center justify-center bg-black/10 dark:bg-black/30 rounded-xl overflow-hidden min-h-[260px]">
                  <canvas
                    ref={originalPreviewCanvasRef}
                    onMouseDown={(e) => onCropStart(e, e.clientX, e.clientY)}
                    onTouchStart={(e) => {
                      if (e.touches.length === 1) onCropStart(e, e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    onTouchMove={(e) => {
                      if (e.touches.length === 1 && (cropDragState.current.isDragging || cropDragState.current.isResizing)) {
                        e.preventDefault();
                        onCropMove(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={onCropEnd}
                    style={{ cursor: 'crosshair', touchAction: 'none', maxWidth: '100%', maxHeight: '100%' }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">拖拽调整裁剪框</p>
              </div>
              {/* 处理后预览 */}
              <div className="rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-4 flex flex-col min-h-[360px]">
                <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-3">✨ 处理后预览</h3>
                <div className="flex-1 flex items-center justify-center bg-black/10 dark:bg-black/30 rounded-xl overflow-hidden min-h-[260px]">
                  <canvas
                    ref={processedPreviewCanvasRef}
                    className={`max-w-full max-h-full rounded transition-all duration-300 ${processedFlash ? 'brightness-125' : 'brightness-100'}`}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                  输出尺寸: {targetWidth}×{targetHeight}px · 格式: {getFormatLabel(currentFormat)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast 通知 */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999] rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border px-6 py-3 font-bold text-sm text-slate-800 dark:text-white shadow-2xl transition-all duration-400 pointer-events-none
          ${toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}
          ${toast.type === 'success' ? 'border-emerald-400 dark:border-emerald-500 shadow-emerald-500/20' : 'border-white/30 dark:border-white/20'}`}
        style={{ transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease' }}
      >
        {toast.message}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #6366f1;
          cursor: grab;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2), 0 0 12px rgba(99,102,241,0.3);
          transition: all 0.15s ease;
        }
        .dark input[type="range"]::-webkit-slider-thumb {
          border-color: #818cf8;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3), 0 0 12px rgba(129,140,248,0.4);
        }
        input[type="range"]::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.15);
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}