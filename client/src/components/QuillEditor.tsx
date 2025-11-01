import { useEffect, useRef } from 'react';

// @ts-ignore
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  modules?: any;
  className?: string;
  placeholder?: string;
}

export function QuillEditor({ value, onChange, modules, className, placeholder }: QuillEditorProps) {
  const quillRef = useRef<any>(null);

  useEffect(() => {
    // Suppress findDOMNode warnings in development
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('findDOMNode') || args[0].includes('StrictMode'))
      ) {
        return;
      }
      originalError.call(console, ...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <ReactQuill
      ref={quillRef}
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      className={className}
      placeholder={placeholder}
    />
  );
}
