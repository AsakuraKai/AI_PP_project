import { useCallback } from 'react';

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
  const postMessage = useCallback((command: string, data?: any) => {
    const api = getVSCodeAPI();
    api.postMessage({ command, ...data });
  }, []);

  return {
    postMessage,
    vscode: getVSCodeAPI()
  };
}
