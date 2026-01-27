import { useEffect, useRef, useState, useCallback } from 'react';
import { Adb } from "@yume-chan/adb";
import { AdbScrcpyClient, AdbScrcpyOptions1_24 } from "@yume-chan/adb-scrcpy";
import { TinyH264Decoder } from "@yume-chan/scrcpy-decoder-tinyh264";
import type { ScrcpyVideoDecoder } from "@yume-chan/scrcpy-decoder-tinyh264";
import { WebCodecsVideoDecoder, WebGLVideoFrameRenderer, BitmapVideoFrameRenderer } from "@yume-chan/scrcpy-decoder-webcodecs";
import { ReadableStream } from "@yume-chan/stream-extra";

const SERVER_URL = '/scrcpy-server.jar?v=1.24';
const DEVICE_SERVER_PATH = '/data/local/tmp/scrcpy-server.jar';

interface UseScrcpyOptions {
  device: Adb | null;
}

export function useScrcpy({ device }: UseScrcpyOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const [streamSize, setStreamSize] = useState<{width: number, height: number} | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  
  const decoderRef = useRef<ScrcpyVideoDecoder | null>(null);
  const clientRef = useRef<AdbScrcpyClient<any> | null>(null);
  const removeSizeChangedRef = useRef<(() => void) | null>(null);

  const start = useCallback(async () => {
    if (!device) return;

    try {
      setIsRunning(true);

      // 1. 推送 Scrcpy Server
      console.log("[Scrcpy] Pushing server...");
      const response = await fetch(SERVER_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`下载 Scrcpy Server 失败: ${response.status}`);
      }
      const serverBuffer = await response.arrayBuffer();
      if (serverBuffer.byteLength < 20000) {
        throw new Error(`Scrcpy Server 文件异常: ${serverBuffer.byteLength} 字节`);
      }
      
      await AdbScrcpyClient.pushServer(
        device,
        new ReadableStream({
            start(controller) {
                controller.enqueue(new Uint8Array(serverBuffer));
                controller.close();
            }
        }),
        DEVICE_SERVER_PATH
      );

      // 2. 启动 Server
      console.log("[Scrcpy] Starting server...");
      // 使用 AdbScrcpyOptions1_24 包装配置
      const options = new AdbScrcpyOptions1_24({
        maxSize: 0,
        bitRate: 8_000_000,
        tunnelForward: true,
        sendFrameMeta: true,
      });

      console.log("[Scrcpy] Creating client...");
      const client = await AdbScrcpyClient.start(device, DEVICE_SERVER_PATH, options);
      clientRef.current = client;
      console.log("[Scrcpy] Client started successfully");

      // 3. 获取视频流
      console.log("[Scrcpy] Waiting for video stream...");
      const videoStream = await client.videoStream;
      if (!videoStream) {
        console.warn("[Scrcpy] No video stream available");
        return;
      }

      console.log("[Scrcpy] Video stream started", videoStream.metadata);
      if (videoStream.metadata.width && videoStream.metadata.height) {
        console.log(`[Scrcpy] Initial metadata size: ${videoStream.metadata.width}x${videoStream.metadata.height}`);
        setStreamSize({ 
          width: videoStream.metadata.width, 
          height: videoStream.metadata.height,
        });
      }

      const createCanvasElement = () => document.createElement('canvas');
      const createWebCodecsDecoder = () => {
        if (!WebCodecsVideoDecoder.isSupported) return null;
        const canvasElement = createCanvasElement();
        const renderer = WebGLVideoFrameRenderer.isSupported
          ? new WebGLVideoFrameRenderer(canvasElement, true)
          : new BitmapVideoFrameRenderer(canvasElement);
        return {
          decoder: new WebCodecsVideoDecoder({
            codec: videoStream.metadata.codec,
            renderer,
          }),
          canvas: canvasElement,
        };
      };

      const webCodecsResult = createWebCodecsDecoder();
      let decoder: ScrcpyVideoDecoder;
      if (webCodecsResult) {
        console.log("[Scrcpy] Using WebCodecs decoder");
        decoder = webCodecsResult.decoder;
        setCanvas(webCodecsResult.canvas);
      } else {
        console.log("[Scrcpy] WebCodecs not supported, fallback to TinyH264");
        const canvasElement = createCanvasElement();
        decoder = new TinyH264Decoder({ canvas: canvasElement });
        setCanvas(canvasElement);
      }

      decoderRef.current = decoder;
      removeSizeChangedRef.current?.();
      removeSizeChangedRef.current = decoder.sizeChanged((size) => {
        setStreamSize(size);
      });

      // 4. 处理流
      let frameCount = 0;
      console.log("[Scrcpy] Piping video stream to decoder...");

      // @ts-ignore: Stream type mismatch
      videoStream.stream
        // @ts-ignore
        .pipeThrough(new TransformStream({
          transform(chunk, controller) {
            frameCount++;
            // @ts-ignore
            console.log(`[Scrcpy] Received frame ${frameCount}, chunk size: ${chunk.data?.byteLength || chunk.byteLength || 'unknown'}`);
            controller.enqueue(chunk);
          },
        }))
        // @ts-ignore
        .pipeTo(decoder.writable)
        .catch((e: any) => console.error("[Scrcpy] Stream pipe error:", e));

    } catch (e) {
      console.error("[Scrcpy] Setup error:", e);
      setIsRunning(false);
    }
  }, [device]);

  const stop = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.close();
      clientRef.current = null;
    }
    if (decoderRef.current) {
        decoderRef.current.dispose();
        decoderRef.current = null;
    }
    setIsRunning(false);
    setStreamSize(null);
    setCanvas(null);
  }, []);

  useEffect(() => {
    console.log("[Scrcpy] useEffect triggered", { device: !!device, isRunning });
    if (device && !isRunning) {
      console.log("[Scrcpy] Calling start()...");
      start();
    }
    return () => {
        // Cleanup only if device changes or unmount
        // stop(); 
        // Note: calling stop() here might be problematic if it's just a re-render.
        // But since we depend on [device], it should be fine.
    };
  }, [device]); 

  useEffect(() => {
      return () => {
          stop();
      }
  }, [stop]);

  return {
    isRunning,
    streamSize,
    canvas,
    start,
    stop
  };
}
