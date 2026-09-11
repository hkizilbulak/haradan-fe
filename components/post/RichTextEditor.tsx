import React, { useRef } from 'react';
import { View, StyleSheet, Platform, TextInput } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useThemeColor } from '@/hooks/useThemeColor';

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
  const richText = useRef<RichEditor>(null);
  
  const text = useThemeColor('text');
  const border = useThemeColor('border');
  const surface = useThemeColor('surface');
  const muted = useThemeColor('textMuted');
  const primary = useThemeColor('primary');

  return (
    <View style={[styles.container, { borderColor: border }]}>
      <RichToolbar
        editor={richText}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.insertOrderedList,
          actions.insertBulletsList,
          actions.undo,
          actions.redo,
        ]}
        iconTint={text}
        selectedIconTint={primary}
        style={styles.toolbar}
      />
      <View style={styles.editorContainer}>
        <RichEditor
          ref={richText}
          initialContentHTML={initialContentHTML}
          onChange={onChange}
          placeholder={placeholder}
          useContainer={true}
          initialHeight={200}
          editorStyle={{
            backgroundColor: surface,
            color: text,
            placeholderColor: muted,
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 250,
  },
  toolbar: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  editorContainer: {
    flex: 1,
    padding: 8,
  },
  webInput: {
    minHeight: 200,
    padding: 16,
    textAlignVertical: 'top',
    outlineStyle: 'none' as any,
  }
});
