import { useAtomCallback } from 'jotai/utils';

import { Plate } from '@udecode/plate-common/react';

import { useCreateEditor } from './use-create-editor.tsx';
import { Editor, EditorContainer } from './editor.tsx';
import { editorFocusedAtom } from '../../../../../libs/ui-components/src/state/atoms.ts';

export function PlateEditor() {
  const editor = useCreateEditor();

  // These callbacks set the editorFocusedAtom without causing a re-render
  const onFocus = useAtomCallback((get, set, event: React.FocusEvent<HTMLDivElement>) => {
    set(editorFocusedAtom, true);
  });
  const onBlur = useAtomCallback((get, set, event: React.FocusEvent<HTMLDivElement>) => {
    set(editorFocusedAtom, false);
  });

  return (
    <Plate editor={editor}>
      <EditorContainer>
        <Editor
          style={{
            caretColor: 'hsl(var(--background))',
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Type..."
        />
      </EditorContainer>
    </Plate>
  );
}
