# Translate2Anki

> 划词翻译 + 一键生成 Anki 卡片

轻量级桌面翻译工具，支持划词翻译、AI 句子分析，一键生成带 TTS 语音的 Anki 单词卡/语法卡。

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## 功能特性

- **划词翻译** — 选中英文文本，按 `Ctrl+Shift+T`（macOS: `Cmd+Shift+T`）即可弹出翻译窗口
- **AI 智能分析** — 自动识别单词/长句，分别提供单词详情（释义、词性、词根、例句）或句子语法分析
- **一键生成 Anki 卡片** — 勾选需要学习的单词，一键生成带 TTS 语音的 Anki 单词卡和语法分析卡片
- **TTS 语音** — 窗口内实时朗读原文/翻译，Anki 卡片正面内置发音按钮
- **设置面板** — 内置可视化配置界面，支持 API Key、Base URL、Model 及提示词自定义
- **文本捕获重试** — 自动重试机制提高划词成功率
- **智能窗口定位** — 窗口跟随鼠标智能弹出，自动防越界

## 系统要求

- **Anki** — 需要安装 [Anki](https://apps.ankiweb.net/) 并启用 [AnkiConnect](https://foosoft.net/projects/anki-connect/) 插件（仅添加卡片时需要）
- **网络** — 需要联网使用 AI 翻译 API 和 Google TTS

## 快速开始

### 方式一：使用便携版（Windows，推荐）

1. 前往 [Releases](../../releases) 下载 `Translate2Anki 0.1.0.exe` 便携版
2. 双击运行即可使用，无需安装
3. 点击窗口右上角的 **⚙️ 设置** 按钮，配置 API Key
4. 确保 Anki 正在运行且已安装 AnkiConnect 插件
5. 在任何程序中选中英文文本，按 `Ctrl+Shift+T` 即可开始翻译

### 方式二：从源码运行

```bash
# 克隆项目
git clone https://github.com/yourname/translate2anki.git
cd translate2anki

# 安装依赖
npm install

# 配置环境变量（复制 .env.example 并填入你的 API key）
cp .env.example .env

# 启动应用
npm run build
npm start
```

### 使用方法

1. 启动应用后，点击右上角 **⚙️** 图标打开设置面板
2. 在「API 配置」Tab 中填入你的 API Key（如 DeepSeek）
3. 可选：在「提示词配置」Tab 中自定义系统提示词
4. 点击「保存并重载」，设置即时生效
5. 在任何程序中选中要翻译的英文文本
6. 按 `Ctrl+Shift+T` 快捷键
7. 翻译窗口会在鼠标附近弹出，显示翻译结果、词汇分析和语法分析
8. 勾选想要学习的单词，点击「添加到 Anki」生成单词卡
9. 关闭窗口或失去焦点后窗口会自动隐藏到托盘

## 配置

### 方式一：设置面板（推荐）

在应用内点击 **⚙️** 图标打开设置面板，支持以下配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| API 提供商 | DeepSeek / OpenAI / 自定义 | DeepSeek |
| API Key | 你的 API 密钥（必填） | 空 |
| API Base URL | API 服务地址 | `https://api.deepseek.com` |
| Model | 模型名称 | `deepseek-chat` |
| 提示词 | 翻译/单词分析/句子分析的系统提示词 | 内置默认值 |

设置会持久化保存到用户数据目录，下次启动自动加载。

### 方式二：`.env` 文件（开发模式）

在程序运行目录或项目根目录创建 `.env` 文件：

```env
# AI API 配置（必填）
AI_API_KEY=your-api-key-here
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-chat

# 提示词配置（可选，有默认值）
PROMPT_TRANSLATE=You are a translation assistant...
PROMPT_ANALYZE_WORD=Analyze the given English word...
PROMPT_ANALYZE_SENTENCE=Analyze the given English sentence...
```

> 当前默认使用 DeepSeek API。你也可以替换为任何兼容 OpenAI 格式的 API 服务。

## 打包发布

### Windows（已验证）

```bash
npm run dist
# 输出: dist/Translate2Anki 0.1.0.exe（便携版，直接运行）
```

### macOS / Linux

```bash
# macOS 需要安装 Xcode 命令行工具
npm run dist
# 输出: dist/Translate2Anki-0.1.0.dmg

# Linux
npm run dist
# 输出: dist/Translate2Anki-0.1.0.AppImage 或 .deb
```

> **注意**：跨平台打包建议在对应平台上分别执行 `npm run dist`，或使用 GitHub Actions CI/CD 自动构建。

## 开发指南

### 开发模式

```bash
npm run dev       # 启动 Vite 开发服务器
npm start         # 在另一个终端启动 Electron
```

### 运行测试

```bash
npm test          # 运行所有测试
```

### 项目结构

```
src/
  main/              # Electron 主进程
    config.ts          # 环境变量加载与默认配置
    settingsService.ts # 用户设置持久化（JSON 存储）
    main.ts            # 主进程入口（窗口、快捷键、IPC）
    shortcutManager.ts # 全局快捷键管理
    clipboardManager.ts# 剪贴板管理
  renderer/          # React 渲染层
    components/        # React 组件
      TranslationPanel   # 主翻译面板
      AddToAnkiButton    # 添加到 Anki 按钮
      SettingsPanel      # 设置面板
      LoadingSpinner     # 加载动画
    store/             # Zustand 状态管理
  services/          # 业务服务
    aiService.ts       # AI 翻译/分析服务
    ankiService.ts     # AnkiConnect 交互服务
    cacheService.ts    # 本地缓存服务
  preload/           # Electron preload 脚本
  types/             # TypeScript 类型定义
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+T`（`Cmd+Shift+T`） | 翻译选中文本 |

## 技术栈

- **Electron** — 跨平台桌面框架
- **React 18** — UI 框架
- **TypeScript** — 类型安全
- **Vite** — 构建工具
- **Tailwind CSS** — 样式框架
- **Zustand** — 状态管理
- **Axios** — HTTP 客户端
- **Jest** — 测试框架

## 许可证

MIT
