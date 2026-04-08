# Translate2Anki 功能改进设计文档

## 概述

本设计文档针对 Translate2Anki 应用的四个核心改进需求：
1. **颜色调整**：Anki卡片背面文字颜色太暗，需要提高亮度和对比度
2. **TTS集成**：单词/句子正面添加语音播放功能
3. **窗口优化**：缩小悬浮窗口尺寸，改进鼠标定位体验
4. **选中文本**：优化 Ctrl+Shift+T 快捷键的文本捕获可靠性

采用渐进优化方案，在现有架构上进行最小化改动，快速实现功能改进。

## 需求分析

### 1. 颜色问题
- **现象**：单词卡片背面的文字颜色在 Anki 暗色主题下难以看清
- **影响部分**：
  - 含义文字颜色 (#2563eb)
  - 词性文字颜色 (#4b5563)  
  - 词根文字颜色 (#7c3aed)
  - 例句背景颜色 (#f3f4f6)
- **目标**：提高颜色亮度和对比度，确保在亮色/暗色主题下都清晰可读

### 2. 语音播放功能
- **需求**：为单词和句子卡片正面添加语音播放功能
- **方案选择**：使用 Anki 内置 TTS 功能，预生成音频文件
- **技术路径**：通过 AnkiConnect API 存储音频文件，卡片使用 `[sound:...]` 标签

### 3. 悬浮窗口体验
- **现状**：窗口尺寸 500x700，使用 `showWindowAtCursor()` 函数定位
- **问题**：窗口偏大，不够像轻量级悬浮工具
- **目标**：缩小窗口尺寸，优化定位算法，增强悬浮感

### 4. 文本捕获可靠性
- **现状**：使用剪贴板模拟 (Ctrl+C) 获取选中文本
- **问题**：在某些应用中可能无效
- **目标**：添加重试机制和用户反馈，提高成功率

## 设计方案

### 1. 颜色调整方案

#### 颜色映射表
| 元素 | 原颜色 | 新颜色 | 改进说明 |
|------|--------|--------|----------|
| 含义文字 | `#2563eb` | `#3b82f6` | 更亮的蓝色，提高对比度 |
| 词性文字 | `#4b5563` | `#6b7280` | 中灰色，在暗色背景下更清晰 |
| 词根文字 | `#7c3aed` | `#8b5cf6` | 更亮的紫色，增强可读性 |
| 例句背景 | `#f3f4f6` | `#f8fafc` | 更亮的浅蓝灰背景 |
| 例句边框 | `#3b82f6` | `#60a5fa` | 匹配新蓝色调 |

#### 实现位置
- 文件：`src/services/ankiService.ts`
- 函数：`createWordCard()` 和 `createGrammarCard()`
- 行号：115-146（单词卡片），173-185（语法卡片）

#### 验证标准
- 在 Anki 亮色主题下保持良好可读性
- 在 Anki 暗色主题下文字清晰可见
- 颜色搭配协调，符合视觉层次

### 2. TTS 集成方案

#### 架构设计
```
翻译流程
  ↓
生成单词/句子音频 (TTS API)
  ↓
存储到 Anki 媒体库 (storeMediaFile)
  ↓
卡片模板集成 [sound:filename.mp3]
  ↓
Anki 播放时调用音频文件
```

#### 音频生成策略
1. **API 选择**：使用在线 TTS 服务（Google TTS 或 Edge TTS）
2. **文件格式**：MP3 格式，44.1kHz，128kbps
3. **命名规则**：`tts_${hash(text)}.mp3`（基于文本内容的哈希）
4. **缓存机制**：相同文本只生成一次音频

#### AnkiService 扩展
```typescript
// 新增方法
class AnkiService {
  async generateAndStoreAudio(text: string, lang: string = 'en'): Promise<string>
  async fetchTTS(text: string, lang: string): Promise<ArrayBuffer>
  private hash(text: string): string
  
  // 修改现有方法
  async createWordCard(data: WordCardData): Promise<number>
  async createGrammarCard(data: GrammarCardData): Promise<number>
}
```

#### 卡片模板修改
**单词卡片正面**：
```html
<div style="...">${data.word}</div>
<div style="text-align: center; margin-top: 10px;">
  [sound:${wordAudioFilename}]
  <span style="font-size: 14px; color: #6b7280;">🔊 点击播放发音</span>
</div>
```

**语法卡片正面**：
```html
<div style="...">${data.sentence}</div>
<div style="text-align: center; margin-top: 10px;">
  [sound:${sentenceAudioFilename}]
  <span style="font-size: 14px; color: #6b7280;">🔊 点击播放发音</span>
</div>
```

#### 错误处理
- TTS API 不可用时：跳过音频生成，只保留文字提示
- 存储失败时：记录错误，不影响卡片创建
- 网络超时：30秒超时，最多重试2次

### 3. 窗口优化方案

#### 窗口尺寸调整
| 参数 | 原值 | 新值 | 说明 |
|------|------|------|------|
| width | 500 | 400 | 减少20%，更紧凑 |
| height | 700 | 500 | 减少28%，更轻量 |
| minWidth | - | 350 | 添加最小宽度限制 |
| minHeight | - | 400 | 添加最小高度限制 |

#### 定位算法优化
**当前问题**：
- 简单的右下方定位
- 边界检查不够精细
- 多显示器支持有限

**优化方案**：
```typescript
function showWindowAtCursor() {
  // 1. 获取鼠标位置和当前显示器
  const cursorPosition = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPosition);
  
  // 2. 计算初始位置（鼠标右下方10px）
  let x = cursorPosition.x + 10;
  let y = cursorPosition.y + 10;
  
  // 3. 智能边界检查
  const windowBounds = mainWindow.getBounds();
  const displayBounds = display.workArea;
  
  // 右侧超出：显示在鼠标左侧
  if (x + windowBounds.width > displayBounds.x + displayBounds.width) {
    x = cursorPosition.x - windowBounds.width - 10;
  }
  
  // 底部超出：显示在鼠标上方  
  if (y + windowBounds.height > displayBounds.y + displayBounds.height) {
    y = cursorPosition.y - windowBounds.height - 10;
  }
  
  // 4. 确保在屏幕内
  x = Math.max(displayBounds.x, Math.min(x, displayBounds.x + displayBounds.width - windowBounds.width));
  y = Math.max(displayBounds.y, Math.min(y, displayBounds.y + displayBounds.height - windowBounds.height));
  
  // 5. 设置位置并显示
  mainWindow.setPosition(Math.floor(x), Math.floor(y));
  mainWindow.show();
  mainWindow.focus();
}
```

#### 视觉增强
1. **阴影效果**：添加 `shadow: true` 窗口属性
2. **圆角边框**：通过 CSS 实现圆角（已在组件中实现）
3. **透明度**：保持不透明，确保文字清晰

### 4. 选中文本优化

#### 重试机制
```typescript
async function getSelectedTextWithRetry(maxRetries: number = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const text = await getSelectedText();
      if (text && text.trim().length > 0) {
        return text;
      }
      
      // 等待后重试
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
      }
    } catch (error) {
      console.warn(`获取选中文本失败（尝试 ${attempt}/${maxRetries}）:`, error);
    }
  }
  return '';
}
```

#### 用户反馈
在 UI 中添加状态提示：
- "正在获取选中文本..."
- "获取成功"
- "未能获取选中文本，请手动复制"

#### 备选方案
如果自动获取失败，显示输入框让用户手动粘贴：
```typescript
function showManualInputDialog() {
  // 显示简单的文本输入框
  // 用户粘贴后继续翻译流程
}
```

## 技术实现细节

### 文件修改列表

#### 1. ankiService.ts
- **颜色调整**：修改 `createWordCard()` 函数中的 CSS 颜色值
- **TTS 集成**：添加 `generateAndStoreAudio()` 和相关辅助方法
- **卡片生成**：更新 `createWordCard()` 和 `createGrammarCard()` 集成音频

#### 2. main.ts
- **窗口尺寸**：修改 `createWindow()` 中的 width 和 height
- **定位优化**：改进 `showWindowAtCursor()` 函数的边界检查
- **重试机制**：添加 `getSelectedTextWithRetry()` 函数

#### 3. TranslationPanel.tsx
- **用户反馈**：添加文本获取状态提示
- **手动输入**：添加备选的文本输入界面

#### 4. 新增文件
- **ttsService.ts**：TTS API 封装（可选，如果逻辑复杂）

### 依赖更新

#### 哈希函数实现
**决策**：使用简单哈希函数，避免添加新依赖。

```typescript
/**
 * 简单的文本哈希函数，生成唯一的文件名标识
 * 使用 djb2 哈希算法变体
 */
function textHash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i); // hash * 33 + char
  }
  // 返回正数的16进制表示，确保文件名合法
  return Math.abs(hash).toString(16).substring(0, 12);
}

// 使用示例
const filename = `tts_${textHash('example word')}.mp3`; // 例如: tts_abc123def456.mp3
```

**特性**：
- 确定性：相同文本总是生成相同哈希
- 简短：12字符十六进制，适合文件名
- 快速：O(n)时间复杂度，适合短文本
- 无碰撞风险：对于单词和句子，碰撞概率极低

### API 集成

#### TTS API 选择
**选择方案A：Google TTS**
- **原因**：实现简单，无需认证，适合基础需求
- **URL格式**：
  ```
  https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=${lang}
  ```
- **参数说明**：
  - `ie=UTF-8`：编码格式
  - `client=tw-ob`：客户端标识
  - `q`：编码后的文本
  - `tl`：目标语言（en 或 zh-CN）

**实现细节**：
```typescript
async fetchTTS(text: string, lang: string): Promise<ArrayBuffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=${lang}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.arrayBuffer();
}
```

**备选方案**：如果Google TTS被屏蔽或失败，降级到纯文字模式，不生成音频。

**未来扩展**：可添加Edge TTS或本地TTS作为配置选项。

### 性能考虑

1. **音频文件大小**：限制文本长度（单词≤20字符，句子≤200字符）
2. **并发请求**：避免同时生成多个音频文件
3. **缓存策略**：本地缓存已生成的音频文件名映射
4. **内存使用**：及时释放音频数据缓冲区

### 错误处理策略

| 错误类型 | 处理方式 | 用户反馈 |
|----------|----------|----------|
| TTS API 失败 | 跳过音频，只创建文字卡片 | "音频生成失败，已创建文字卡片" |
| 存储失败 | 记录日志，继续创建卡片 | "音频存储失败，卡片创建成功" |
| 网络超时 | 重试2次后放弃 | "网络超时，跳过音频生成" |
| 文本过长 | 截断或跳过 | "文本过长，跳过音频生成" |

## 测试计划

### 单元测试
1. **颜色值验证**：确保新颜色值有效
2. **哈希函数测试**：验证文本哈希的唯一性和稳定性
3. **边界检查测试**：验证窗口定位算法的正确性
4. **重试逻辑测试**：验证重试机制的工作方式

### 集成测试
1. **TTS 集成测试**：模拟 TTS API 响应，验证音频生成和存储
2. **AnkiConnect 测试**：验证卡片创建包含音频标签
3. **窗口定位测试**：在不同屏幕位置测试窗口显示
4. **快捷键测试**：验证 Ctrl+Shift+T 的完整工作流程

### 手动测试
1. **颜色对比度**：在 Anki 亮色/暗色主题下验证可读性
2. **音频播放**：在 Anki 中点击卡片验证音频播放
3. **多显示器**：在多显示器配置下测试窗口定位
4. **不同应用**：在浏览器、编辑器、PDF阅读器中测试文本捕获

## 部署与兼容性

### 向后兼容性
- **颜色更改**：完全兼容，只影响视觉
- **TTS 集成**：向后兼容，没有音频的卡片仍可正常使用
- **窗口尺寸**：现有用户需要适应新尺寸

### 配置迁移
无需配置迁移，所有更改都是代码级的。

### 用户影响
1. **正面影响**：
   - 卡片更易阅读
   - 新增语音功能
   - 窗口更轻量
2. **潜在影响**：
   - 窗口变小可能影响内容显示
   - TTS 功能需要网络连接

## 风险与缓解

### 风险1：TTS API 限制
- **风险**：免费 TTS API 有调用限制或可能被屏蔽
- **缓解**：
  1. 实现多个 TTS 服务备选
  2. 添加禁用 TTS 的配置选项
  3. 优雅降级到纯文字模式

### 风险2：窗口太小
- **风险**：400x500 可能显示不全长句子或词汇列表
- **缓解**：
  1. 添加内容滚动（已实现）
  2. 允许用户调整窗口大小（resizable: true）
  3. 智能内容截断和省略

### 风险3：定位算法复杂
- **风险**：多显示器边缘情况处理复杂
- **缓解**：
  1. 使用 Electron 内置的屏幕管理 API
  2. 添加详细的日志记录
  3. 回退到屏幕中央显示

## 成功标准

### 功能成功标准
1. ✅ 卡片颜色在 Anki 暗色主题下清晰可读
2. ✅ 单词/句子卡片正面点击可播放语音
3. ✅ 窗口在鼠标附近智能显示，不超出屏幕
4. ✅ Ctrl+Shift+T 文本捕获成功率提高

### 性能成功标准
1. ⏱️ 音频生成不影响卡片创建速度（< 500ms 延迟）
2. 🖥️ 窗口显示响应时间 < 100ms
3. 💾 内存使用增加 < 50MB（TTS 缓冲）

### 用户体验标准
1. 👍 用户反馈颜色问题得到解决
2. 🎧 语音功能工作正常
3. 🎯 窗口定位准确自然
4. 📋 文本捕获更可靠

## 未来扩展

### 短期扩展（本次实现后）
1. **更多 TTS 服务**：集成本地 TTS 引擎
2. **自定义颜色**：允许用户自定义卡片颜色方案
3. **窗口记忆**：记住用户最后调整的窗口位置和大小

### 长期扩展
1. **离线 TTS**：集成完全离线的语音合成
2. **智能定位**：基于应用窗口内容的更智能定位
3. **手势支持**：添加鼠标手势触发翻译

## 时间估算

| 任务 | 预估时间 | 优先级 |
|------|----------|--------|
| 颜色调整 | 1小时 | P0 |
| 窗口尺寸调整 | 30分钟 | P0 |
| TTS 基础实现 | 3小时 | P1 |
| 定位算法优化 | 1小时 | P1 |
| 重试机制 | 1小时 | P2 |
| 测试和调试 | 2小时 | P2 |
| **总计** | **8.5小时** | |

## 结论

本设计方案通过渐进优化方式，在现有架构基础上实现四项核心改进：
1. **视觉优化**：提高卡片颜色对比度
2. **功能增强**：添加 TTS 语音支持
3. **体验改进**：优化悬浮窗口体验
4. **可靠性提升**：增强文本捕获机制

所有改动都是最小化的、可逆的，风险可控。实现后将为用户提供显著更好的使用体验。

---
*文档版本：1.0*
*创建日期：2026-04-08*
*最后更新：2026-04-08*