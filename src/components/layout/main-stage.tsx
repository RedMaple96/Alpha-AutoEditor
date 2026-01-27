import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useDeviceStore } from '@/stores/device-store';
import { useEditorStore } from '@/stores/editor-store';
import { Scan } from 'lucide-react';
import { useScrcpy } from '@/hooks/use-scrcpy';

export function MainStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const { device, isConnected } = useDeviceStore();
  const { 
    captureRequest, 
    captureMode, 
    selection, 
    isSelecting, 
    setSelection, 
    setSelecting, 
    requestCapture, 
    fileName,
    isCapturing,
    capturingProgress,
    sampleIntervalMs,
    sampleDurationMs,
    displayScale,
    setCapturing,
    setCapturingProgress
  } = useEditorStore();
  const prevCaptureRequestRef = useRef(captureRequest);
  const captureInProgressRef = useRef(false);
  const [selectionPreview, setSelectionPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [fitScale, setFitScale] = useState(1);
  
  // 使用 Scrcpy hook
  const { streamSize, canvas: videoCanvas } = useScrcpy({
    device,
  });

  // 挂载视频 Canvas
  useEffect(() => {
    if (!videoCanvas || !videoContainerRef.current) return;
    videoContainerRef.current.innerHTML = '';
    videoCanvas.className = "block bg-black w-full h-full";
    videoCanvas.style.width = '100%';
    videoCanvas.style.height = '100%';
    videoContainerRef.current.appendChild(videoCanvas);
  }, [videoCanvas]);

  // 处理截图请求
  useEffect(() => {
    if (captureRequest > prevCaptureRequestRef.current) {
        prevCaptureRequestRef.current = captureRequest;
        void handleCapture(captureMode);
    }
  }, [captureRequest]);

  useEffect(() => {
    if (!streamSize || !hostRef.current) return;
    const host = hostRef.current;
    const padding = 16;
    const updateScale = () => {
      const width = Math.max(1, host.clientWidth - padding * 2);
      const height = Math.max(1, host.clientHeight - padding * 2);
      const scale = Math.min(width / streamSize.width, height / streamSize.height, 1);
      setFitScale(scale);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(host);
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [streamSize]);

  const handleCapture = async (mode: 'region' | 'full') => {
    if (captureInProgressRef.current) return;
    if (!videoCanvas) return;

    const width = videoCanvas.width;
    const height = videoCanvas.height;
    if (width === 0 || height === 0) return;

    captureInProgressRef.current = true;
    setCapturing(true);
    setCapturingProgress(0);

    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctxTemp = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctxTemp) return;

        const applyDynamicTransparency = (target: Uint8ClampedArray, compare: Uint8ClampedArray, threshold: number) => {
            for (let i = 0; i < target.length; i += 4) {
                const diff = Math.abs(target[i] - compare[i]) + Math.abs(target[i + 1] - compare[i + 1]) + Math.abs(target[i + 2] - compare[i + 2]);
                if (diff > threshold) {
                    target[i + 3] = 0;
                }
            }
        };

        const waitMs = (durationMs: number) => new Promise<void>((resolve) => setTimeout(resolve, durationMs));

        const diffThreshold = 30;

        const captureSequence = async (sx: number, sy: number, sw: number, sh: number) => {
            ctxTemp.drawImage(videoCanvas, 0, 0);
            const baseData = ctxTemp.getImageData(sx, sy, sw, sh);
            const startTime = performance.now();
            let nextTime = startTime + sampleIntervalMs;
            setCapturingProgress(0);
            while (performance.now() - startTime < sampleDurationMs) {
                const delay = Math.max(0, nextTime - performance.now());
                if (delay > 0) {
                    await waitMs(delay);
                }
                ctxTemp.drawImage(videoCanvas, 0, 0);
                const compareData = ctxTemp.getImageData(sx, sy, sw, sh);
                applyDynamicTransparency(baseData.data, compareData.data, diffThreshold);
                const elapsed = Math.min(sampleDurationMs, performance.now() - startTime);
                setCapturingProgress(elapsed / sampleDurationMs);
                nextTime += sampleIntervalMs;
            }
            setCapturingProgress(1);
            return baseData;
        };

        const buildFileName = () => {
            const raw = fileName.trim();
            const baseName = raw.length > 0 ? raw : `capture_${Date.now()}`;
            const sanitized = baseName.replace(/[\\/:*?"<>|]/g, '_');
            return sanitized.toLowerCase().endsWith('.png') ? sanitized : `${sanitized}.png`;
        };

        if (mode === 'region') {
            if (!selection) return;
            const sx = Math.max(0, Math.min(selection.x, width - 1));
            const sy = Math.max(0, Math.min(selection.y, height - 1));
            const sw = Math.max(1, Math.min(selection.width, width - sx));
            const sh = Math.max(1, Math.min(selection.height, height - sy));
            if (sw <= 1 || sh <= 1) return;

            const regionData = await captureSequence(sx, sy, sw, sh);

            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = sw;
            resultCanvas.height = sh;
            const ctxResult = resultCanvas.getContext('2d');
            if (!ctxResult) return;
            ctxResult.putImageData(regionData, 0, 0);
            const dataUrl = resultCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = buildFileName();
            link.href = dataUrl;
            link.click();
            return;
        }

        const fullData = await captureSequence(0, 0, width, height);
        ctxTemp.putImageData(fullData, 0, 0);
        const dataUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = buildFileName();
        link.href = dataUrl;
        link.click();
    } finally {
        captureInProgressRef.current = false;
        setCapturing(false);
    }
  };

  const getRelativePoint = (event: PointerEvent) => {
    if (!stageRef.current) return null;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
    return { x, y, rect };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isSelecting) return;
    const point = getRelativePoint(event.nativeEvent);
    if (!point) return;
    dragStartRef.current = { x: point.x, y: point.y };
    setSelectionPreview({ x: point.x, y: point.y, width: 0, height: 0 });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isSelecting) return;
    const start = dragStartRef.current;
    if (!start) return;
    const point = getRelativePoint(event.nativeEvent);
    if (!point) return;
    const x = Math.min(start.x, point.x);
    const y = Math.min(start.y, point.y);
    const width = Math.abs(point.x - start.x);
    const height = Math.abs(point.y - start.y);
    setSelectionPreview({ x, y, width, height });
  };

  const finalizeSelection = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isSelecting) return;
    const start = dragStartRef.current;
    if (!start) return;
    const point = getRelativePoint(event.nativeEvent);
    if (!point || !videoCanvas) {
        dragStartRef.current = null;
        setSelectionPreview(null);
        setSelecting(false);
        return;
    }
    const x = Math.min(start.x, point.x);
    const y = Math.min(start.y, point.y);
    const width = Math.abs(point.x - start.x);
    const height = Math.abs(point.y - start.y);
    dragStartRef.current = null;
    setSelectionPreview(null);
    if (width < 2 || height < 2) {
        setSelection(null);
        setSelecting(false);
        return;
    }
    const scaleX = videoCanvas.width / point.rect.width;
    const scaleY = videoCanvas.height / point.rect.height;
    setSelection({
        x: Math.round(x * scaleX),
        y: Math.round(y * scaleY),
        width: Math.round(width * scaleX),
        height: Math.round(height * scaleY),
    });
    setSelecting(false);
    requestCapture('region');
  };

  return (
    <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)] pointer-events-none"></div>

        {/* 主 Canvas 容器 */}
        <div ref={hostRef} className="relative border border-zinc-800 bg-zinc-950 shadow-2xl flex items-center justify-center w-full h-full overflow-hidden">
            <div className="absolute -top-6 left-0 text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                <Scan className="w-3 h-3" />
                视口: {streamSize ? `${streamSize.width}x${streamSize.height}` : '无信号'}
            </div>

            <div
                ref={stageRef}
                className="relative bg-black"
                style={{ 
                    width: streamSize ? Math.max(1, Math.round(streamSize.width * displayScale * fitScale)) : 360,
                    height: streamSize ? Math.max(1, Math.round(streamSize.height * displayScale * fitScale)) : 640
                }}
            >
                <div ref={videoContainerRef} className="absolute inset-0" />
                <div
                    className={isSelecting ? "absolute inset-0 cursor-crosshair" : "absolute inset-0 pointer-events-none"}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finalizeSelection}
                    onPointerLeave={finalizeSelection}
                >
                    {selectionPreview && (
                        <div
                            className="absolute border border-cyan-400/80 bg-cyan-400/10"
                            style={{
                                left: selectionPreview.x,
                                top: selectionPreview.y,
                                width: selectionPreview.width,
                                height: selectionPreview.height,
                            }}
                        />
                    )}
                </div>
            </div>

            {/* 待机提示 */}
            {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
                    <div className="text-zinc-500 font-mono text-sm animate-pulse">等待设备连接...</div>
                </div>
            )}

            {isConnected && isCapturing && (
                <div className="absolute inset-x-0 top-2 flex justify-center pointer-events-none">
                    <div className="bg-zinc-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] px-3 py-2 rounded flex flex-col gap-2 min-w-[180px]">
                        <div className="flex items-center justify-between gap-2">
                            <span>截图处理中</span>
                            <span>{Math.round(capturingProgress * 100)}%</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded overflow-hidden">
                            <div className="h-full bg-cyan-500" style={{ width: `${Math.round(capturingProgress * 100)}%` }} />
                        </div>
                        <div className="text-[9px] text-zinc-400 text-right">
                            采样 {sampleIntervalMs}ms / {Math.round(sampleDurationMs / 100) / 10}s
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
