'use client';

import { Plate } from '@udecode/plate-common/react';
import { useAtom } from 'jotai/react';

import { useCreateEditor } from './use-create-editor';
import { Editor, EditorContainer } from './editor';
import { editorFocusedAtom } from '../../state/atoms';

export function PlateEditor() {
  const editor = useCreateEditor();
  const [, setFocused] = useAtom(editorFocusedAtom);

  return (
    <Plate editor={editor}>
      <EditorContainer>
        <Editor
          style={{
            caretColor: 'hsl(var(--background))',
          }}
          onFocus={(event) => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          placeholder="Type..."
        />
      </EditorContainer>
    </Plate>
  );
}
