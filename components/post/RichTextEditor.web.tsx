import React, { useState, useEffect } from 'react';
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

  if (!mounted || !ReactQuill) {
    return <View style={[styles.container, { borderColor: border, minHeight: 250 }]} />;
  }

  return (
    <View style={[styles.container, { borderColor: border, backgroundColor: surface }]}>
      <style>{`
        .ql-editor {
          color: ${text};
        }
        .ql-snow .ql-stroke {
          stroke: ${text};
        }
        .ql-snow .ql-fill, .ql-snow .ql-stroke.ql-fill {
          fill: ${text};
        }
        .ql-snow .ql-picker {
          color: ${text};
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        style={styles.quillContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  quillContainer: {
    minHeight: 250,
  }
});
