import React, { useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';

interface EditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, language = 'json', onChange }) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const initializeMonaco = useCallback(() => {
    if (!editorContainerRef.current) return;

    self.MonacoEnvironment = {
      getWorker: function (_moduleId: string, label: string) {
        if (label === 'json') return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker?worker', import.meta.url), { type: 'module' });
        if (label === 'css') return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker?worker', import.meta.url), { type: 'module' });
        if (label === 'html') return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker?worker', import.meta.url), { type: 'module' });
        if (label === 'typescript' || label === 'javascript') return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker?worker', import.meta.url), { type: 'module' });
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker?worker', import.meta.url), { type: 'module' });
      }
    };

    monacoEditorRef.current = monaco.editor.create(editorContainerRef.current, {
      value,
      language,
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
    });

    if (onChange) {
      monacoEditorRef.current.onDidChangeModelContent(() => {
        const updatedContent = monacoEditorRef.current?.getValue() ?? '';
        onChange(updatedContent);
      });
    }
  }, [value, language, onChange]);

  useEffect(() => {
    initializeMonaco();

    const handleResize = () => monacoEditorRef.current?.layout();
    window.addEventListener('resize', handleResize);

    return () => {
      monacoEditorRef.current?.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, [initializeMonaco]);

  useEffect(() => {
    if (monacoEditorRef.current) {
      if (value !== monacoEditorRef.current.getValue()) {
        const model = monacoEditorRef.current.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, language || 'json');
          monacoEditorRef.current.setValue(value);
        }
      }
    }
  }, [value, language]);

  return (
    <div
      ref={editorContainerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden', 
      }}
    />
  );
};

export default Editor;