import { create } from 'zustand';
import { Adb } from "@yume-chan/adb";

interface DeviceState {
  device: Adb | null;
  isConnected: boolean;
  deviceName: string | null;
  setDevice: (device: Adb | null, name?: string) => void;
  disconnect: () => void;
}

/**
 * 设备状态管理 Store
 * 管理 ADB 设备连接状态
 */
export const useDeviceStore = create<DeviceState>((set) => ({
  device: null,
  isConnected: false,
  deviceName: null,
  setDevice: (device, name) => set({ 
    device, 
    isConnected: !!device,
    deviceName: name || (device ? 'Android 设备' : null) 
  }),
  disconnect: () => set({ device: null, isConnected: false, deviceName: null }),
}));
