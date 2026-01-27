import { Adb } from "@yume-chan/adb";

/**
 * 使用 ADB screencap -p 获取设备截图
 * 修复了 Scrcpy 视频流分辨率对齐裁剪的问题
 */
export async function captureDeviceScreen(device: Adb): Promise<ImageBitmap> {
  const shellProtocol = device.subprocess.shellProtocol;
  let pngData: Uint8Array;

  if (shellProtocol) {
    const result = await shellProtocol.spawnWait("screencap -p");
    pngData = result.stdout;
  } else {
    // Fallback for older devices (pre-Android 7?)
    pngData = await device.subprocess.noneProtocol.spawnWait("screencap -p");
  }

  const blob = new Blob([pngData as any], { type: "image/png" });
  return createImageBitmap(blob);
}
