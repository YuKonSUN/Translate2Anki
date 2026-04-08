# Translate2Anki 设计文档

## 项目概述

Translate2Anki 是一个桌面应用程序，支持划词翻译并将学习内容一键导入 Anki。主要功能包括：

- **划词翻译**：在任意文本中选择单词或句子进行翻译
- **深度分析**：提供词根分析、语法分析、核心词汇提取
- **Anki集成**：一键导入到 Anki 中，支持混合卡片模板
- **双向练习**：支持英文到中文和中文到英文的双向学习
- **跨平台**：基于 Electron，支持 Windows、macOS

## 技术架构

### 技术栈选择
- **前端框架**：Electron + React + TypeScript
- **样式方案**：Tailwind CSS 或 styled-components
- **状态管理**：Zustand 或 Redux Toolkit
- **打包工具**：Vite 或 Webpack
- **API通信**：支持 OpenAI 兼容格式的 AI 服务

### 系统架构
```
Electron 桌面应用
├── React 前端界面
├── 业务逻辑层（文本处理、API调用、数据解析）
├── 数据存储层（配置、缓存、密钥）
├── 外部服务集成
│   ├── AI API 服务（DeepSeek/OpenAI 等）
│   └── AnkiConnect 服务
```

## 核心功能模块

### 1. 文本捕获模块
- **系统级监听**：使用 Electron `globalShortcut` 监听快捷键，配合系统剪贴板捕获选中文本
  - Windows/macOS：监听全局快捷键，读取系统剪贴板获取选中文本
  - 备用方案：使用系统原生模块（如 Windows 的 `user32.dll`）增强文本捕获能力
- **触发方式**：默认快捷键 `Ctrl+Shift+T`，用户可自定义
- **文本处理**：清理空格、检测语言类型、区分单词/句子
  - 语言检测：基于字符统计和常见模式
  - 模式判断：单词（1-3个单词）、短语（4-8个单词）、句子（8+个单词或有标点）

### 2. AI 翻译与分析模块
- **API 兼容性**：支持所有 OpenAI 兼容格式的 API
- **分析能力**：
  - 单词模式：翻译、词性、词根分析、例句
  - 句子模式：翻译、语法分析、核心词汇提取
- **缓存机制**：
  - 相同文本 24 小时内使用本地缓存
  - 缓存分级：翻译结果（24小时）、词根分析（7天）、语法分析（7天）
  - 回退策略：API 失败时使用最近的成功缓存（即使过期）
  - 缓存清理：自动清理过期缓存，限制总缓存大小（默认 100MB）

### 3. 用户界面模块
采用分层式弹出窗口设计：

```
┌─────────────────────────────────────┐
│  选中文本: "This book is interesting." │
├─────────────────────────────────────┤
│ 翻译: "这本书很有趣。"                │
│                                     │
│ ▸ 语法分析                          │
│   - This: 代词，主语                │
│   - book: 名词，主语的核心          │
│   - is: 系动词，谓语                │
│   - interesting: 形容词，表语        │
│   - 句型: 主系表结构                │
│                                     │
│ ▸ 核心词汇（点击添加到Anki）         │
│   [interesting] [book] [this] [is]  │
│                                     │
│ ▸ 词根分析（点击词汇查看）            │
│   • interesting: interest + -ing     │
│     inter- (之间) + esse (存在)     │
│                                      │
│ [添加到Anki（全部）] [关闭]          │
└─────────────────────────────────────┘
```

### 4. Anki 集成模块
- **通信方式**：通过 AnkiConnect HTTP API (localhost:8765)
  - 启动检测：应用启动时检查 AnkiConnect 是否可用
  - 连接测试：定期测试连接状态（每 5 分钟）
  - 自动重连：连接失败时自动重试（最多 3 次）
- **卡片模板**：混合卡片模式（见下文）
  - 模板创建：首次使用时自动在 Anki 中创建所需模板
  - 字段验证：确保模板字段与应用定义匹配
- **批量操作**：支持一次添加多个选中的单词
  - 进度显示：批量添加时显示进度条
  - 错误恢复：单个卡片添加失败不影响其他卡片
- **错误处理**：
  - 网络超时：10 秒超时，重试 2 次
  - Anki 未运行：提示用户启动 Anki 并安装 AnkiConnect
  - 牌组不存在：自动创建默认牌组或让用户选择现有牌组

### 5. 配置管理模块
- **API 密钥管理**：安全存储 AI API 密钥
- **快捷键设置**：用户可自定义触发快捷键
- **Anki 设置**：牌组选择、卡片模板配置
- **语言设置**：源语言、目标语言偏好

## 卡片模板设计

### 混合卡片模板
```
正面1（60%概率显示）：
  [英文句子]

正面2（40%概率显示）：
  [中文句子]
  练习：请翻译成英文

背面：
  对应翻译: [对应语言翻译]
  语法分析: [句子语法结构]
  核心词汇: [点击查看详细]
    • word1: [意思] [词根]
    • word2: [意思] [词根]
  我的练习: [留空用于用户填写答案]
```

### 卡片字段定义
```typescript
interface AnkiCardFields {
  front: string;      // 正面内容（英文或中文）
  back: string;       // 背面完整信息
  sentence: string;   // 原始句子
  translation: string; // 翻译
  grammar: string;    // 语法分析
  words: string;      // 核心词汇 JSON 数据
  exercise: string;   // 用户练习区
}
```

## API 集成设计

### 统一 API 接口
```typescript
interface AIServiceConfig {
  provider: 'openai' | 'deepseek' | 'anthropic' | 'custom';
  baseURL: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

// 支持的 OpenAI 兼容服务
const openAICompatibleServices = [
  'openai', 'deepseek', 'together', 'fireworks', 'groq'
];
```

### 提示词设计
- **单词分析**：获取翻译、词性、词根、例句
- **句子分析**：获取翻译、语法分析、核心词汇提取
- **词根分析**：获取词源、前缀、后缀、词根含义

### 错误处理与重试
1. 主 API 失败时自动切换备用服务
2. 网络超时重试（最多 3 次）
3. 本地缓存回退机制

## 配置文件结构

```json
{
  "version": "1.0.0",
  "aiServices": [
    {
      "name": "DeepSeek",
      "provider": "deepseek",
      "baseURL": "https://api.deepseek.com",
      "apiKey": "encrypted_key_here",
      "model": "deepseek-chat",
      "enabled": true,
      "maxTokens": 2000
    },
    {
      "name": "OpenAI",
      "provider": "openai",
      "baseURL": "https://api.openai.com",
      "apiKey": "encrypted_key_here",
      "model": "gpt-4-turbo",
      "enabled": false,
      "maxTokens": 2000
    }
  ],
  "anki": {
    "host": "localhost:8765",
    "defaultDeck": "英语学习",
    "cardTemplate": "混合卡片模板",
    "tags": ["translate2anki", "英语"]
  },
  "shortcuts": {
    "triggerTranslation": "Ctrl+Shift+T",
    "toggleWindow": "Ctrl+Shift+X",
    "quickAdd": "Ctrl+Shift+A"
  },
  "language": {
    "source": "auto",
    "target": "zh-CN",
    "preferDetailedAnalysis": true
  },
  "appearance": {
    "theme": "system",
    "fontSize": 14,
    "windowWidth": 500,
    "windowHeight": 600
  },
  "cache": {
    "enable": true,
    "durationHours": 24,
    "maxSizeMB": 100
  }
}
```

## 数据存储设计

### 本地存储结构
```
~/.translate2anki/
├── config.json          # 应用配置
├── cache/              # API 响应缓存
│   ├── translations/
│   ├── word_analysis/
│   └── grammar_analysis/
├── logs/               # 应用日志
└── history/           # 学习历史记录
```

### 数据安全
- **API 密钥存储**：
  - Windows：使用 Windows Credential Manager
  - macOS：使用 macOS Keychain
  - Linux：使用 libsecret 或加密配置文件
- **本地加密**：敏感配置使用 AES-256-GCM 加密，密钥派生自用户主密码
- **数据隐私**：所有用户数据本地存储，不上传云端
- **传输安全**：所有 API 调用使用 HTTPS，AnkiConnect 使用本地回环地址

## 错误处理与日志

### 错误类型
1. **网络错误**：API 调用失败、AnkiConnect 连接失败
2. **配置错误**：API 密钥无效、Anki 牌组不存在
3. **用户错误**：无效文本选择、操作取消

### 日志策略
- 错误日志持久化存储
- 调试模式开关
- 用户可选择发送匿名错误报告

## 扩展性设计

### 插件系统（未来）
- **词典插件**：集成本地词典数据
- **TTS 插件**：单词发音功能
- **主题插件**：自定义界面主题
- **导出插件**：支持 CSV、Excel 格式导出

### 学习统计（未来）
- 学习进度跟踪
- 单词掌握程度评估
- 学习报告生成

## 开发计划

### 第一阶段：核心功能
1. Electron 应用脚手架
2. 基础界面框架
3. 文本捕获功能
4. DeepSeek API 集成
5. AnkiConnect 基本集成

### 第二阶段：完善功能
1. 混合卡片模板实现
2. 语法分析和词根分析
3. 配置管理界面
4. 错误处理和日志

### 第三阶段：优化体验
1. 性能优化和缓存
2. 更多 AI 服务支持
3. 主题和个性化
4. 安装包和发布

## 成功标准

1. **功能完整**：支持划词翻译、分析、一键导入 Anki
2. **性能良好**：响应时间 < 2 秒（API 调用除外）
3. **稳定性高**：无崩溃，错误处理完善
4. **用户体验**：界面直观，操作流畅
5. **扩展性强**：易于添加新功能和集成

---

*文档版本：1.0*
*创建日期：2026-04-02*
*最后更新：2026-04-02*