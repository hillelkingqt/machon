/**
 * Converts raw Markdown text for >>> ALERT: blocks into an intermediate HTML representation
 * that Tiptap's AlertBlockNode can parse.
 */

export function preparseAlertBlocks(markdown: string): string {
  const ALERT_TYPES = ['INFO', 'TIP', 'NOTE', 'WARNING']; // Add this line
  if (!markdown) {
    return '';
  }
  const alertBlockRegex = new RegExp(
    // Start of a line, or after two newlines (ensuring it's a block)
    `(^|\\n\\n)>>>\\s*(${ALERT_TYPES.join('|')}):\\s*([\\s\\S]*?)(?=(\\n\\n)|(^>>>\\s*(${ALERT_TYPES.join('|')}):)|(\\n\\s*#{1,6}\\s)|(\\n\\s*\\*\\s)|(\\n\\s*-\\s)|(\\n\\s*\\d+\\.\\s)|(\\n\\s*---\\s*)|(\\n\\s*___\\s*)|(\\n\\s*\\*\\*\\*\\s*)|$)`,
    'g'
  );

  let result = markdown.replace(alertBlockRegex, (match, precedingNewlineOrStart, type, content) => {
    const alertType = type.toLowerCase();
    let processedContent = (content || '').trim();
    const contentLines = processedContent.split('\n').filter(line => line.trim() !== '');

    if (contentLines.length === 0) {
        processedContent = '<p></p>'; // Ensure node is created even if empty
    } else {
        // Basic HTML escaping for content lines.
        // If actual Markdown to HTML conversion is needed for inline styles *within* alerts
        // before Tiptap sees it, a proper Markdown parser (e.g., markdown-it) should be used here for `content`.
        processedContent = contentLines.map(line => `<p>${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('');
    }
    const prefix = precedingNewlineOrStart;
    return `${prefix}<div data-alert-block data-alert-type="${alertType}">${processedContent}</div>`;
  });
  return result;
}

/**
 * Converts HTML output from Tiptap for custom alert blocks back to `>>> TYPE: Content` Markdown.
 * This version attempts a more robust replacement strategy.
 */
export function postserializeAlertBlocks(htmlOutput: string): string {
  const ALERT_TYPES = ['INFO', 'TIP', 'NOTE', 'WARNING']; // Add this line
  if (typeof window === 'undefined' || !htmlOutput) {
    return htmlOutput;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlOutput, 'text/html');
  const tempDoc = document.implementation.createHTMLDocument(''); // Use a proper document for manipulation

  // Iterate over a static copy of the nodes, as we'll be modifying the live list
  const alertDivs = Array.from(doc.querySelectorAll('div[data-alert-block][data-alert-type]'));

  alertDivs.forEach(div => {
    const alertType = div.getAttribute('data-alert-type')?.toUpperCase();
    if (!alertType || !ALERT_TYPES.includes(alertType)) {
      return;
    }

    let innerMarkdownContent = '';
    // Process child nodes (expected to be <p> tags or text directly)
    div.childNodes.forEach((pNode, index) => {
        let lineContent = '';
        if (pNode.nodeName === 'P') {
            pNode.childNodes.forEach(inlineNode => {
                if (inlineNode.nodeType === Node.TEXT_NODE) {
                    lineContent += inlineNode.textContent;
                } else if (inlineNode.nodeType === Node.ELEMENT_NODE) {
                    const el = inlineNode as HTMLElement;
                    // This simple conversion assumes innerHTML of inline elements is plain text.
                    // For nested structures, this would need to be recursive.
                    switch(el.nodeName) {
                        case 'STRONG': case 'B': lineContent += `**${el.textContent || ''}**`; break;
                        case 'EM': case 'I': lineContent += `_${el.textContent || ''}_`; break;
                        case 'A': lineContent += `[${el.textContent || ''}](${el.getAttribute('href') || ''})`; break;
                        case 'CODE': lineContent += `\`${el.textContent || ''}\``; break;
                        case 'BR': lineContent += '\n'; break;
                        default: lineContent += el.textContent || ''; // Fallback for unknown inline tags: strip tag, keep text
                    }
                }
            });
        } else if (pNode.nodeType === Node.TEXT_NODE) {
            lineContent = pNode.textContent || '';
        }
        // Add newline if it's not the first line and previous content wasn't empty
        if (index > 0 && innerMarkdownContent.length > 0 && (lineContent || '').trim().length > 0) {
          innerMarkdownContent += '\n';
        }
        innerMarkdownContent += (lineContent || '').trim();
    });

    const markdownBlock = `>>> ${alertType}: ${(innerMarkdownContent || '').trim()}`;

    // Replace the original div with a text node containing the newlines and markdown block
    // This ensures block separation.
    const replacementNode = tempDoc.createTextNode(`\n\n${markdownBlock}\n\n`);
    div.parentNode?.replaceChild(replacementNode, div);
  });

  // Serialize the modified document body back to an HTML string.
  // Then, to get a "cleaner" output that's just the content (without html/body tags):
  // Create a temporary div, append all children of body to it, then get its innerHTML.
  // This helps remove the surrounding <html><body> tags from the output.
  const finalBody = doc.body;
  // If the original htmlOutput was a fragment, body might not be what we want.
  // However, DOMParser always creates a full HTML document.
  // We need to handle cases where original htmlOutput might not have a body.
  // For simplicity, if only one child was in body (our content), use its outerHTML or textContent.

  if (finalBody.childNodes.length === 1 && finalBody.firstChild?.nodeType === Node.TEXT_NODE) {
      return finalBody.firstChild.textContent || ''; // If it became a single text node
  }

  // A more general approach to reconstruct the string:
  // Create a temporary container, append all children of the parsed body to it.
  const container = tempDoc.createElement('div');
  while (doc.body.firstChild) {
    container.appendChild(doc.body.firstChild);
  }
  return container.innerHTML;
}
