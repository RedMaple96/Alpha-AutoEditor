# Alpha-AutoEditor

基于 WebUSB + Scrcpy 的浏览器端 Android 画面预览与截图工具，支持区域/全屏截图、动态像素透明化导出与可调采样参数。

## 功能特性
- 通过 WebUSB 连接 Android 设备并实时显示画面
- 画面按设备真实分辨率输出，支持独立缩放显示
- 区域截图与全屏截图
- 多帧采样差异分析，将动态像素透明化导出 PNG
- 自定义截图文件名
- 截图处理中进度提示与采样参数显示

## 使用前准备
- 设备开启 USB 调试
- 使用支持 WebUSB 的浏览器（Chrome / Edge）
- 使用 USB 数据线连接设备

## 安装与运行
```bash
npm install
npm run dev
```

打开开发服务器地址后，在左侧面板连接设备，右侧控制中心进行截图与参数设置。

## 截图说明
- 区域截图：在画面上拖拽选择区域后自动开始处理
- 全屏截图：直接捕获当前画面
- 采样参数：在“偏好设置”中配置采样间隔与时长
- 文件命名：在“导出”模块中设置文件名，默认使用时间戳

## 可配置参数
- 采样间隔：默认 100ms
- 采样时长：默认 5s
- 显示缩放：25% - 200%，不影响截图分辨率

## 常用脚本
```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## 目录结构
- src/components/layout：主界面布局（侧边栏、主舞台、控制中心）
- src/hooks/use-scrcpy.ts：Scrcpy 连接与视频流处理
- src/stores：Zustand 状态管理
- public/scrcpy-server.jar：Scrcpy Server 文件
