/**
 * API 连接测试脚本
 * 用法: npx ts-node scripts/test-api.ts
 */
import axios from 'axios';

const API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-36d7049130644918b872df6f454ad573';
const BASE_URL = 'https://api.deepseek.com';

async function testConnection() {
  console.log('========================================');
  console.log('DeepSeek API 连接测试');
  console.log('========================================\n');

  // 1. 检查 API Key
  console.log('1. 检查 API Key...');
  if (!API_KEY || API_KEY === 'your-api-key-here') {
    console.log('   ❌ API Key 未配置');
    process.exit(1);
  }
  console.log(`   ✓ API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);

  // 2. 测试模型列表
  console.log('\n2. 测试获取模型列表...');
  try {
    const modelsResponse = await axios.get(`${BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    console.log('   ✓ 连接成功');
    console.log('   可用模型:', modelsResponse.data.data?.map((m: any) => m.id).join(', ') || '无法获取');
  } catch (error: any) {
    console.log('   ❌ 获取模型列表失败');
    console.log('   错误:', error.response?.data?.error?.message || error.message);
  }

  // 3. 测试简单翻译
  console.log('\n3. 测试翻译功能...');
  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a translation assistant. Translate the given text to Chinese.'
          },
          {
            role: 'user',
            content: 'Hello, world!'
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log('   ✓ 翻译成功');
    console.log('   原文: Hello, world!');
    console.log('   译文:', response.data.choices[0].message.content.trim());
    console.log('   使用模型:', response.data.model);
    console.log('   消耗 tokens:', response.data.usage?.total_tokens || 'unknown');
  } catch (error: any) {
    console.log('   ❌ 翻译失败');
    console.log('   状态码:', error.response?.status);
    console.log('   错误信息:', error.response?.data?.error?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n   💡 401 错误可能原因:');
      console.log('      - API Key 无效或已过期');
      console.log('      - 账户余额不足（DeepSeek 需要预充值）');
      console.log('      - Key 被禁用');
    }
  }

  console.log('\n========================================');
  console.log('测试完成');
  console.log('========================================');
}

testConnection().catch(console.error);
