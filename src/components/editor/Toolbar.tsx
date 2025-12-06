'use client';

import { type Editor } from '@tiptap/react';
import {
    Bold,
    Strikethrough,
    Italic,
    List,
    ListOrdered,
    Heading2,
    Underline,
    Quote,
    Undo,
    Redo,
    Code,
    Signature,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
} from 'lucide-react';

type Props = {
    editor: Editor | null;
    onAddSignature: () => void;
};

export function Toolbar({ editor, onAddSignature }: Props) {
    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-t-md border border-input bg-transparent p-2">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleBold().run();
                }}
                className={editor.isActive('bold') ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Fett"
            >
                <Bold className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleItalic().run();
                }}
                className={editor.isActive('italic') ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Kursiv"
            >
                <Italic className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleUnderline().run();
                }}
                className={editor.isActive('underline') ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Unterstrichen"
            >
                <Underline className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleStrike().run();
                }}
                className={editor.isActive('strike') ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Durchgestrichen"
            >
                <Strikethrough className="h-5 w-5" />
            </button>
            <div className="h-6 border-l border-input"></div>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setTextAlign('left').run();
                }}
                className={editor.isActive({ textAlign: 'left' }) ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Linksbündig"
            >
                <AlignLeft className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setTextAlign('center').run();
                }}
                className={editor.isActive({ textAlign: 'center' }) ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Zentriert"
            >
                <AlignCenter className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setTextAlign('right').run();
                }}
                className={editor.isActive({ textAlign: 'right' }) ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Rechtsbündig"
            >
                <AlignRight className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setTextAlign('justify').run();
                }}
                className={editor.isActive({ textAlign: 'justify' }) ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Blocksatz"
            >
                <AlignJustify className="h-5 w-5" />
            </button>
            <div className="h-6 border-l border-input"></div>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                }}
                className={editor.isActive('heading', { level: 2 }) ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Überschrift"
            >
                <Heading2 className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleBulletList().run();
                }}
                className={editor.isActive('bulletList') ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Liste"
            >
                <List className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleOrderedList().run();
                }}
                className={editor.isActive('orderedList') ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Nummerierte Liste"
            >
                <ListOrdered className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().toggleBlockquote().run();
                }}
                className={editor.isActive('blockquote') ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Zitat"
            >
                <Quote className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().setCode().run();
                }}
                className={editor.isActive('code') ? 'rounded-md bg-primary text-primary-foreground p-1' : 'p-1'}
                title="Code"
            >
                <Code className="h-5 w-5" />
            </button>
            <div className="h-6 border-l border-input"></div>
            <select
                onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
                className="text-sm bg-transparent"
                title="Schriftart"
            >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
            </select>
            <input
                type="color"
                onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                value={editor.getAttributes('color').color || '#000000'}
                className="w-6 h-6 bg-transparent border-none cursor-pointer"
                title="Textfarbe"
            />
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onAddSignature();
                }}
                className="p-1"
                title="Unterschrift zeichnen"
            >
                <Signature className="h-5 w-5" />
            </button>
            <div className="h-6 border-l border-input"></div>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().undo().run();
                }}
                className="p-1"
                title="Rückgängig"
            >
                <Undo className="h-5 w-5" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor.chain().focus().redo().run();
                }}
                className="p-1"
                title="Wiederholen"
            >
                <Redo className="h-5 w-5" />
            </button>
        </div>
    );
}
