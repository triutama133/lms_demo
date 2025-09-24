import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
// import BulletList from '@tiptap/extension-bullet-list';
// import OrderedList from '@tiptap/extension-ordered-list';
// import ListItem from '@tiptap/extension-list-item';
import { useEffect } from 'react';

type SectionEditorProps = { value: string; onChange: (val: string) => void };

export default function SectionEditor({ value, onChange }: SectionEditorProps) {
  // Instantiate extensions directly inside the function to avoid sharing instances
  const extensions = [
    StarterKit.configure({}),
    Underline.configure({}),
    Link.configure({}),
    Image.configure({})
  ];

  const editor = useEditor({
    extensions,
    content: value,
    autofocus: true,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'border rounded px-2 py-1 min-h-[120px] bg-white',
      },
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) return <div className="text-gray-400">Memuat editor...</div>;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'font-bold text-purple-700' : ''}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'italic text-purple-700' : ''}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'underline text-purple-700' : ''}>U</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'font-bold text-lg text-purple-700' : ''}>H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'font-bold text-purple-700' : ''}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-purple-100 text-purple-700 font-bold px-2 rounded' : 'px-2'} title="Bullet List">• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-purple-100 text-purple-700 font-bold px-2 rounded' : 'px-2'} title="Numbered List">1. List</button>
        <button type="button" onClick={() => {
          const url = prompt('Masukkan URL:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} className={editor.isActive('link') ? 'text-purple-700' : ''}>Link</button>
        <button type="button" onClick={() => {
          const url = prompt('Masukkan URL gambar:');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}>Gambar</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()}>Undo</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()}>Redo</button>
      </div>
      <style jsx global>{`
        .ProseMirror ul {
          list-style-type: disc;
          margin-left: 1.5em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          margin-left: 1.5em;
        }
        .ProseMirror li {
          margin-bottom: 0.2em;
        }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}
