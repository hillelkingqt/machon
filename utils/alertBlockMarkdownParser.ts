import TurndownService from 'turndown';

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
    const contentLines = processedContent.split('\n').filter(line => (line || '').trim() !== '');

    if (contentLines.length === 0) {
        processedContent = '<p></p>'; // Ensure node is created even if empty
    } else {
        // Basic HTML escaping for content lines.
        // If actual Markdown to HTML conversion is needed for inline styles *within* alerts
        // before Tiptap sees it, a proper Markdown parser (e.g., markdown-it) should be used here for `content`.
        processedContent = contentLines.map(line => `<p>${(line || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('');
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
  const ALERT_TYPES = ['INFO', 'TIP', 'NOTE', 'WARNING'];
  if (typeof window === 'undefined' || !htmlOutput) {
    return htmlOutput;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlOutput, 'text/html');

  const alertDivs = Array.from(doc.querySelectorAll('div[data-alert-block][data-alert-type]'));

  const turndown = new TurndownService();

  alertDivs.forEach(div => {
    const alertType = div.getAttribute('data-alert-type')?.toUpperCase();
    if (!alertType || !ALERT_TYPES.includes(alertType)) return;

    const innerMarkdown = turndown.turndown(div.innerHTML).trim();
    const replacementNode = doc.createTextNode(`\n\n>>> ${alertType}: ${innerMarkdown}\n\n`);
    div.parentNode?.replaceChild(replacementNode, div);
  });

  return turndown.turndown(doc.body.innerHTML).trim();
}
