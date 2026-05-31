import { useState, useEffect, useCallback } from 'react';
import { Cloud, ArrowLeft, Check, X, Eye, EyeOff, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useVSCode } from '../hooks/useVSCode';

interface CloudConfigSectionProps {
  onBack: () => void;
}

interface CloudStatus {
  connected: boolean;
  latency?: number;
  error?: string;
}

interface CloudModel {
  id: string;
  name: string;
}

type ProviderType = 'gemini' | 'anthropic' | 'openai' | 'unknown';

// Provider display names
const PROVIDER_NAMES: Record<ProviderType, string> = {
  gemini: 'Google Gemini',
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI',
  unknown: 'Unknown Provider',
};

/**
 * Auto-detect provider from API key prefix
 * - AIza... = Google Gemini
 * - sk-ant-... = Anthropic Claude
 * - sk-... = OpenAI
 */
function detectProvider(apiKey: string): ProviderType {
  if (!apiKey || apiKey.startsWith('••••')) return 'unknown';

  if (apiKey.startsWith('AIza')) return 'gemini';
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  if (apiKey.startsWith('sk-')) return 'openai';

  return 'unknown';
}

export function CloudConfigSection({ onBack }: CloudConfigSectionProps) {
  const { postMessage } = useVSCode();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<ProviderType>('unknown');
  const [models, setModels] = useState<CloudModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [status, setStatus] = useState<CloudStatus>({ connected: false });
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  // Listen for cloud config messages from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[RCA Frontend - CloudConfig] Received message:', message);

      if (message.command === 'cloudConfigCleared') {
        setApiKey('');
        setProvider('unknown');
        setModels([]);
        setSelectedModel('');
        setStatus({ connected: false });
        setIsClearing(false);
        setHasConfig(false);
        return;
      }

      if (message.command === 'cloudConfigSaved') {
        setStatus({
          connected: message.data?.success || false,
          error: message.data?.error,
        });
        if (message.data?.success) {
          setHasConfig(true);
        }
        setIsSaving(false);
      }

      if (message.command === 'testResult') {
        setStatus({
          connected: message.data?.success || false,
          latency: message.data?.latency,
          error: message.data?.error,
        });
        setIsTesting(false);
      }

      if (message.command === 'availableModels' && message.data) {
        setModels(message.data.models || []);
        setIsLoadingModels(false);
        // Auto-select first model if none selected
        if (message.data.models?.length > 0 && !selectedModel) {
          setSelectedModel(message.data.models[0].id);
        }
      }

      if (message.command === 'cloudConfigLoaded' && message.data) {
        setHasConfig(true);
        if (message.data.provider) setProvider(message.data.provider);
        if (message.data.model) setSelectedModel(message.data.model);
        if (message.data.models) setModels(message.data.models);
        if (message.data.hasKey) {
          setApiKey('••••••••••••••••'); // Masked placeholder
        }
      }

      if (message.command === 'modelFetchError') {
        setIsLoadingModels(false);
        setStatus({
          connected: false,
          error: message.data?.error || 'Failed to fetch models',
        });
      }
    };

    window.addEventListener('message', handleMessage);

    // Request current cloud config on mount
    postMessage('getCloudConfig');

    return () => window.removeEventListener('message', handleMessage);
  }, [postMessage, selectedModel]);

  // Auto-detect provider and fetch models when API key changes
  const handleApiKeyChange = useCallback((value: string) => {
    setApiKey(value);

    const detectedProvider = detectProvider(value);
    setProvider(detectedProvider);

    // Clear previous state
    setModels([]);
    setSelectedModel('');
    setStatus({ connected: false });

    // Fetch models if valid provider detected and key is long enough
    if (detectedProvider !== 'unknown' && value.length > 10) {
      setIsLoadingModels(true);
      postMessage('fetchModels', { apiKey: value, provider: detectedProvider });
    }
  }, [postMessage]);

  const handleSaveConfig = () => {
    if (!apiKey || (!isKeyValid && apiKey !== '••••••••••••••••') || !selectedModel) {
      return;
    }
    setIsSaving(true);
    postMessage('saveCloudApiKey', {
      apiKey,
      model: selectedModel,
      provider
    });
  };

  const handleTestConnection = () => {
    if (!apiKey || (!isKeyValid && apiKey !== '••••••••••••••••') || !selectedModel) {
      setStatus({ connected: false, error: 'Please enter an API key and select a model' });
      return;
    }
    setIsTesting(true);
    postMessage('testCloudConnection', {
      apiKey,
      model: selectedModel,
      provider
    });
  };

  const handleClearConfig = () => {
    setIsClearing(true);
    postMessage('clearCloudConfig');
  };

  const isKeyValid = apiKey && !apiKey.startsWith('••••') && apiKey.length > 10;
  const canSave = (isKeyValid || apiKey === '••••••••••••••••') && selectedModel && provider !== 'unknown';

  return (
    <div className="p-4 space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-zinc-900 text-zinc-400 hover:text-zinc-50 transition-colors"
          title="Back to Settings"
        >
          <ArrowLeft size={16} />
        </button>
        <Cloud size={16} className="text-purple-400" />
        <span className="text-sm font-medium text-zinc-400">Cloud LLM Configuration</span>
      </div>

      {/* API Key Input */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">API Key</label>
        <div className="relative">
          <Input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="Enter your API key..."
            className="bg-zinc-900 border-zinc-800 text-zinc-50 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-50 transition-colors"
            title={showKey ? 'Hide key' : 'Show key'}
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Provider Detection Status */}
        {apiKey && !apiKey.startsWith('••••') && (
          <div className="flex items-center gap-2 text-xs">
            {provider !== 'unknown' ? (
              <>
                <Check size={12} className="text-green-500" />
                <span className="text-green-400">Detected: {PROVIDER_NAMES[provider]}</span>
              </>
            ) : apiKey.length > 5 ? (
              <>
                <AlertCircle size={12} className="text-amber-500" />
                <span className="text-amber-400">
                  Unknown provider. Supported: Google (AIza...), Anthropic (sk-ant-...), OpenAI (sk-...)
                </span>
              </>
            ) : (
              <span className="text-zinc-500">Enter your API key to auto-detect provider</span>
            )}
          </div>
        )}
        {!apiKey && (
          <p className="text-xs text-zinc-500">
            Enter your API key to get started
          </p>
        )}
      </div>

      {/* Model Selector (Dynamic) */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">Model</label>
        <Select
          value={selectedModel}
          onValueChange={setSelectedModel}
          disabled={isLoadingModels || models.length === 0}
        >
          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-50">
            {isLoadingModels ? (
              <span className="flex items-center gap-2 text-zinc-400">
                <Loader2 size={14} className="animate-spin" />
                Loading models...
              </span>
            ) : (
              <SelectValue placeholder={models.length === 0 ? "Enter API key first" : "Select model"} />
            )}
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id} className="text-zinc-50">
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {models.length > 0 && (
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <span>📡</span> Models fetched dynamically from provider API
          </p>
        )}
      </div>

      {/* Connection Status */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-500">Status</label>
        <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded border border-zinc-800">
          {status.connected ? (
            <Check size={14} className="text-green-500" />
          ) : status.error ? (
            <X size={14} className="text-red-500" />
          ) : canSave ? (
            <Check size={14} className="text-amber-500" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-600" />
          )}
          <span className="text-sm text-zinc-300">
            {status.connected
              ? 'Connected'
              : status.error
              ? 'Error'
              : canSave
              ? 'Ready to save'
              : 'Not configured'}
          </span>
          {status.latency && (
            <span className="text-xs text-zinc-500 ml-auto">
              {status.latency}ms
            </span>
          )}
        </div>
        {status.error && (
          <p className="text-xs text-red-400 break-words whitespace-pre-wrap">{status.error}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          onClick={handleSaveConfig}
          disabled={isSaving || !canSave}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={handleTestConnection}
            disabled={isTesting || !canSave}
            variant="outline"
            className="flex-1 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
          >
            {isTesting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button
            onClick={handleClearConfig}
            disabled={isClearing || !hasConfig}
            variant="outline"
            size="icon"
            className="shrink-0 border-red-900/50 hover:bg-red-900/20 text-red-400"
            title="Remove Configuration"
          >
            {isClearing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
