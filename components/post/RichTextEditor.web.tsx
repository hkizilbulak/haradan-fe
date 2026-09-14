import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

let ReactQuill: any;
if (typeof window !== 'undefined') {
  let rq = require('react-quill-new');
  ReactQuill = rq.default || rq;
  require('react-quill-new/dist/quill.snow.css');
}

interface RichTextEditorProps {
  initialContentHTML?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContentHTML = '',
  onChange,
  placeholder = 'İlan açıklamasını buraya girin...'
}) => {
  const text = useThemeColor('text');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const muted = useThemeColor('textMuted');
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState(initialContentHTML);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setContent(initialContentHTML);
  }, [initialContentHTML]);

  const handleChange = (val: string) => {
    setContent(val);
    onChange(val);
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }, { 'align': [] }],
      ['blockquote', 'code-block', 'link'],
      ['clean']
    ]
  }), []);

  if (!mounted || !ReactQuill) {
    return <View style={[styles.container, { borderColor: border, minHeight: 250 }]} />;
  }

  return (
    <View style={[styles.container, { borderColor: border, backgroundColor: surface }]}>
      <style>{`
        /* CKEditor Style Overrides for Quill */
        .ql-container.ql-snow {
          border: none !important;
          font-family: inherit !important;
          font-size: 15px;
        }
        .ql-editor {
          color: ${text};
          min-height: 250px;
          padding: 16px;
        }
        .ql-toolbar.ql-snow {
          background-color: #f7f7f7;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: 1px solid #d1d1d1 !important;
          border-radius: 8px 8px 0 0;
          padding: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
        }
        .ql-snow .ql-formats {
          margin-right: 8px;
          background-color: #ffffff;
          border: 1px solid #e1e1e1;
          border-radius: 4px;
          display: flex;
          align-items: center;
          padding: 2px;
        }
        .ql-snow .ql-stroke {
          stroke: #333333;
        }
        .ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill {
          fill: #333333;
        }
        .ql-snow .ql-picker {
          color: #333333;
        }
        .ql-snow.ql-toolbar button, .ql-snow .ql-toolbar button {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .ql-snow.ql-toolbar button:hover, .ql-snow .ql-toolbar button:hover,
        .ql-snow.ql-toolbar button:focus, .ql-snow .ql-toolbar button:focus {
          background-color: #e5eef7;
          border-color: #c9dbed;
        }
        .ql-snow .ql-active {
          background-color: #cce0f5 !important;
          border-radius: 4px;
        }
        .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: #0066cc;
        }
        .ql-snow.ql-toolbar button.ql-active .ql-fill {
          fill: #0066cc;
        }
        /* Dropdowns */
        .ql-snow .ql-picker.ql-header {
          width: 120px;
        }
        .ql-snow .ql-picker-label {
          border-radius: 4px;
          border: 1px solid transparent;
        }
        .ql-snow .ql-picker-label:hover {
          background-color: #e5eef7;
          border-color: #c9dbed;
          color: #0066cc;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        modules={modules}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  }
});
