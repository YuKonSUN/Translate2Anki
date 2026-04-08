import React, { useState, useEffect } from 'react';

interface SettingsPanelProps {
  onClose: () => void;
  onSave: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onSave }) => {
  const [config, setConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'api' | 'prompts'>('api');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.electronAPI?.getAppConfig().then((c) => setConfig(c));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    await window.electronAPI?.saveAppConfig(config);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSave();
      onClose();
    }, 1000);
  };

  if (!config) return <div className="p-4 text-sm text-gray-500">Loading...</div>;

  const update = (section: string, key: string, value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex justify-between items-center rounded-t-xl">
          <span className="text-white font-semibold">⚙️ 设置</span>
          <button onClick={onClose} className="p-1 bg-white/20 rounded-lg hover:bg-white/30 text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'api' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            API 配置
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex-1 px-4 py-2 text-sm font-medium ${
              activeTab === 'prompts' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            提示词配置
          </button>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === 'api' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API 提供商</label>
                <select
                  value={config.ai.provider}
                  onChange={(e) => update('ai', 'provider', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="deepseek">DeepSeek</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={config.ai.apiKey}
                  onChange={(e) => update('ai', 'apiKey', e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
                <input
                  type="text"
                  value={config.ai.baseURL}
                  onChange={(e) => update('ai', 'baseURL', e.target.value)}
                  placeholder="https://api.deepseek.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  value={config.ai.model}
                  onChange={(e) => update('ai', 'model', e.target.value)}
                  placeholder="deepseek-chat"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          {activeTab === 'prompts' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">翻译提示词</label>
                <textarea
                  value={config.prompts.translate}
                  onChange={(e) => update('prompts', 'translate', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">单词分析提示词</label>
                <textarea
                  value={config.prompts.analyzeWord}
                  onChange={(e) => update('prompts', 'analyzeWord', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">句子分析提示词</label>
                <textarea
                  value={config.prompts.analyzeSentence}
                  onChange={(e) => update('prompts', 'analyzeSentence', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            {saved ? '✓ 已保存' : '保存并重载'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
