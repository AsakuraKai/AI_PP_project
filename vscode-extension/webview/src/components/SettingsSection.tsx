import { useState, useEffect } from 'react';
import { Settings, Check, X, Cloud } from 'lucide-react';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from './ui/select';
import { useVSCode } from '../hooks/useVSCode';
import { CloudConfigSection } from './CloudConfigSection';

interface SettingsSectionProps {
  collapsed: boolean;
}

interface OllamaStatus {
  available: boolean;
  latency?: number;
  error?: string;
}

export function SettingsSection({ collapsed }: SettingsSectionProps) {
  const { postMessage } = useVSCode();
  const [model, setModel] = useState('hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({ available: false });
  const [educationalMode, setEducationalMode] = useState(false);
  const [realtimeDetection, setRealtimeDetection] = useState(false);
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  const [cloudModel, setCloudModel] = useState<string | null>(null);

  // Listen for initial config from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[RCA Frontend - SettingsSection] Received message:', message);

      if (message.command === 'init' && message.data?.config) {
        console.log('[RCA Frontend - SettingsSection] Init config:', message.data.config);
        setModel(message.data.config.model || 'hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest');
        setEducationalMode(message.data.config.educationalMode || false);
        setRealtimeDetection(message.data.config.realtimeDetection || false);
      }

      if (message.command === 'ollamaStatus' && message.status) {
        console.log('[RCA Frontend - SettingsSection] Ollama status:', message.status);
        setOllamaStatus({
          available: message.status.connected || false,
          latency: message.status.responseTime,
          error: message.status.error
        });
      }

      if (message.command === 'configUpdated' && message.data) {
        const { key, value } = message.data;
        console.log(`[RCA Frontend - SettingsSection] Config updated: ${key} = ${value}`);
        if (key === 'model') setModel(value);
        if (key === 'educationalMode') setEducationalMode(value);
        if (key === 'realtimeDetection') setRealtimeDetection(value);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Check Ollama status on mount and periodically
  useEffect(() => {
    postMessage('checkOllamaStatus');
    const interval = setInterval(() => {
      postMessage('checkOllamaStatus');
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [postMessage]);

  const handleModelChange = (value: string) => {
    console.log('[RCA Frontend - SettingsSection] Model change:', value);
    if (value === 'cloud') {
      // Navigate to Cloud Configuration
      setShowCloudConfig(true);
      return;
    }
    setModel(value);
    setCloudModel(null); // Clear cloud model when selecting local
    postMessage('updateConfig', { key: 'model', value });
  };

  const handleEducationalModeChange = (checked: boolean) => {
    console.log('[RCA Frontend - SettingsSection] Educational mode change:', checked);
    setEducationalMode(checked);
    postMessage('updateConfig', { key: 'educationalMode', value: checked });
  };

  const handleRealtimeDetectionChange = (checked: boolean) => {
    console.log('[RCA Frontend - SettingsSection] Realtime detection change:', checked);
    setRealtimeDetection(checked);
    postMessage('updateConfig', { key: 'realtimeDetection', value: checked });
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 gap-3">
        <button
          className="p-2 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-50 transition-colors"
          title="Settings"
        >
          <Settings size={20} />
        </button>
        <div
          className={`w-2 h-2 rounded-full ${ollamaStatus?.available ? 'bg-green-500' : 'bg-red-500'
            }`}
          title={ollamaStatus?.available ? 'Ollama Connected' : 'Ollama Disconnected'}
        />
      </div>
    );
  }

  // Show Cloud Configuration Panel if user selected cloud model
  if (showCloudConfig) {
    return (
      <CloudConfigSection
        onBack={() => setShowCloudConfig(false)}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-zinc-400 mb-3">
        <Settings size={16} />
        <span className="text-sm font-medium">Settings</span>
      </div>

      {/* Model Selector */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">Model</label>
        <Select value={cloudModel || model} onValueChange={handleModelChange}>
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-50">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="hf.co/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF:latest" className="text-zinc-50">DeepSeek-R1 Distill Qwen 7B</SelectItem>
            <SelectItem value="llama3" className="text-zinc-50">Llama 3</SelectItem>
            <SelectItem value="qwen2.5-coder" className="text-zinc-50">Qwen 2.5 Coder</SelectItem>
            <SelectItem value="codellama" className="text-zinc-50">Code Llama</SelectItem>
            <SelectSeparator className="bg-zinc-700" />
            <SelectItem value="cloud" className="text-purple-400">
              <span className="flex items-center gap-2">
                <Cloud size={14} />
                Use Cloud Model
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cloud Status (shown when cloud model is active) */}
      {cloudModel && (
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">Cloud Status</label>
          <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded border border-zinc-800">
            <Check size={14} className="text-green-500" />
            <span className="text-sm text-zinc-300">Connected</span>
            <button
              onClick={() => setShowCloudConfig(true)}
              className="ml-auto text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Configure
            </button>
          </div>
        </div>
      )}

      {/* Ollama Status (shown when local model is active) */}
      {!cloudModel && (
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">Ollama Status</label>
          <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded border border-zinc-800">
            {ollamaStatus?.available ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <X size={14} className="text-red-500" />
            )}
            <span className="text-sm text-zinc-300">
              {ollamaStatus?.available ? 'Connected' : 'Disconnected'}
            </span>
            {ollamaStatus?.latency && (
              <span className="text-xs text-zinc-500 ml-auto">
                {ollamaStatus.latency}ms
              </span>
            )}
          </div>
        </div>
      )}

      {/* Educational Mode */}
      <div className="flex items-center justify-between p-2 rounded hover:bg-zinc-900/50 transition-all duration-200 group cursor-pointer hover:scale-[1.02]">
        <div className="flex flex-col">
          <label className="text-sm text-zinc-300 cursor-pointer group-hover:text-zinc-100 transition-colors duration-150">Educational Mode</label>
          <span className="text-xs text-zinc-500 mt-0.5 group-hover:text-zinc-400 transition-colors duration-150">Show detailed explanations</span>
        </div>
        <Switch
          checked={educationalMode}
          onCheckedChange={handleEducationalModeChange}
          className="ml-4"
        />
      </div>

      {/* Realtime Detection */}
      <div className="flex items-center justify-between p-2 rounded hover:bg-zinc-900/50 transition-all duration-200 group cursor-pointer hover:scale-[1.02]">
        <div className="flex flex-col">
          <label className="text-sm text-zinc-300 cursor-pointer group-hover:text-zinc-100 transition-colors duration-150">Realtime Detection</label>
          <span className="text-xs text-zinc-500 mt-0.5 group-hover:text-zinc-400 transition-colors duration-150">Auto-detect errors as you code</span>
        </div>
        <Switch
          checked={realtimeDetection}
          onCheckedChange={handleRealtimeDetectionChange}
          className="ml-4"
        />
      </div>
    </div>
  );
}
