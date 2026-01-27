/**
 * 动效分析核心算法
 * @param ctxCurrent 当前帧 Context
 * @param ctxLast 上一帧 Context
 * @param ctxOverlay 叠加层 Context
 * @param width 宽度
 * @param height 高度
 * @param threshold 像素差异阈值 (0-255)
 */
export function analyzeFrame(
    ctxCurrent: CanvasRenderingContext2D,
    ctxLast: CanvasRenderingContext2D,
    ctxOverlay: CanvasRenderingContext2D,
    width: number,
    height: number,
    threshold: number = 30
  ) {
    const currentData = ctxCurrent.getImageData(0, 0, width, height);
    const lastData = ctxLast.getImageData(0, 0, width, height);
    
    // 创建 Diff 图像数据
    const diffImage = ctxOverlay.createImageData(width, height);
    const diffData = diffImage.data;
    const cur = currentData.data;
    const last = lastData.data;
    
    let changedPixels = 0;
  
    // 遍历像素进行比较
    for (let i = 0; i < cur.length; i += 4) {
        const rDiff = Math.abs(cur[i] - last[i]);
        const gDiff = Math.abs(cur[i + 1] - last[i + 1]);
        const bDiff = Math.abs(cur[i + 2] - last[i + 2]);
        
        // 如果 RGB 差异总和超过阈值，认为该像素发生了变化
        if (rDiff + gDiff + bDiff > threshold) {
            // 标记为红色 (RGBA)
            diffData[i] = 255;     // R
            diffData[i + 1] = 0;   // G
            diffData[i + 2] = 60;  // B
            diffData[i + 3] = 100; // Alpha (半透明)
            changedPixels++;
        } else {
            diffData[i + 3] = 0; // 无变化则完全透明
        }
    }
  
    // 将 Diff 结果绘制到叠加层
    ctxOverlay.putImageData(diffImage, 0, 0);
  
    return changedPixels;
  }
