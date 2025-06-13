import React, { useState } from 'react'; // Added useState for dropdown
import { useTranslation } from 'react-i18next';
import { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Undo, Redo, ChevronDown, Info, Lightbulb, AlertTriangle, MessageSquare } from 'lucide-react'; // Added ChevronDown and alert icons

interface EditorToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const { t } = useTranslation();
  if (!editor) {
    return null;
  }

  // State for alert block dropdown
  const [isAlertDropdownOpen, setIsAlertDropdownOpen] = useState(false);

  const alertTypes = [
    { name: 'INFO', icon: <Info size={18} />, labelKey: 'editorToolbar.alertTypes.info', defaultLabel: 'Info Block' },
    { name: 'TIP', icon: <Lightbulb size={18} />, labelKey: 'editorToolbar.alertTypes.tip', defaultLabel: 'Tip Block' },
    { name: 'NOTE', icon: <MessageSquare size={18} />, labelKey: 'editorToolbar.alertTypes.note', defaultLabel: 'Note Block' },
    { name: 'WARNING', icon: <AlertTriangle size={18} />, labelKey: 'editorToolbar.alertTypes.warning', defaultLabel: 'Warning Block' },
  ];

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-t-lg p-2 flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-700 items-center">
      {/* Existing buttons */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.bold', 'Bold')}
      >
        <Bold size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.italic', 'Italic')}
      >
        <Italic size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded ${editor.isActive('strike') ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.strikethrough', 'Strikethrough')}
      >
        <Strikethrough size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.h1', 'H1')}
      >
        <Heading1 size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.h2', 'H2')}
      >
        <Heading2 size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1.5 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.h3', 'H3')}
      >
        <Heading3 size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.bulletList', 'Bullet List')}
      >
        <List size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.orderedList', 'Ordered List')}
      >
        <ListOrdered size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded ${editor.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.blockquote', 'Blockquote')}
      >
        <Quote size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded ${editor.isActive('codeBlock') ? 'bg-slate-200 dark:bg-slate-600' : 'hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        title={t('editorToolbar.codeBlock', 'Code Block')}
      >
        <Code size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
        title={t('editorToolbar.undo', 'Undo')}
      >
        <Undo size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
        title={t('editorToolbar.redo', 'Redo')}
      >
        <Redo size={18} />
      </button>

      {/* Spacer element */}
      <div className="h-5 w-[1px] bg-slate-300 dark:bg-slate-600 mx-1.5"></div>

      {/* Alert Block Dropdown */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setIsAlertDropdownOpen(!isAlertDropdownOpen)}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center"
          title={t('editorToolbar.insertAlertBlock', 'Insert Alert Block')}
        >
          {t('editorToolbar.alertsDropdownButton', 'Alerts')} <ChevronDown size={18} className={`ml-1 transition-transform duration-200 ${isAlertDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {isAlertDropdownOpen && (
          <div className="absolute ltr:left-0 rtl:right-0 mt-1 w-48 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-50">
            {alertTypes.map(alert => (
              <button
                type="button"
                key={alert.name}
                onClick={() => {
                  // Uses the command defined in AlertBlockNode.ts
                  editor.chain().focus().insertAlertBlock({ alertType: alert.name }).run();
                  setIsAlertDropdownOpen(false); // Close dropdown
                }}
                className="block w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 text-sm"
              >
                {alert.icon} {t(alert.labelKey, alert.defaultLabel)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorToolbar;
