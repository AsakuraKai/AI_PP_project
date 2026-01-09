import { useEffect, useCallback, useState } from 'react';

// Declare vscode API
declare global {
  interface Window {
    acquireVsCodeApi?: () => VSCodeAPI;
  }
}

interface VSCodeAPI {
  postMessage(message: any): void;
  setState(state: any): void;
  getState(): any;
}

let vscodeApi: VSCodeAPI | undefined;

function getVSCodeAPI(): VSCodeAPI {
  if (!vscodeApi) {
    if (window.acquireVsCodeApi) {
      vscodeApi = window.acquireVsCodeApi();
    } else {
      // Fallback for development (non-webview environment)
      vscodeApi = {
        postMessage: (message: any) => console.log('VSCode message:', message),
        setState: (state: any) => console.log('VSCode state:', state),
        getState: () => ({})
      };
    }
  }
  return vscodeApi;
}

export function useVSCode() {
  const [messages, setMessages] = useState<any[]>([]);

  const postMessage = useCallback((command: string, data?: any) => {
    const api = getVSCodeAPI();
    api.postMessage({ command, ...data });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      setMessages(prev => [...prev, message]);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return {
    postMessage,
    messages,
    vscode: getVSCodeAPI()
  };
}

export function useVSCodeMessage(command: string, handler: (data: any) => void) {
  const { messages } = useVSCode();

  useEffect(() => {
    const message = messages.find(m => m.command === command);
    if (message) {
      handler(message.data);
    }
  }, [messages, command, handler]);
}
