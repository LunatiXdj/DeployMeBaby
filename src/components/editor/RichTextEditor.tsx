'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Toolbar } from './Toolbar';
import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';

interface RichTextEditorProps {
    content: string;
    onChange: (richText: string) => void;
    [key: string]: any; // Allow other props
}

export function RichTextEditor({ content, onChange, ...props }: RichTextEditorProps) {
    const [isSignatureModalOpen, setSignatureModalOpen] = useState(false);
    const sigCanvas = useRef<SignatureCanvas>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    HTMLAttributes: { class: 'list-disc pl-4' },
                },
                orderedList: {
                    HTMLAttributes: { class: 'list-decimal pl-4' },
                },
                textStyle: false, // Deactivate default to use our own
            }),
            Underline,
            Image,
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            TextStyle,
            FontFamily,
            Color,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-[250px] rounded-b-md border border-t-0 border-input bg-background p-4',
            },
        },
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    const handleSaveSignature = () => {
        if (sigCanvas.current && editor) {
            const signatureImage = sigCanvas.current.toDataURL('image/png');
            editor.chain().focus().setImage({ src: signatureImage }).run();
            setSignatureModalOpen(false);
        }
    };

    const handleClearSignature = () => {
        sigCanvas.current?.clear();
    }

    return (
        <div className="flex flex-col" {...props}>
            <Toolbar editor={editor} onAddSignature={() => setSignatureModalOpen(true)} />
            <EditorContent editor={editor} />

            {isSignatureModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-background p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-medium mb-4">Bitte unterschreiben</h3>
                        <div className="border border-input rounded-md">
                            <SignatureCanvas
                                ref={sigCanvas}
                                penColor="black"
                                canvasProps={{ width: 500, height: 200, className: 'sigCanvas' }}
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={handleClearSignature} className="px-4 py-2 rounded-md border">Löschen</button>
                            <button onClick={() => setSignatureModalOpen(false)} className="px-4 py-2 rounded-md border">Abbrechen</button>
                            <button onClick={handleSaveSignature} className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Speichern</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
