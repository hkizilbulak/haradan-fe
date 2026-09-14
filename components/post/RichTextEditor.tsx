import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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

  return (
    <View style={[styles.container, { borderColor: border, backgroundColor: surface }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        keyboardShouldPersistTaps="always"
        style={styles.toolbarScroll}
        contentContainerStyle={styles.toolbarContent}
      >
        <View style={styles.toolbarGroup}>
          <RichToolbar
            editor={richText}
            actions={[
              actions.heading1,
              actions.heading2,
            ]}
            iconTint="#333333"
            selectedIconTint="#0066cc"
            selectedButtonStyle={styles.selectedButton}
            style={styles.toolbar}
            unselectedButtonStyle={styles.unselectedButton}
          />
        </View>
        
        <View style={styles.toolbarGroup}>
          <RichToolbar
            editor={richText}
            actions={[
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.setStrikethrough,
            ]}
            iconTint="#333333"
            selectedIconTint="#0066cc"
            selectedButtonStyle={styles.selectedButton}
            style={styles.toolbar}
            unselectedButtonStyle={styles.unselectedButton}
          />
        </View>

        <View style={styles.toolbarGroup}>
          <RichToolbar
            editor={richText}
            actions={[
              actions.insertOrderedList,
              actions.insertBulletsList,
              actions.alignLeft,
              actions.alignCenter,
              actions.alignRight,
            ]}
            iconTint="#333333"
            selectedIconTint="#0066cc"
            selectedButtonStyle={styles.selectedButton}
            style={styles.toolbar}
            unselectedButtonStyle={styles.unselectedButton}
          />
        </View>
        
        <View style={styles.toolbarGroup}>
          <RichToolbar
            editor={richText}
            actions={[
              actions.undo,
              actions.redo,
            ]}
            iconTint="#333333"
            selectedIconTint="#0066cc"
            selectedButtonStyle={styles.selectedButton}
            style={styles.toolbar}
            unselectedButtonStyle={styles.unselectedButton}
          />
        </View>
      </ScrollView>
      <View style={styles.editorContainer}>
        <RichEditor
          ref={richText}
          initialContentHTML={initialContentHTML}
          onChange={onChange}
          placeholder={placeholder}
          useContainer={true}
          initialHeight={250}
          editorStyle={{
            backgroundColor: surface,
            color: text,
            placeholderColor: muted,
            contentCSSText: 'font-size: 15px; font-family: sans-serif;',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toolbarScroll: {
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d1d1',
  },
  toolbarContent: {
    padding: 8,
    alignItems: 'center',
    flexDirection: 'row',
  },
  toolbarGroup: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 4,
    marginRight: 8,
    paddingHorizontal: 2,
  },
  toolbar: {
    backgroundColor: 'transparent',
    height: 36,
  },
  selectedButton: {
    backgroundColor: '#cce0f5',
    borderRadius: 4,
    margin: 2,
  },
  unselectedButton: {
    backgroundColor: 'transparent',
    borderRadius: 4,
    margin: 2,
  },
  editorContainer: {
    flex: 1,
    minHeight: 250,
  }
});
