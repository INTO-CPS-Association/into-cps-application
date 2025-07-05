export {};

declare global {
  interface Window {
    electronAPI?: {
      dispatchActionToMain: (payload: any) => void;
      addErrorListener?: (callback: (msg: string) => void) => void;
      removeErrorListener?: () => void;
      addNotificationListener?: (msg: string, type: string) => void;
      removeNotificationListener?: () => void;
    };
  }
}
