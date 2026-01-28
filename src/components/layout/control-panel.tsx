import { useState } from 'react';
import { Camera, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editor-store';
import { useDeviceStore } from '@/stores/device-store';

export function ControlPanel() {
  const { isConnected } = useDeviceStore();
  const { 
    requestCapture, 
    setSelecting, 
    setFileName, 
    fileName,
    isCapturing,
    sampleIntervalMs,
    sampleDurationMs,
    displayScale,
    setSampleInterval,
    setSampleDuration,
    setDisplayScale
  } = useEditorStore();
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="w-72 h-full bg-zinc-950 border-l border-zinc-800 p-4 flex flex-col">
      <div className="text-xs font-mono text-zinc-500 mb-4 uppercase tracking-widest">控制中心</div>

      <div className="space-y-6">
        {/* 截图模块 */}
        <div className="space-y-2">
            <div className="text-xs text-zinc-400 font-medium flex items-center gap-2">
                <Camera className="w-3 h-3 text-cyan-500" />
                截图
            </div>
            <div className="flex gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-[10px]"
                    onClick={() => setSelecting(true)}
                    disabled={!isConnected || isCapturing}
                >
                    区域截图
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-[10px]"
                    onClick={() => requestCapture('full')}
                    disabled={!isConnected || isCapturing}
                >
                    全屏截图
                </Button>
            </div>
        </div>

        {/* 导出模块 */}
        <div className="space-y-2">
             <div className="text-xs text-zinc-400 font-medium flex items-center gap-2">
                <Download className="w-3 h-3 text-cyan-500" />
                导出
            </div>
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
                <div className="space-y-1">
                    <div className="text-[10px] text-zinc-400">命名</div>
                    <input
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
                        placeholder="文件名"
                        value={fileName}
                        onChange={(event) => setFileName(event.target.value)}
                        disabled={!isConnected}
                    />
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span>格式</span>
                    <span className="text-cyan-500">PNG (透明)</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span>自动裁剪</span>
                    <span className="text-zinc-600">关闭</span>
                </div>
            </div>
        </div>

        <div className="space-y-2">
            <div className="text-xs text-zinc-400 font-medium flex items-center gap-2">
                <Settings className="w-3 h-3 text-cyan-500" />
                显示
            </div>
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>显示缩放</span>
                    <span className="text-zinc-200">{Math.round(displayScale * 100)}%</span>
                </div>
                <input
                    type="range"
                    min={25}
                    max={200}
                    step={5}
                    value={Math.round(displayScale * 100)}
                    onChange={(event) => setDisplayScale(Number(event.target.value) / 100)}
                    className="w-full"
                    disabled={!isConnected}
                />
            </div>
        </div>
      </div>

      <div className="mt-auto">
        <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-zinc-500 hover:text-zinc-300"
            onClick={() => setSettingsOpen(!isSettingsOpen)}
        >
            <Settings className="w-4 h-4 mr-2" />
            偏好设置
        </Button>
        {isSettingsOpen && (
            <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-3">
                <div className="space-y-2">
                    <div className="text-[10px] text-zinc-400">采样间隔</div>
                    <div className="grid grid-cols-3 gap-2">
                        {[10, 50, 100, 200].map((value) => (
                            <Button
                                key={`interval-${value}`}
                                variant={sampleIntervalMs === value ? "cyber" : "secondary"}
                                size="sm"
                                className="text-[10px]"
                                onClick={() => setSampleInterval(value)}
                                disabled={!isConnected || isCapturing}
                            >
                                {value}ms
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="text-[10px] text-zinc-400">采样时长</div>
                    <div className="grid grid-cols-3 gap-2">
                        {[2000, 5000, 10000, 15000, 20000, 30000].map((value) => (
                            <Button
                                key={`duration-${value}`}
                                variant={sampleDurationMs === value ? "cyber" : "secondary"}
                                size="sm"
                                className="text-[10px]"
                                onClick={() => setSampleDuration(value)}
                                disabled={!isConnected || isCapturing}
                            >
                                {value / 1000}s
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
