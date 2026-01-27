import { create } from 'zustand';

type CaptureMode = 'region' | 'full';

interface EditorState {
  isRecording: boolean;
  isSelecting: boolean;
  selection: { x: number; y: number; width: number; height: number } | null;
  captureRequest: number;
  captureMode: CaptureMode;
  fileName: string;
  isCapturing: boolean;
  capturingProgress: number;
  sampleIntervalMs: number;
  sampleDurationMs: number;
  displayScale: number;
  setRecording: (isRecording: boolean) => void;
  setSelection: (selection: { x: number; y: number; width: number; height: number } | null) => void;
  setSelecting: (isSelecting: boolean) => void;
  requestCapture: (mode: CaptureMode) => void;
  setFileName: (fileName: string) => void;
  setCapturing: (isCapturing: boolean) => void;
  setCapturingProgress: (progress: number) => void;
  setSampleInterval: (ms: number) => void;
  setSampleDuration: (ms: number) => void;
  setDisplayScale: (scale: number) => void;
}

/**
 * 编辑器功能状态管理 Store
 * 管理截图流程、区域选择与采样参数
 */
export const useEditorStore = create<EditorState>((set) => ({
  isRecording: false,
  isSelecting: false,
  selection: null,
  captureRequest: 0,
  captureMode: 'full',
  fileName: '',
  isCapturing: false,
  capturingProgress: 0,
  sampleIntervalMs: 100,
  sampleDurationMs: 5000,
  displayScale: 1,
  setRecording: (isRecording) => set({ isRecording }),
  setSelection: (selection) => set({ selection }),
  setSelecting: (isSelecting) => set({ isSelecting }),
  requestCapture: (mode) => set((state) => ({ captureRequest: state.captureRequest + 1, captureMode: mode })),
  setFileName: (fileName) => set({ fileName }),
  setCapturing: (isCapturing) => set({ isCapturing }),
  setCapturingProgress: (progress) => set({ capturingProgress: Math.max(0, Math.min(1, progress)) }),
  setSampleInterval: (ms) => set({ sampleIntervalMs: Math.max(10, Math.min(1000, Math.round(ms))) }),
  setSampleDuration: (ms) => set({ sampleDurationMs: Math.max(500, Math.min(600000, Math.round(ms))) }),
  setDisplayScale: (scale) => set({ displayScale: Math.max(0.25, Math.min(4, Number.isFinite(scale) ? scale : 1)) }),
}));
