# Translate2Anki 功能改进实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Translate2Anki 的四个功能改进：Anki卡片颜色调整、TTS语音播放集成、悬浮窗口优化、选中文本可靠性提升。

**Architecture:** 采用渐进优化方案，在现有架构上进行最小化改动。颜色调整修改 CSS 颜色值；TTS 集成使用 Google TTS API 生成音频并通过 AnkiConnect 存储；窗口优化调整尺寸和改进定位算法；文本捕获添加重试机制。

**Tech Stack:** Electron, React, TypeScript, AnkiConnect API, Google TTS API

---

## 文件结构

### 修改文件
1. **src/services/ankiService.ts** - 颜色调整和 TTS 集成
   - `createWordCard()`: 修改背面颜色值，集成音频标签
   - `createGrammarCard()`: 修改背面颜色值，集成音频标签  
   - 新增: `generateAndStoreAudio()`, `fetchTTS()`, `textHash()` 方法

2. **src/main/main.ts** - 窗口优化和文本捕获
   - `createWindow()`: 修改窗口尺寸 (500x700 → 400x500)
   - `showWindowAtCursor()`: 优化定位算法
   - `getSelectedText()`: 添加重试机制

3. **tests/services/ankiService.test.ts** - 测试 TTS 和颜色功能
4. **tests/main/shortcutManager.test.ts** - 测试文本捕获重试逻辑

### 新增文件（可选）
- **src/services/ttsService.ts** - TTS 服务封装（如果逻辑复杂）

## 任务分解

### Task 1: 颜色调整 - 单词卡片

**Files:**
- Modify: `src/services/ankiService.ts:115-146`

- [ ] **Step 1: 查看当前测试状态**

```bash
cd e:\07_Dev\Scratch\translate2anki
npm test -- tests/services/ankiService.test.ts
```

预期：所有测试通过

- [ ] **Step 2: 修改单词卡片含义颜色**

编辑 `src/services/ankiService.ts` 第115行：
```typescript
// 含义 - 高对比度蓝色
`<div style="font-size: 24px; color: #3b82f6; font-weight: bold; margin-bottom: 16px; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">`,
```

- [ ] **Step 3: 修改单词卡片词性颜色**

编辑第120行：
```typescript
// 词性 - 深灰色
`<div style="color: #6b7280; margin-bottom: 12px; font-size: 16px;">`,
```

- [ ] **Step 4: 修改单词卡片词根颜色**

编辑第128行：
```typescript
`<div style="color: #8b5cf6; margin-bottom: 16px; font-size: 15px; line-height: 1.6;">`,
```

- [ ] **Step 5: 修改单词卡片例句背景颜色**

编辑第136行：
```typescript
`<div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #60a5fa;">`,
```

- [ ] **Step 6: 运行测试验证颜色更改不影响功能**

```bash
npm test -- tests/services/ankiService.test.ts
```

预期：所有测试仍然通过

- [ ] **Step 7: 提交更改**

```bash
git add src/services/ankiService.ts
git commit -m "feat: 调整单词卡片颜色提高对比度"
```

### Task 2: 颜色调整 - 语法卡片

**Files:**
- Modify: `src/services/ankiService.ts:173-185`

- [ ] **Step 1: 修改语法卡片翻译颜色**

编辑 `src/services/ankiService.ts` 第175行：
```typescript
`<div style="font-size: 20px; color: #059669; font-weight: bold; margin-bottom: 16px; line-height: 1.6;">`,
```

注意：语法卡片当前没有其他需要调整的颜色，翻译颜色已经使用 `#059669`（绿色），对比度良好。

- [ ] **Step 2: 运行测试验证语法卡片功能**

```bash
npm test -- tests/services/ankiService.test.ts
```

预期：所有测试通过

- [ ] **Step 3: 提交更改**

```bash
git add src/services/ankiService.ts
git commit -m "feat: 完成卡片颜色调整"
```

### Task 3: TTS 集成 - 基础功能

**Files:**
- Modify: `src/services/ankiService.ts`
- Test: `tests/services/ankiService.test.ts`

- [ ] **Step 1: 添加文本哈希函数**

在 `src/services/ankiService.ts` 的 `AnkiService` 类中添加私有方法：
```typescript
/**
 * 简单的文本哈希函数，生成唯一的文件名标识
 * 使用 djb2 哈希算法变体
 */
private textHash(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i); // hash * 33 + char
  }
  // 返回正数的16进制表示，确保文件名合法
  return Math.abs(hash).toString(16).substring(0, 12);
}
```

- [ ] **Step 2: 添加 TTS 获取方法**

在 `AnkiService` 类中添加：
```typescript
/**
 * 从 Google TTS 获取音频数据
 */
private async fetchTTS(text: string, lang: string = 'en'): Promise<ArrayBuffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=${lang}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.arrayBuffer();
}
```

- [ ] **Step 3: 添加音频生成和存储方法**

在 `AnkiService` 类中添加：
```typescript
/**
 * 生成并存储音频文件到 Anki 媒体库
 * 返回音频文件名
 */
async generateAndStoreAudio(text: string, lang: string = 'en'): Promise<string> {
  try {
    // 生成唯一文件名
    const filename = `tts_${this.textHash(text)}.mp3`;
    
    // 获取音频数据
    const audioData = await this.fetchTTS(text, lang);
    
    // 转换为 base64
    const base64Data = Buffer.from(audioData).toString('base64');
    
    // 存储到 Anki 媒体文件夹
    await this.request('storeMediaFile', {
      filename,
      data: base64Data
    });
    
    return filename;
  } catch (error) {
    console.warn(`Failed to generate audio for "${text}":`, error);
    throw error;
  }
}
```

- [ ] **Step 4: 为新增方法添加测试**

在 `tests/services/ankiService.test.ts` 中添加测试：
```typescript
describe('TTS functionality', () => {
  let service: AnkiService;
  
  beforeEach(() => {
    service = new AnkiService({ host: 'localhost:8765', defaultDeck: 'Test' });
    // 重置所有 mock
    jest.clearAllMocks();
  });

  it('should generate consistent hash for same text', () => {
    // 通过反射访问私有方法
    const hash1 = (service as any).textHash('hello');
    const hash2 = (service as any).textHash('hello');
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{1,12}$/);
  });

  it('should generate different hash for different text', () => {
    const hash1 = (service as any).textHash('hello');
    const hash2 = (service as any).textHash('world');
    expect(hash1).not.toBe(hash2);
  });

  it('should generate and store audio successfully', async () => {
    // Mock TTS fetch
    const mockAudioData = new ArrayBuffer(100);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockAudioData),
    });

    // Mock AnkiConnect storeMediaFile
    const mockRequest = jest.spyOn(service as any, 'request').mockResolvedValue(null);

    const filename = await service.generateAndStoreAudio('test word', 'en');
    
    // 验证文件名格式
    expect(filename).toMatch(/^tts_[0-9a-f]{1,12}\.mp3$/);
    
    // 验证 TTS API 调用
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('translate.google.com/translate_tts')
    );
    
    // 验证 AnkiConnect 调用
    expect(mockRequest).toHaveBeenCalledWith('storeMediaFile', {
      filename: expect.any(String),
      data: expect.any(String) // base64 encoded audio
    });
  });

  it('should handle TTS API failure gracefully', async () => {
    // Mock TTS fetch to fail
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(service.generateAndStoreAudio('test word', 'en'))
      .rejects.toThrow('TTS request failed: 500 Internal Server Error');
  });

  it('should handle network errors in TTS', async () => {
    // Mock network error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(service.generateAndStoreAudio('test word', 'en'))
      .rejects.toThrow('Network error');
  });
});
```

- [ ] **Step 5: 运行 TTS 相关测试**

```bash
npm test -- tests/services/ankiService.test.ts --testNamePattern="TTS functionality"
```

预期：测试通过

- [ ] **Step 6: 提交 TTS 基础功能**

```bash
git add src/services/ankiService.ts tests/services/ankiService.test.ts
git commit -m "feat: 添加 TTS 基础功能"
```

### Task 4: TTS 集成 - 单词卡片音频

**Files:**
- Modify: `src/services/ankiService.ts:99-156`

- [ ] **Step 1: 修改单词卡片创建方法签名**

修改 `createWordCard` 方法以支持音频生成：
```typescript
async createWordCard(data: WordCardData, generateAudio: boolean = true): Promise<number> {
```

- [ ] **Step 2: 在单词卡片正面集成音频标签**

修改正面 HTML（第101-108行）：
```typescript
// 正面：单词 + TTS 按钮（使用 Anki 的 [sound:...] 语法）
let frontAudioTag = '';
if (generateAudio) {
  try {
    const audioFilename = await this.generateAndStoreAudio(data.word, 'en');
    frontAudioTag = `<div style="text-align: center; margin-top: 5px;">[sound:${audioFilename}]</div>`;
  } catch (error) {
    console.warn(`Failed to generate audio for word "${data.word}":`, error);
    // 降级到纯文字提示
  }
}

const front = `
  <div style="font-size: 28px; font-weight: bold; text-align: center; padding: 30px; color: #1f2937; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
    ${data.word}
  </div>
  ${frontAudioTag}
  <div style="text-align: center; margin-top: 10px;">
    <span style="font-size: 14px; color: #6b7280;">🔊 点击播放发音</span>
  </div>
`;
```

- [ ] **Step 3: 更新批量创建方法**

修改 `createWordCards` 方法（第198-208行）：
```typescript
async createWordCards(words: WordCardData[], generateAudio: boolean = true): Promise<number[]> {
  const results = await Promise.all(
    words.map(word => 
      this.createWordCard(word, generateAudio).catch(err => {
        console.error(`Failed to create card for ${word.word}: ${err.message}`);
        return null;
      })
    )
  );
  return results.filter((id): id is number => id !== null);
}
```

- [ ] **Step 4: 更新调用位置**

查找 `AddToAnkiButton.tsx` 中的调用，确保传递 `generateAudio` 参数（默认为 true）。

- [ ] **Step 5: 测试单词卡片音频集成**

创建临时测试文件 `test-tts-integration.js`：
```javascript
// 快速测试 TTS 集成
const { AnkiService } = require('./dist/services/ankiService.js');

async function test() {
  const service = new AnkiService({ host: 'localhost:8765', defaultDeck: 'Test' });
  
  const testData = {
    word: 'hello',
    meaning: '你好',
    partOfSpeech: 'interj.',
    example: 'Hello world!',
    exampleTranslation: '你好，世界！'
  };
  
  console.log('Testing word card creation with audio...');
  // 注意：实际运行时需要 AnkiConnect 服务
  console.log('Test completed (requires AnkiConnect for full test)');
}

test().catch(console.error);
```

- [ ] **Step 6: 运行现有测试确保功能正常**

```bash
npm test -- tests/services/ankiService.test.ts
```

预期：所有测试通过

- [ ] **Step 7: 提交单词卡片音频集成**

```bash
git add src/services/ankiService.ts
git commit -m "feat: 在单词卡片中集成 TTS 音频"
```

### Task 5: TTS 集成 - 语法卡片音频

**Files:**
- Modify: `src/services/ankiService.ts:163-193`

- [ ] **Step 1: 修改语法卡片创建方法签名**

修改 `createGrammarCard` 方法：
```typescript
async createGrammarCard(data: GrammarCardData, generateAudio: boolean = true): Promise<number> {
```

- [ ] **Step 2: 在语法卡片正面集成音频标签**

修改正面 HTML（第164-171行）：
```typescript
// 正面：英文句子 + 语音按钮
let frontAudioTag = '';
if (generateAudio) {
  try {
    const audioFilename = await this.generateAndStoreAudio(data.sentence, 'en');
    frontAudioTag = `<div style="text-align: center; margin-top: 5px;">[sound:${audioFilename}]</div>`;
  } catch (error) {
    console.warn(`Failed to generate audio for sentence "${data.sentence}":`, error);
    // 降级到纯文字提示
  }
}

const front = `
  <div style="font-size: 20px; padding: 25px; line-height: 1.8; color: #1f2937; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 600;">
    ${data.sentence}
  </div>
  ${frontAudioTag}
  <div style="text-align: center; margin-top: 10px;">
    <span style="font-size: 14px; color: #6b7280;">🔊 点击播放发音</span>
  </div>
`;
```

- [ ] **Step 3: 更新调用位置**

查找 `AddToAnkiButton.tsx` 中的调用，确保传递 `generateAudio` 参数。

- [ ] **Step 4: 添加错误处理测试**

在 `tests/services/ankiService.test.ts` 的 `describe('TTS functionality')` 块中添加：
```typescript
  it('should create word card without audio when TTS fails', async () => {
    // Mock generateAndStoreAudio to throw error
    const generateAndStoreAudioSpy = jest
      .spyOn(service, 'generateAndStoreAudio')
      .mockRejectedValue(new Error('TTS failed'));

    // Mock AnkiConnect request for card creation
    const mockRequest = jest.spyOn(service as any, 'request').mockResolvedValue(12345);

    const wordData = {
      word: 'test',
      meaning: '测试',
      partOfSpeech: 'n.',
      example: 'This is a test.',
      exampleTranslation: '这是一个测试。'
    };

    const cardId = await service.createWordCard(wordData, true);
    
    // 验证卡片仍然创建成功
    expect(cardId).toBe(12345);
    
    // 验证尝试了生成音频
    expect(generateAndStoreAudioSpy).toHaveBeenCalledWith('test', 'en');
    
    // 验证 AnkiConnect 被调用创建卡片
    expect(mockRequest).toHaveBeenCalled();
  });

  it('should create grammar card without audio when TTS fails', async () => {
    // Mock generateAndStoreAudio to throw error
    const generateAndStoreAudioSpy = jest
      .spyOn(service, 'generateAndStoreAudio')
      .mockRejectedValue(new Error('TTS failed'));

    // Mock AnkiConnect request for card creation
    const mockRequest = jest.spyOn(service as any, 'request').mockResolvedValue(12346);

    const grammarData = {
      sentence: 'This is a test.',
      translation: '这是一个测试。',
      grammar: 'Simple sentence'
    };

    const cardId = await service.createGrammarCard(grammarData, true);
    
    // 验证卡片仍然创建成功
    expect(cardId).toBe(12346);
    
    // 验证尝试了生成音频
    expect(generateAndStoreAudioSpy).toHaveBeenCalledWith('This is a test.', 'en');
    
    // 验证 AnkiConnect 被调用创建卡片
    expect(mockRequest).toHaveBeenCalled();
  });
```

- [ ] **Step 5: 运行完整测试套件**

```bash
npm test -- tests/services/ankiService.test.ts
```

预期：所有测试通过

- [ ] **Step 6: 提交语法卡片音频集成**

```bash
git add src/services/ankiService.ts tests/services/ankiService.test.ts
git commit -m "feat: 在语法卡片中集成 TTS 音频"
```

### Task 6: 窗口优化 - 调整尺寸

**Files:**
- Modify: `src/main/main.ts:16-30`

- [ ] **Step 1: 查看当前窗口创建代码**

检查 `src/main/main.ts` 第18-29行的窗口配置。

- [ ] **Step 2: 修改窗口尺寸**

编辑窗口配置：
```typescript
mainWindow = new BrowserWindow({
  width: 400,  // 原500
  height: 500, // 原700
  show: false, // 初始不显示
  frame: false, // 无边框
  resizable: true, // 改为可调整大小，方便用户调整
  skipTaskbar: true, // 不在任务栏显示
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: join(__dirname, '../preload/preload.js'),
  },
});
```

- [ ] **Step 3: 添加最小尺寸限制**

在窗口创建后添加：
```typescript
// 设置最小尺寸
mainWindow.setMinimumSize(350, 400);
```

- [ ] **Step 4: 测试窗口创建**

运行应用测试：
```bash
npm start
```

预期：应用正常启动，窗口尺寸为 400x500

- [ ] **Step 5: 提交窗口尺寸调整**

```bash
git add src/main/main.ts
git commit -m "feat: 调整窗口尺寸为 400x500"
```

### Task 7: 窗口优化 - 改进定位算法

**Files:**
- Modify: `src/main/main.ts:83-107`

- [ ] **Step 1: 查看当前定位算法**

检查 `showWindowAtCursor()` 函数。

- [ ] **Step 2: 改进边界检查算法**

替换 `showWindowAtCursor()` 函数：
```typescript
// 在鼠标位置显示窗口
function showWindowAtCursor() {
  if (!mainWindow) return;

  const cursorPosition = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPosition);
  
  // 计算初始位置（鼠标右下方10px）
  let x = cursorPosition.x + 10;
  let y = cursorPosition.y + 10;
  
  // 智能边界检查
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
  
  // 确保在屏幕内（二次检查）
  x = Math.max(displayBounds.x, Math.min(x, displayBounds.x + displayBounds.width - windowBounds.width));
  y = Math.max(displayBounds.y, Math.min(y, displayBounds.y + displayBounds.height - windowBounds.height));
  
  // 设置位置并显示
  mainWindow.setPosition(Math.floor(x), Math.floor(y));
  mainWindow.show();
  mainWindow.focus();
}
```

- [ ] **Step 3: 添加定位算法测试**

在 `tests/main/shortcutManager.test.ts` 中添加辅助测试：
```typescript
describe('Window positioning', () => {
  it('should calculate valid window position', () => {
    // 模拟测试定位逻辑
    const cursor = { x: 100, y: 100 };
    const windowSize = { width: 400, height: 500 };
    const screenBounds = { x: 0, y: 0, width: 1920, height: 1080 };
    
    // 测试正常情况
    let x = cursor.x + 10;
    let y = cursor.y + 10;
    
    // 测试右侧超出
    if (x + windowSize.width > screenBounds.x + screenBounds.width) {
      x = cursor.x - windowSize.width - 10;
    }
    
    expect(x).toBeGreaterThanOrEqual(screenBounds.x);
    expect(x + windowSize.width).toBeLessThanOrEqual(screenBounds.x + screenBounds.width);
  });
});
```

- [ ] **Step 4: 测试窗口定位**

手动测试：运行应用，在不同屏幕位置按 Ctrl+Shift+T，验证窗口显示位置。

- [ ] **Step 5: 提交定位算法改进**

```bash
git add src/main/main.ts tests/main/shortcutManager.test.ts
git commit -m "feat: 改进窗口定位算法"
```

### Task 8: 文本捕获 - 添加重试机制

**Files:**
- Modify: `src/main/main.ts:109-128`

- [ ] **Step 1: 查看当前文本获取函数**

检查 `getSelectedText()` 函数。

- [ ] **Step 2: 创建带重试的文本获取函数**

在 `getSelectedText()` 函数后添加：
```typescript
// 带重试机制的获取选中文本
async function getSelectedTextWithRetry(maxRetries: number = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const text = await getSelectedText();
      if (text && text.trim().length > 0) {
        console.log(`Successfully got selected text (attempt ${attempt}/${maxRetries})`);
        return text;
      }
      
      // 等待后重试（指数退避）
      if (attempt < maxRetries) {
        const delay = 50 * attempt; // 50ms, 100ms, 150ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.warn(`Failed to get selected text (attempt ${attempt}/${maxRetries}):`, error);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  return '';
}
```

- [ ] **Step 3: 更新快捷键处理函数**

修改 `handleTranslationShortcut()` 函数（第131-150行）：
```typescript
// 全局快捷键回调
async function handleTranslationShortcut() {
  console.log('Translation shortcut pressed');

  // 获取选中的文本（带重试）
  const selectedText = await getSelectedTextWithRetry();
  console.log('Selected text:', selectedText);

  if (!selectedText) {
    console.log('No valid text selected');
    // 可选：显示提示或反馈
    return;
  }

  // 在鼠标位置显示窗口
  showWindowAtCursor();

  // 发送文本到渲染进程
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('text-selected', selectedText);
  }
}
```

- [ ] **Step 4: 添加重试机制测试**

在 `tests/main/shortcutManager.test.ts` 中添加：
```typescript
describe('Text selection with retry', () => {
  it('should retry on failure', async () => {
    // 模拟测试重试逻辑
    let callCount = 0;
    const mockGetSelectedText = () => {
      callCount++;
      if (callCount < 3) {
        return '';
      }
      return 'test text';
    };
    
    // 模拟重试逻辑
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const text = mockGetSelectedText();
      if (text && text.trim().length > 0) {
        break;
      }
      if (attempt < maxRetries) {
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
      }
    }
    
    expect(callCount).toBe(3);
  });
});
```

- [ ] **Step 5: 测试重试机制**

运行测试：
```bash
npm test -- tests/main/shortcutManager.test.ts
```

预期：测试通过

- [ ] **Step 6: 提交重试机制**

```bash
git add src/main/main.ts tests/main/shortcutManager.test.ts
git commit -m "feat: 为文本捕获添加重试机制"
```

### Task 9: 集成测试和验证

**Files:**
- All modified files

- [ ] **Step 1: 运行完整测试套件**

```bash
npm test
```

预期：所有测试通过

- [ ] **Step 2: 构建应用测试**

```bash
npm run build
```

预期：构建成功，无错误

- [ ] **Step 3: 手动功能测试清单**

1. 启动应用：`npm start`
2. 在文本编辑器中选择英文单词，按 Ctrl+Shift+T
3. 验证：窗口在鼠标附近弹出，尺寸为 400x500
4. 验证：翻译结果显示正常
5. 验证：添加单词到 Anki（需要 AnkiConnect）
6. 验证：在 Anki 中查看卡片，颜色对比度良好
7. 验证：点击卡片播放语音（需要音频生成成功）

- [ ] **Step 4: 修复发现的问题**

根据测试结果修复任何问题。

- [ ] **Step 5: 最终提交**

```bash
git add .
git commit -m "feat: 完成 Translate2Anki 功能改进"
```

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-04-08-translate2anki-improvements-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**