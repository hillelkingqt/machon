import { Node, mergeAttributes, InputRule, PasteRule } from '@tiptap/core';
import { Plugin, TextSelection } from 'prosemirror-state';

export interface AlertBlockOptions {
  HTMLAttributes: Record<string, any>;
  alertTypes: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    alertBlock: {
      setAlertBlock: (attributes: { alertType: string }) => ReturnType;
      toggleAlertBlock: (attributes: { alertType: string }) => ReturnType;
      insertAlertBlock: (attributes: { alertType: string }) => ReturnType;
    };
  }
}

export const AlertBlockNode = Node.create<AlertBlockOptions>({
  name: 'alertBlock',
  group: 'block',
  content: 'text*', // Allows text content within the alert block
  defining: true, // Ensures that this node is treated as a single unit

  addOptions() {
    return {
      HTMLAttributes: {},
      alertTypes: ['INFO', 'TIP', 'NOTE', 'WARNING'],
    };
  },

  addAttributes() {
    return {
      alertType: {
        default: 'INFO',
        // Ensure this matches the attribute set in renderHTML and used in pre-parser
        parseHTML: (element) => element.getAttribute('data-alert-type')?.toUpperCase(),
        renderHTML: (attributes) => ({
          'data-alert-type': attributes.alertType.toLowerCase(), // Store as lowercase in HTML for consistency
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-alert-block]', // Updated tag selector
        getAttrs: (element) => {
          if (element instanceof HTMLElement) {
            const type = element.getAttribute('data-alert-type')?.toUpperCase();
            return type && this.options.alertTypes.includes(type) ? { alertType: type } : false;
          }
          return false;
        },
        // Define how to get content from the HTML
        getContent: (element, schema) => {
          // This should return a ProseMirror Fragment or array of Nodes
          // For simplicity, if content is simple text or paragraphs:
          // return DOMParser.fromSchema(schema).parse(element).content;
          // However, if content was already converted to HTML (e.g. <p>tags from preparser)
          // then default behavior might be enough, or a more specific parser is needed.
          // Let Tiptap's default HTML parsing handle the innerHTML for now.
          return 0; // Tells Tiptap to parse the innerHTML
        }
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const alertType = (node.attrs.alertType as string).toUpperCase();
    return [
      'div', // Outer element that parseHTML will look for
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-alert-block': '', // Mark it as an alert block
        'data-alert-type': alertType.toLowerCase(), // Store type in lowercase
        // Editor representation styling
        style: `border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-left: 5px solid ${this.getBorderColor(alertType)}; background-color: ${this.getBackgroundColor(alertType)};`,
      }),
      // Visual prefix for editing
      ['span', { style: 'font-weight: bold; color: #333; user-select: none;', contenteditable: 'false' }, `>>> ${alertType}: `],
      // Editable content area
      ['div', { class: 'alert-content', style: 'display: inline;' }, 0], // '0' is a content hole
    ];
  },

  getBorderColor(alertType: string) {
    switch (alertType.toUpperCase()) {
      case 'INFO': return 'blue';
      case 'TIP': return 'green';
      case 'WARNING': return 'orange';
      case 'NOTE': return 'grey';
      default: return 'grey';
    }
  },

  getBackgroundColor(alertType: string) {
    switch (alertType.toUpperCase()) {
        case 'INFO': return '#e6f7ff';
        case 'TIP': return '#e6fff0';
        case 'WARNING': return '#fffbe6';
        case 'NOTE': return '#f0f0f0';
        default: return '#f0f0f0';
      }
  },

  addCommands() {
    return {
      setAlertBlock: (attributes) => ({ commands }) => {
        return commands.setNode(this.name, attributes);
      },
      toggleAlertBlock: (attributes) => ({ commands }) => {
        return commands.toggleNode(this.name, 'paragraph', attributes);
      },
      insertAlertBlock: (attributes) => ({ tr, dispatch, editor }) => {
        const { selection } = tr;
        const node = this.type.create(attributes);

        if (dispatch) {
            // Insert the node
            tr.replaceSelectionWith(node);
            // Get the position right after the inserted node's opening tag (or at the start of its content)
            const insertPos = selection.from + `>>> ${attributes.alertType}: `.length + 1;
            // Create a new TextSelection at that position
            const newSelection = TextSelection.create(tr.doc, insertPos);
            tr.setSelection(newSelection);
            // Ensure the editor focuses and scrolls to the new selection
            editor.view.focus();
        }
        return true;
      },
    };
  },

  // Markdown parsing/serialization is the key challenge.
  // This is a simplified attempt. `tiptap-markdown` might need more specific hooks.
  // For now, we'll rely on modifying getMarkdown in AdminPage or hoping tiptap-markdown picks it up.

  // Markdown parsing/serialization is the key challenge.
  // For now, we'll rely on modifying getMarkdown in AdminPage or hoping tiptap-markdown picks it up.

  addInputRules() {
    return this.options.alertTypes.map((type) => {
      return new InputRule({
        find: new RegExp(`^>>> ${type}: $`),
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.replaceWith(start - 1, end, this.type.create({ alertType: type }));

          // Set cursor inside the block
          const newPos = start + `>>> ${type}: `.length;
          tr.setSelection(TextSelection.create(tr.doc, newPos));
        },
      });
    });
  },

  addPasteRules() {
    return this.options.alertTypes.map((type) => {
      return new PasteRule({
        find: new RegExp(`^>>> ${type}: (.*)`, "g"), // global to catch multiple
        handler: ({ state, range, match, pasteEvent }) => {
          // This is a basic paste rule. More sophisticated handling of content might be needed.
          // For now, it creates the block and pastes the captured content (first line).
          // Multi-line content pasting directly into the node structure is complex here.
          const content = match[1] || '';
          state.tr.replaceWith(range.from -1, range.to, this.type.create({ alertType: type }, this.type.schema.text(content)));
        },
      });
    });
  }
});

export default AlertBlockNode;
