import { useState } from 'react';
import { Smartphone, RefreshCw, Power, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeviceStore } from '@/stores/device-store';
import { AdbDaemonWebUsbDeviceManager } from "@yume-chan/adb-daemon-webusb";
import { Adb, AdbDaemonTransport } from "@yume-chan/adb";
import AdbWebCredentialStore from "@yume-chan/adb-credential-web";

export function Sidebar() {
  const { isConnected, deviceName, setDevice, disconnect } = useDeviceStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;
      if (!Manager) {
        throw new Error("当前浏览器不支持 WebUSB");
      }

      const device = await Manager.requestDevice();
      if (!device) {
        setLoading(false);
        return;
      }

      const connection = await device.connect();
      
      // 使用 Web 凭证存储 (localStorage)
      const credentialStore = new AdbWebCredentialStore();

      const transport = await AdbDaemonTransport.authenticate({
        serial: device.serial,
        connection,
        credentialStore,
      });

      const adb = new Adb(transport);
      
      setDevice(adb, device.serial);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Unable to claim interface')) {
        setError("连接失败：接口被占用。请确保设备未被其他程序（如 Android Studio、adb server）占用，或在终端执行 'adb kill-server' 后重试。");
      } else {
        setError(err.message || "连接失败");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Monitor className="text-cyan-500 w-6 h-6" />
        <span className="text-lg font-bold tracking-wider text-zinc-100">ALPHA<span className="text-cyan-500">EDITOR</span></span>
      </div>

      <div className="flex-1">
        <div className="text-xs font-mono text-zinc-500 mb-2 uppercase tracking-widest">设备状态</div>
        
        {isConnected ? (
          <div className="bg-zinc-900/50 border border-cyan-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Smartphone className="text-cyan-400 w-5 h-5" />
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-cyan-100 truncate">{deviceName}</div>
                <div className="text-xs text-cyan-500/70">在线</div>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full mt-2 text-xs h-7"
              onClick={disconnect}
            >
              断开连接
            </Button>
          </div>
        ) : (
          <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <Smartphone className="text-zinc-700 w-8 h-8 mb-2" />
            <div className="text-xs text-zinc-500 mb-4">未连接设备</div>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : <Power className="w-3 h-3 mr-2" />}
              连接设备
            </Button>
            {error && <div className="text-[10px] text-red-500 mt-2 text-left w-full break-all">{error}</div>}
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-zinc-800 pt-4">
        <div className="text-[10px] text-zinc-600 font-mono">
          v0.1.0-alpha<br/>
          系统状态: 就绪
        </div>
      </div>
    </div>
  );
}
