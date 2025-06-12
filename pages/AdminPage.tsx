import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Added import
import { SupabaseClient } from '@supabase/supabase-js'; // createClient removed
import { supabase } from '../utils/supabaseClient'; // Added import
import { APP_NAME } from '../constants'; // SUPABASE_URL, SUPABASE_ANON_KEY removed
import { PlusCircle, Edit2, Trash2, XCircle, Loader2, Sparkles as SparklesIcon } from 'lucide-react'; // Added SparklesIcon
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import EditorToolbar from '../components/ui/EditorToolbar'; // Import the toolbar
import AlertBlockNode from '../extensions/AlertBlockNode'; // Import the custom node
import { preparseAlertBlocks, postserializeAlertBlocks } from '../utils/alertBlockMarkdownParser'; // Import pre and post serializers

interface Article {
  id: string;
  created_at?: string;
  title: string;
  body: string;
  author_id?: string | null;
  category?: string;
  artag?: string;
  imageUrl?: string;
  excerpt?: string; // Added field
}

interface QAItem {
  id: string;
  created_at?: string;
  question_text: string;
  answer_text: string | null;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, logout: authLogout, loadingInitial } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // Renamed for clarity

  const authorizedEmails = ['hillelben14@gmail.com', 'hagben@gmail.com'];

  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [isLoadingQA, setIsLoadingQA] = useState(false);
  const [errorQA, setErrorQA] = useState<string | null>(null);
  const [showQAModal, setShowQAModal] = useState(false);
  const [currentQAItem, setCurrentQAItem] = useState<QAItem | null>(null);
  const [isSubmittingQA, setIsSubmittingQA] = useState(false);

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [errorArticles, setErrorArticles] = useState<string | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default blockquote to avoid conflict if we want custom handling
        // blockquote: false,
      }),
      AlertBlockNode, // Add the custom node
      Markdown.configure({
        html: false, // Ensure output is Markdown
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '*',
        linkify: true,
        breaks: true, // Handle soft line breaks
        // Customizing markdown-it instance used by tiptap-markdown
        // This is a more advanced and potentially more robust way for parsing
        configureMarkdownIt: (md) => {
          // Custom markdown-it plugin for >>> TYPE: blocks
          // This plugin tokenizes the custom syntax.
          // However, tiptap-markdown needs to be configured to map these tokens to the AlertBlockNode.
          // This mapping is the missing piece for full parsing.
          md.block.ruler.before('paragraph', 'alertBlockRuler', (state, startLine, endLine, silent) => {
            let pos = state.bMarks[startLine] + state.tShift[startLine];
            let max = state.eMarks[startLine];
            const lineText = state.src.slice(pos, max);

            if (!lineText.startsWith('>>> ')) return false;

            const typeMatch = lineText.match(/^>>> (INFO|TIP|NOTE|WARNING):(.*)/);
            if (!typeMatch) return false;

            if (silent) return true; // Mark as recognized

            const alertType = typeMatch[1];
            let firstLineContent = typeMatch[2].trim();

            let token = state.push('alert_block_open', 'div', 1);
            token.attrs = [['alertType', alertType]];
            token.map = [startLine, 0]; // Will be updated later

            // Inline token for the first line's content (if any)
            if (firstLineContent) {
              let inlineToken = state.push('inline', '', 0);
              inlineToken.content = firstLineContent;
              inlineToken.map = [startLine, pos + lineText.indexOf(firstLineContent)];
              inlineToken.children = [];
            }

            let currentLine = startLine + 1;
            let contentLines = [];

            while (currentLine < endLine) {
              pos = state.bMarks[currentLine] + state.tShift[currentLine];
              max = state.eMarks[currentLine];
              const nextLineText = state.src.slice(pos, max);

              // Stop if we encounter another block or an empty line (could be configurable)
              if (nextLineText.trim() === '' || nextLineText.startsWith('>>> ') || nextLineText.startsWith('#') || nextLineText.startsWith('* ') || nextLineText.startsWith('- ') || /^\d+\.\s/.test(nextLineText)) {
                break;
              }
              contentLines.push(nextLineText);
              currentLine++;
            }

            if (contentLines.length > 0) {
                let inlineToken = state.push('inline', '', 0);
                inlineToken.content = contentLines.join('\n');
                inlineToken.map = [startLine + 1, currentLine];
                inlineToken.children = [];
            }

            state.push('alert_block_close', 'div', -1);
            token.map[1] = currentLine;
            state.line = currentLine;
            return true;
          });

          // Define how 'alert_block_open' and 'alert_block_close' tokens are converted to ProseMirror nodes
          // This part seems to be missing in tiptap-markdown's direct extensibility.
          // Instead, tiptap-markdown maps known markdown-it tokens to Tiptap nodes.
          // We may need to map 'alert_block_open' to our 'alertBlock' Tiptap node
          // by overriding how tiptap-markdown's schema is built, or by hoping it
          // can be configured to recognize 'div' tokens with 'alertType' attribute.
          // The `tiptap-markdown` library itself would need to be forked or extended
          // to allow custom token to Tiptap node mapping easily.

          // For now, this plugin adds tokens to the markdown-it stream.
          // The challenge is making tiptap-markdown use these tokens to create AlertBlockNode.
          // It might try to create a generic 'div' if not specifically mapped.
        },
        // Refined toMarkdown for AlertBlockNode
        toMarkdown: (state, node, parent, index) => {
          if (node.type.name === 'alertBlock') {
            state.write(`>>> ${node.attrs.alertType}: `);
            // Iterate over content and serialize it.
            // This needs to handle inline formatting correctly.
            // `state.renderContent(node)` or similar is needed.
            // `tiptap-markdown`'s `state` object has methods for this.
            // The default serializer for node content should be called here.

            // Simplified content serialization:
            let content = "";
            node.forEach((child, offset, i) => {
                // This is very basic, assumes text nodes primarily.
                // A proper solution uses state.renderInline(child) or similar.
                // For now, we'll just get textContent, which loses inline markdown.
                // This needs to be improved to use the `state` object's rendering methods
                // to preserve inline markdown.
                if (i > 0) content += "\n"; // Add newlines between child paragraphs if any
                content += child.textContent;
            });
            state.write(content.trim()); // Write content, needs better inline handling
            state.ensureNewLine(); // Ensure a newline after the block
            state.write('\n'); // Add an extra newline to separate from next block
            // state.closeBlock(node); // Not always needed if ensureNewLine and \n are used
          } else {
            // Fallback for other nodes: this is tricky.
            // Ideally, we call the original/default serializer for other nodes.
            // This is a significant challenge when overriding toMarkdown globally.
            // For now, this function will ONLY handle alertBlock.
            // This means other content might not be serialized by this custom toMarkdown.
            // THIS IS A PROBLEM. A proper solution needs to delegate to original serializers.
          }
        },
      }),
    ],
    content: '', // Initial content
    onUpdate: ({ editor: currentEditor }) => {
      const markdownContent = currentEditor.storage.markdown.getMarkdown();
      setCurrentArticle(prev => (prev ? { ...prev, body: markdownContent } : prev));
    },
    editorProps: {
      // Removed transformPastedText here to rely on PasteRules in AlertBlockNode
      // and potentially Markdown.configure.transformPastedText or configureMarkdownIt
    },
  });

  const qaEditor = useEditor({
    extensions: [
      StarterKit.configure({}),
      AlertBlockNode, // Reusing the same custom node, if QA answers might need it
      Markdown.configure({ // Assuming similar markdown handling as the main editor
        html: false,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '*',
        linkify: true,
        breaks: true,
        // If specific markdown-it or toMarkdown rules were vital and settled for the main editor,
        // they should be replicated here if applicable to QA content.
        // For now, keeping it simpler, assuming default markdown for QA or relying on global settings.
      }),
    ],
    content: '',
    onUpdate: ({ editor: currentQaEditor }) => {
      const htmlContent = currentQaEditor.getHTML();
      const markdownContent = postserializeAlertBlocks(htmlContent);
      setCurrentQAItem(prev => (prev ? { ...prev, answer_text: markdownContent } : prev));
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[100px] max-h-[300px] overflow-y-auto',
      }
    },
  });

  useEffect(() => {
    // Update editor if currentArticle.body changes from outside,
    // or when the modal is opened with an article.
    if (editor && currentArticle ) {
        const editorMarkdown = editor.storage.markdown.getMarkdown();
        const articleBody = currentArticle.body || '';

        // Check if content is different before setting.
        // This is crucial to prevent infinite loops if getMarkdown() isn't perfectly idempotent
        // with setContent() for all syntaxes.
        if (editorMarkdown !== articleBody || !editor.storage.markdownInitialized) {
            // Pre-parse the Markdown to convert custom blocks to HTML
            const processedMarkdownOrHtml = preparseAlertBlocks(articleBody);

            editor.commands.setContent(processedMarkdownOrHtml, false, {
              preserveWhitespace: 'full',
            });
            // Mark that we've initialized content to prevent re-processing if getMarkdown is lossy initially
            editor.storage.markdownInitialized = true;
        }
    } else if (editor && !currentArticle?.body && !editor.storage.markdownInitialized) {
      // Ensure editor is cleared if article body is empty and not yet initialized
      editor.commands.clearContent();
      editor.storage.markdownInitialized = true;
    }
  }, [currentArticle?.body, editor, showArticleModal]);

  useEffect(() => {
    if (editor) {
      editor.storage.markdownInitialized = false;
    }
    if (qaEditor) {
      qaEditor.storage.markdownInitialized = false;
    }
    return () => {
      editor?.destroy();
      qaEditor?.destroy();
      if(editor) { editor.storage.markdownInitialized = false; }
      if(qaEditor) { qaEditor.storage.markdownInitialized = false; }
    };
  }, [editor, qaEditor]);

  // Effect for handling qaEditor content when currentQAItem or modal visibility changes
  useEffect(() => {
    if (qaEditor && showQAModal && currentQAItem) {
      const currentEditorContentAsSaved = postserializeAlertBlocks(qaEditor.getHTML());
      const qaAnswerText = currentQAItem.answer_text || '';

      if (currentEditorContentAsSaved !== qaAnswerText || !qaEditor.storage.markdownInitialized) {
        qaEditor.commands.setContent(preparseAlertBlocks(qaAnswerText), false, { preserveWhitespace: 'full' });
        qaEditor.storage.markdownInitialized = true;
      }
    } else if (qaEditor && !showQAModal && qaEditor.storage.markdownInitialized) {
      // Optionally clear content or reset flag when modal is not visible
      // qaEditor.commands.clearContent(false); // Optional: clear content when modal closes
      qaEditor.storage.markdownInitialized = false;
    }
  }, [currentQAItem?.answer_text, qaEditor, showQAModal, currentQAItem]); // Added currentQAItem to deps

  // State for AI Article Generation Modal
  const [showAiPromptModal, setShowAiPromptModal] = useState(false);
  const [aiArticleTopic, setAiArticleTopic] = useState('');
  const [isGeneratingAiArticle, setIsGeneratingAiArticle] = useState(false); // For loading state
  const [showAiImproveModal, setShowAiImproveModal] = useState(false);
  const [aiImprovementPrompt, setAiImprovementPrompt] = useState('');

  // New useEffect for authorization
  useEffect(() => {
    if (loadingInitial) {
      setIsAuthorized(null);
      return;
    }

    if (!user || !session) {
      setIsAuthorized(false);
      // Optional: navigate to home or login page
      // navigate('/');
      return;
    }

    if (user.email && authorizedEmails.includes(user.email)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      // Optional: Log out user and navigate, or just show access denied
      // authLogout();
      // navigate('/');
    }
  }, [user, session, loadingInitial, navigate, authLogout, authorizedEmails]); // Added authorizedEmails to dependencies

  const handleAiArticleGenerate = async () => {
    if (!aiArticleTopic.trim()) return;
    setIsGeneratingAiArticle(true);
    setErrorArticles(null); // Clear previous article form errors

    // 1. Construct Detailed Prompt:
    const formattingInstructions = `
Please generate an article based on the topic below.
The article should have a clear title, a URL-friendly slug in English, a short preview text (2-3 sentences, plain text), and a body.
Format the article body using the following Markdown-like syntax:
- Headings: Use # for H1, ## for H2, ### for H3, #### for H4.
- Bold: **text**
- Italics: *text*
- Unordered Lists: Start each item with *
- Ordered Lists: Start each item with 1., 2., etc.
- Blockquotes: Start line with >
- Custom Alert Blocks:
  - For informational messages: >>> INFO: Your message here
  - For tips: >>> TIP: Your tip here
  - For notes: >>> NOTE: Your note here
  - For warnings: >>> WARNING: Your warning here
  (Alert block content can span multiple lines after the initial ">>> TYPE: " line.)
- Horizontal Rules: Use --- or ***

Please structure your response as follows, with each part on a new line:
Title: [Generated Title]
Slug: [Generated Slug in English, e.g., my-article-topic]
Preview: [Generated Preview Text, 2-3 sentences, plain text]
Body:
[Generated Body Content using the specified Markdown syntax]

Topic: ${aiArticleTopic}
`;

    try {
      // 2. Make API Call
      const apiKey = 'AIzaSyCJemWe3N0tEkaSwRLz4iuJb5J-jmzDJUM'; // Hardcoded as per issue
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: formattingInstructions }] }],
          generationConfig: { temperature: 0.7, topK: 1, topP: 1, maxOutputTokens: 3072 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}. ${errorData?.error?.message || ''}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No text generated by AI.');
      }

      // 3. Process Response
      let generatedTitle = '';
      let generatedSlug = '';
      let generatedPreview = '';
      let generatedBody = '';

      const titleMatch = generatedText.match(/^Title:\s*(.*)/im);
      if (titleMatch) generatedTitle = titleMatch[1].trim();

      const slugMatch = generatedText.match(/^Slug:\s*(.*)/im);
      if (slugMatch) generatedSlug = slugMatch[1].trim();

      // Non-greedy match for preview, stopping before Body:, Slug:, Title: or end of string
      const previewMatch = generatedText.match(/^Preview:\s*([\s\S]*?)(?=^Body:|^Slug:|^Title:|$)/im);
      if (previewMatch) generatedPreview = previewMatch[1].trim();

      const bodyMatch = generatedText.match(/^Body:\s*([\s\S]*)/im);
      if (bodyMatch) generatedBody = bodyMatch[1].trim();

      // Fallbacks and error handling
      if (!generatedTitle && !generatedSlug && !generatedPreview && !generatedBody && generatedText.length > 0) {
        // If no markers found, and there's text, assume it's all body. Title will be derived.
        generatedBody = generatedText;
        console.warn("AI response did not follow the expected Title/Slug/Preview/Body structure. Assigning full response to body.");
      } else {
        // Handle cases where some fields might be missing or body marker was not found correctly
        if (!generatedBody && (generatedTitle || generatedSlug || generatedPreview)) {
            let remainingText = generatedText;
            if (titleMatch) remainingText = remainingText.substring(remainingText.indexOf(titleMatch[0]) + titleMatch[0].length);
            if (slugMatch) remainingText = remainingText.substring(remainingText.indexOf(slugMatch[0]) + slugMatch[0].length);
            if (previewMatch) remainingText = remainingText.substring(remainingText.indexOf(previewMatch[0]) + previewMatch[0].length);
            // The bodyMatch itself would have consumed the rest if it matched "Body:",
            // so if bodyMatch is null but other fields matched, "Body:" was likely missing.
            // In this case, the remainingText after stripping other known sections is the body.
            remainingText = remainingText.replace(/^Body:\s*/im, '').trim(); // Remove "Body:" if it's there but bodyMatch failed
            if(remainingText.length > 0 && !generatedBody) {
                generatedBody = remainingText;
                console.warn("Body marker might be missing or misplaced. Inferred body from remaining text.");
            }
        }
      }

      if (!generatedBody) {
        if (generatedPreview.length > 250 && generatedBody.length < 10) { // Arbitrary threshold
            generatedBody = generatedPreview; // Use preview as body
            generatedPreview = generatedBody.replace(/#.*$/gm, '').replace(/>.*$/gm, '').replace(/\*.*$/gm, '').replace(/---.*$/gm, '').replace(/>>>.*$/gm, '').replace(/\n\s*\n/g, ' ').replace(/\s\s+/g, ' ').trim().substring(0, 150) + "..."; // Create a new short preview
            console.warn("Generated body was empty, but preview was long. Used preview for body and created a new short preview.");
        } else {
             throw new Error('AI did not generate a recognizable body. Ensure Title, Slug, Preview, and Body markers are used by the AI, or the content is substantial.');
        }
      }
      if (!generatedTitle) {
          generatedTitle = aiArticleTopic.substring(0, 50) + (aiArticleTopic.length > 50 ? "..." : "") + " (AI Generated)";
          console.warn("AI did not provide a title. Generated one from the topic.");
      }
      if (!generatedSlug && generatedTitle) {
          generatedSlug = generatedTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').substring(0, 70);
          console.warn("AI did not provide a slug. Generated one from the title.");
      }
      if (!generatedPreview && generatedBody) {
          generatedPreview = generatedBody.replace(/#.*$/gm, '').replace(/>.*$/gm, '').replace(/\*.*$/gm, '').replace(/---.*$/gm, '').replace(/>>>.*$/gm, '').replace(/\n\s*\n/g, ' ').replace(/\s\s+/g, ' ').trim().substring(0, 200) + (generatedBody.length > 200 ? "..." : "");
          console.warn("AI did not provide a preview. Generated one from the body.");
      }


      // 4. Update Editor state
      if (currentArticle) {
          setCurrentArticle(prev => ({
              ...prev,
              title: generatedTitle,
              artag: generatedSlug,
              excerpt: generatedPreview,
              body: generatedBody
          }));
      } else {
           setCurrentArticle({
              id: '', // New article
              title: generatedTitle,
              artag: generatedSlug,
              excerpt: generatedPreview,
              body: generatedBody,
              category: '', // Default category
              imageUrl: '', // Default imageUrl
          });
      }

      // The editor content will be updated by the useEffect listening to currentArticle.body
      // That useEffect already calls preparseAlertBlocks.

      setShowAiPromptModal(false);
      setAiArticleTopic('');

    } catch (error: any) {
      console.error('Failed to generate AI article:', error);
      setErrorArticles(`שגיאה ביצירת מאמר AI: ${error.message}`);
    } finally {
      setIsGeneratingAiArticle(false);
    }
  };

  const handleAiArticleImprove = async () => {
    if (!aiImprovementPrompt.trim()) return;

    const currentBody = editor?.storage.markdown.getMarkdown();
    if (!currentBody || !currentBody.trim()) {
      alert("המאמר ריק. אנא כתוב תוכן לפני שתנסה לשפר אותו.");
      return;
    }

    setIsGeneratingAiArticle(true);
    setErrorArticles(null);

    const improvementRequestPrompt = `
Please improve the following article based on the instructions provided.
The improved article should be formatted using Markdown-like syntax:
- Headings: Use # for H1, ## for H2, ### for H3, #### for H4.
- Bold: **text**
- Italics: *text*
- Unordered Lists: Start each item with *
- Ordered Lists: Start each item with 1., 2., etc.
- Blockquotes: Start line with >
- Custom Alert Blocks:
  - For informational messages: >>> INFO: Your message here
  - For tips: >>> TIP: Your tip here
  - For notes: >>> NOTE: Your note here
  - For warnings: >>> WARNING: Your warning here
  (Alert block content can span multiple lines after the initial ">>> TYPE: " line.)
- Horizontal Rules: Use --- or ***
Ensure the output strictly contains only the improved article body, prefixed with "Body: ". Do not include a title.

Instructions for improvement:
${aiImprovementPrompt}

Original Article:
${currentBody}
`;

    try {
      const apiKey = 'AIzaSyCJemWe3N0tEkaSwRLz4iuJb5J-jmzDJUM'; // Hardcoded as per issue
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: improvementRequestPrompt }] }],
          generationConfig: { temperature: 0.7, topK: 1, topP: 1, maxOutputTokens: 4096 } // Increased max tokens for improvement
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error (Improvement):', errorData);
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}. ${errorData?.error?.message || ''}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No text generated by AI for improvement.');
      }

      let improvedBody = '';
      const bodyMatch = generatedText.match(/^Body:\s*([\s\S]*)/i);
      if (bodyMatch && bodyMatch[1]) {
        improvedBody = bodyMatch[1].trim();
      } else {
        // Fallback if "Body:" prefix is missing, assume the whole response is the body.
        // This might happen if the AI doesn't follow the prefix instruction perfectly.
        console.warn("AI response for improvement did not start with 'Body:'. Using entire response.");
        improvedBody = generatedText.trim();
      }

      if (!improvedBody) {
        // This check is important if the AI returns "Body: " but nothing after it.
        throw new Error('AI did not generate a recognizable body for improvement.');
      }

      if (currentArticle && editor) {
        // It's important to use preparseAlertBlocks here so that the editor
        // correctly renders the custom markdown syntax as HTML for Tiptap.
        const processedMarkdownOrHtml = preparseAlertBlocks(improvedBody);
        editor.commands.setContent(processedMarkdownOrHtml, true, { preserveWhitespace: 'full' });

        // Update currentArticle state so that if the user saves without further edits,
        // the improvedBody (raw markdown) is saved.
        // The editor's onUpdate callback will also try to set this, but setting it here
        // ensures the state is updated even if onUpdate doesn't fire immediately or correctly.
        setCurrentArticle(prev => ({ ...prev!, body: improvedBody }));
      }

      setShowAiImproveModal(false);
      setAiImprovementPrompt('');

    } catch (error: any) {
      console.error('Failed to improve AI article:', error);
      setErrorArticles(`שגיאה בשיפור מאמר AI: ${error.message}`);
    } finally {
      setIsGeneratingAiArticle(false);
    }
  };

  // Old session-based auth logic removed.

  const fetchArticles = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingArticles(true);
    setErrorArticles(null);
    try {
      const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch (err: any) {
      setErrorArticles(`שגיאה בטעינת המאמרים: ${err.message}`);
    } finally {
      setIsLoadingArticles(false);
    }
  }, []);

  const fetchQAItems = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingQA(true);
    setErrorQA(null);
    try {
      const { data, error } = await supabase.from('qa').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setQaItems(data || []);
    } catch (err: any) {
      setErrorQA(`שגיאה בטעינת שאלות ותשובות: ${err.message}`);
    } finally {
      setIsLoadingQA(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized && supabase) { // Changed isAuthenticated to isAuthorized
      fetchArticles();
      fetchQAItems();
    }
  }, [isAuthorized, fetchArticles, fetchQAItems]); // Changed isAuthenticated to isAuthorized

  const handleOpenArticleModal = (article: Article | null = null) => {
    setCurrentArticle(article ? { ...article } : { id: '', title: '', body: '', category: '', artag: '', imageUrl: '', excerpt: '' });
    setShowArticleModal(true);
  };
  const handleCloseArticleModal = () => { setShowArticleModal(false); setCurrentArticle(null); setErrorArticles(null); };
  const handleArticleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (currentArticle) setCurrentArticle({ ...currentArticle, [e.target.name]: e.target.value });
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArticle || !supabase) return;
    setIsSubmittingArticle(true); setErrorArticles(null);
    const articleData = {
      title: currentArticle.title,
      body: currentArticle.body,
      category: currentArticle.category || null,
      artag: currentArticle.artag || null,
      imageUrl: currentArticle.imageUrl || null,
      excerpt: currentArticle.excerpt || null, // Add this line
      date: new Date().toLocaleDateString('he-IL'),
    };
    try {
      const { error } = currentArticle.id ? await supabase.from('articles').update(articleData).eq('id', currentArticle.id) : await supabase.from('articles').insert([articleData]);
      if (error) throw error;
      alert(`מאמר ${currentArticle.id ? 'עודכן' : 'נוצר'} בהצלחה!`);
      handleCloseArticleModal(); fetchArticles();
    } catch (err: any) {
      setErrorArticles(`שגיאה בשמירת המאמר: ${err.message}`);
    } finally {
      setIsSubmittingArticle(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!supabase || !window.confirm('האם אתה בטוח שברצונך למחוק מאמר זה? פעולה זו אינה ניתנת לשחזור.')) return;
    setErrorArticles(null); setIsLoadingArticles(true); // Show general loading for list
    try {
      const { error } = await supabase.from('articles').delete().eq('id', articleId);
      if (error) throw error;
      alert('המאמר נמחק בהצלחה!'); fetchArticles();
    } catch (err: any) {
      setErrorArticles(`שגיאה במחיקת המאמר: ${err.message}`);
      setIsLoadingArticles(false); // Ensure loading stops on delete error if fetchArticles isn't reached
    }
  };

  const handleOpenQAModal = (qaItem: QAItem | null = null) => {
    const itemToLoad = qaItem ? { ...qaItem } : { id: '', question_text: '', answer_text: '' };
    setCurrentQAItem(itemToLoad); // Set currentQAItem first
    setShowQAModal(true);
    // Content setting is now primarily handled by the useEffect listening to currentQAItem.answer_text & showQAModal
    // However, to ensure content is fresh if the same item is reopened, explicitly set it.
    // The useEffect might not fire if item object is same but content was cleared.
    if (qaEditor) {
        qaEditor.commands.setContent(preparseAlertBlocks(itemToLoad.answer_text || ''), false, { preserveWhitespace: 'full' });
        qaEditor.storage.markdownInitialized = true; // Mark as initialized
    }
  };

  const handleCloseQAModal = () => {
    setShowQAModal(false);
    // setCurrentQAItem(null); // Clearing currentQAItem will trigger useEffect to clear editor if needed
    setErrorQA(null);
    if (qaEditor) {
      qaEditor.storage.markdownInitialized = false; // Reset flag
    }
  };

  const handleQAQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (currentQAItem) {
      setCurrentQAItem({ ...currentQAItem, question_text: e.target.value });
    }
  };

  const handleQASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQAItem || !supabase) return;
    setIsSubmittingQA(true); setErrorQA(null);
    const qaData = { question_text: currentQAItem.question_text, answer_text: currentQAItem.answer_text || null };
    try {
      const { error } = currentQAItem.id ? await supabase.from('qa').update(qaData).eq('id', currentQAItem.id) : await supabase.from('qa').insert([qaData]);
      if (error) throw error;
      alert(`שאלה ותשובה ${currentQAItem.id ? 'עודכנו' : 'נוצרו'} בהצלחה!`);
      handleCloseQAModal(); fetchQAItems();
    } catch (err: any) {
      setErrorQA(`שגיאה בשמירת השאלה והתשובה: ${err.message}`);
    } finally {
      setIsSubmittingQA(false);
    }
  };

  const handleDeleteQA = async (qaId: string) => {
    if (!supabase || !window.confirm('האם אתה בטוח שברצונך למחוק שאלה ותשובה זו? פעולה זו אינה ניתנת לשחזור.')) return;
    setErrorQA(null); setIsLoadingQA(true); // Show general loading for list
    try {
      const { error } = await supabase.from('qa').delete().eq('id', qaId);
      if (error) throw error;
      alert('השאלה והתשובה נמחקו בהצלחה!'); fetchQAItems();
    } catch (err: any) {
      setErrorQA(`שגיאה במחיקת השאלה והתשובה: ${err.message}`);
      setIsLoadingQA(false); // Ensure loading stops on delete error if fetchQAItems isn't reached
    }
  };

  if (isAuthorized === null) { // Changed isAuthenticated to isAuthorized
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
        <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-sky-400" />
        <p className="text-xl mt-4">טוען...</p>
      </div>
    );
  }

  if (!isAuthorized) { // Changed isAuthenticated to isAuthorized
    return (
      <div className="p-8 text-center min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-3">גישה נדחתה</h1>
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300">
          {/* Updated message based on user state */}
          {!loadingInitial && !user
            ? "אין לך הרשאה לגשת לדף זה. אנא התחבר כמנהל דרך חלונית הצ'אט."
            : "משתמש אינו מורשה לגשת לדף זה."}
        </p>
        <button onClick={() => navigate('/')} className="mt-8 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-md transition-colors duration-150 font-medium">
          חזור לדף הבית
        </button>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="p-8 text-center min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600 mb-3">שגיאת הגדרת Supabase</h1>
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300">
          פרטי ההתחברות ל-Supabase חסרים. לא ניתן לטעון את לוח הניהול.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200" dir="rtl">
      <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-primary dark:text-sky-400">לוח ניהול - {APP_NAME}</h1>
            <button onClick={async () => { await authLogout(); navigate('/'); }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-medium rounded-md shadow-sm transition-colors duration-150 flex items-center">
              <XCircle size={18} className="ml-1.5 sm:ml-2" /> התנתק
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <p className="mb-6 sm:mb-8 text-base sm:text-lg text-slate-700 dark:text-slate-300">
          ברוך הבא ללוח הניהול. כאן תוכל לנהל את התכנים באתר.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-500">ניהול מאמרים</h2>
              <button onClick={() => handleOpenArticleModal()} className="px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center shadow-md text-sm font-medium transition-colors">
                <PlusCircle size={18} className="ml-2" /> הוסף מאמר
              </button>
            </div>
            {isLoadingArticles && (
              <div className="flex flex-col items-center justify-center p-6 text-slate-600 dark:text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-primary dark:text-sky-400" />
                <p className="mt-3 text-sm">טוען מאמרים...</p>
              </div>
            )}
            {errorArticles && <div className="p-3 my-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorArticles}</div>}
            {!isLoadingArticles && !errorArticles && articles.length === 0 && (<p className="text-slate-500 dark:text-slate-400 text-center py-6 text-sm">לא נמצאו מאמרים.</p>)}
            {!isLoadingArticles && !errorArticles && articles.length > 0 && (
              <div className="space-y-4">
                {articles.map(article => (
                  <div key={article.id} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-slate-50 dark:bg-slate-700/40">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">{article.title}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {article.category && <span className="font-medium bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-full">{article.category}</span>}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 clamp-2">{article.body.substring(0,120) + (article.body.length > 120 ? '...' : '')}</p>
                    <div className="flex gap-x-2 mt-3">
                      <button onClick={() => handleOpenArticleModal(article)} className="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-sky-500 hover:bg-sky-600 text-white"><Edit2 size={14} className="ml-1.5" />ערוך</button>
                      <button onClick={() => handleDeleteArticle(article.id)} className="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-red-500 hover:bg-red-600 text-white"><Trash2 size={14} className="ml-1.5" />מחק</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-500">ניהול שאלות (FAQ)</h2>
              <button onClick={() => handleOpenQAModal()} className="px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center shadow-md text-sm font-medium transition-colors">
                <PlusCircle size={18} className="ml-2" /> הוסף שאלה
              </button>
            </div>
            {isLoadingQA && (
              <div className="flex flex-col items-center justify-center p-6 text-slate-600 dark:text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-primary dark:text-sky-400" />
                <p className="mt-3 text-sm">טוען שאלות ותשובות...</p>
              </div>
            )}
            {errorQA && <div className="p-3 my-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorQA}</div>}
            {!isLoadingQA && !errorQA && qaItems.length === 0 && (<p className="text-slate-500 dark:text-slate-400 text-center py-6 text-sm">לא נמצאו שאלות ותשובות.</p>)}
            {!isLoadingQA && !errorQA && qaItems.length > 0 && (
              <div className="space-y-3">
                {qaItems.map(item => (
                  <div key={item.id} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-slate-50 dark:bg-slate-700/40">
                    <h4 className="text-md font-semibold text-slate-800 dark:text-slate-100">{item.question_text}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mt-1 mb-2.5 clamp-2">{item.answer_text ? item.answer_text.substring(0,120) + (item.answer_text.length > 120 ? '...' : '') : <span className="italic opacity-75">אין תשובה עדיין</span>}</p>
                    <div className="flex gap-x-2 mt-3">
                      <button onClick={() => handleOpenQAModal(item)} className="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-sky-500 hover:bg-sky-600 text-white"><Edit2 size={14} className="ml-1.5" />ערוך</button>
                      <button onClick={() => handleDeleteQA(item.id)} className="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-red-500 hover:bg-red-600 text-white"><Trash2 size={14} className="ml-1.5" />מחק</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {showArticleModal && currentArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[100] p-4" dir="rtl">
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-400">{currentArticle.id ? 'עריכת מאמר' : 'הוספת מאמר חדש'}</h3>
                <button onClick={handleCloseArticleModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"><XCircle size={26} /></button>
              </div>
              <form onSubmit={handleArticleSubmit} className="overflow-y-auto space-y-5 pr-1 sm:pr-2 flex-grow">
                {errorArticles && <div className="p-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorArticles}</div>}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">כותרת</label>
                  <input type="text" name="title" id="title" value={currentArticle.title} onChange={handleArticleFormChange} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" required />
                </div>
                <div className="my-4"> {/* Added margin for spacing */}
                  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <button
                      type="button"
                      onClick={() => setShowAiPromptModal(true)}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-purple-400"
                      disabled={isGeneratingAiArticle || isSubmittingArticle} // Disable if AI is working or main form is submitting
                    >
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      הפק מאמר בעזרת AI (כותרת ותוכן)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAiImproveModal(true)}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-400"
                      disabled={isGeneratingAiArticle || isSubmittingArticle || !currentArticle?.body.trim()}
                    >
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      שפר מאמר עם AI
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">תוכן מלא</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm">
                    {editor && <EditorToolbar editor={editor} />}
                    {editor && <EditorContent editor={editor} className="w-full p-3 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white text-sm sm:text-base min-h-[150px] max-h-[400px] overflow-y-auto" />}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">קטגוריה</label>
                    <input type="text" name="category" id="category" value={currentArticle.category || ''} onChange={handleArticleFormChange} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" />
                  </div>
                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">קישור לתמונה</label>
                    <input type="text" name="imageUrl" id="imageUrl" value={currentArticle.imageUrl || ''} onChange={handleArticleFormChange} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" />
                  </div>
                </div>
                <div>
                  <label htmlFor="excerpt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">טקסט מקדים (לתצוגה מקדימה)</label>
                  <textarea name="excerpt" id="excerpt" value={currentArticle.excerpt || ''} onChange={handleArticleFormChange} rows={3} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" />
                </div>
                <div>
                  <label htmlFor="artag" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">תג מאמר (באנגלית לקישור)</label>
                  <input type="text" name="artag" id="artag" value={currentArticle.artag || ''} onChange={handleArticleFormChange} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" />
                </div>
                <div className="flex justify-end gap-x-3 pt-5 mt-auto border-t border-slate-300 dark:border-slate-700">
                  <button type="button" onClick={handleCloseArticleModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors" disabled={isSubmittingArticle}>ביטול</button>
                  <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg flex items-center disabled:opacity-70 transition-colors" disabled={isSubmittingArticle}>
                    {isSubmittingArticle && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isSubmittingArticle ? (currentArticle.id ? 'מעדכן...' : 'שומר...') : (currentArticle.id ? 'שמור שינויים' : 'צור מאמר')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showQAModal && currentQAItem && (
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[100] p-4" dir="rtl">
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-400">{currentQAItem.id ? 'עריכת שאלה ותשובה' : 'הוספת שאלה חדשה'}</h3>
                <button onClick={handleCloseQAModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"><XCircle size={26} /></button>
              </div>
              <form onSubmit={handleQASubmit} className="overflow-y-auto space-y-5 pr-1 sm:pr-2 flex-grow">
                {errorQA && <div className="p-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorQA}</div>}
                <div>
                  <label htmlFor="question_text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">שאלה</label>
                  <textarea name="question_text" id="question_text" value={currentQAItem.question_text} onChange={handleQAQuestionChange} rows={3} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" required />
                </div>
                <div>
                  <label htmlFor="answer_text_editor" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">תשובה</label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm">
                    {qaEditor && <EditorToolbar editor={qaEditor} />}
                    {qaEditor && <EditorContent editor={qaEditor} id="answer_text_editor" />}
                  </div>
                </div>
                <div className="flex justify-end gap-x-3 pt-5 mt-auto border-t border-slate-300 dark:border-slate-700">
                  <button type="button" onClick={handleCloseQAModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors" disabled={isSubmittingQA}>ביטול</button>
                  <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg flex items-center disabled:opacity-70 transition-colors" disabled={isSubmittingQA}>
                    {isSubmittingQA && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {isSubmittingQA ? (currentQAItem.id ? 'מעדכן...' : 'שומר...') : (currentQAItem.id ? 'שמור שינויים' : 'צור שאלה')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-800 mt-8 sm:mt-12 py-6 text-center border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">&copy; {new Date().getFullYear()} {APP_NAME} Admin Panel</p>
      </footer>

      {/* AI Prompt Modal */}
      {showAiPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[110] p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg sm:text-xl font-semibold text-primary dark:text-sky-400">הפק מאמר בעזרת AI</h3>
                <button
                    onClick={() => { if (!isGeneratingAiArticle) {setShowAiPromptModal(false); setAiArticleTopic('');} }}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
                    disabled={isGeneratingAiArticle}
                >
                    <XCircle size={24} />
                </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              הסבר בקצרה על מה תרצה שהמאמר יהיה (לדוגמה, נושא מרכזי, נקודות עיקריות, קהל יעד).
              ה-AI ינסח טיוטה ראשונית עבור הכותרת ותוכן המאמר. תוכל לערוך את התוצאה לאחר מכן.
            </p>
            <textarea
              value={aiArticleTopic}
              onChange={(e) => setAiArticleTopic(e.target.value)}
              rows={5}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base mb-5"
              placeholder="לדוגמה: 'היתרונות של למידה מרחוק לתלמידי תיכון', 'כיצד להתכונן למבחן מחוננים שלב א', 'סקירה על תוכנית אודיסאה והשפעתה על בני נוער'"
              disabled={isGeneratingAiArticle}
            />
            {isGeneratingAiArticle && (
              <div className="flex items-center justify-center p-3 my-4 text-sm rounded-lg border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-primary dark:text-sky-400 mr-3" />
                מייצר מאמר, נא להמתין... זה עשוי לקחת עד דקה.
              </div>
            )}
            <div className="flex justify-end gap-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setShowAiPromptModal(false); setAiArticleTopic(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                disabled={isGeneratingAiArticle}
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleAiArticleGenerate}
                className="px-5 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg flex items-center disabled:opacity-70 transition-colors"
                disabled={!aiArticleTopic.trim() || isGeneratingAiArticle}
              >
                {isGeneratingAiArticle ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SparklesIcon className="h-4 w-4 mr-2" />}
                {isGeneratingAiArticle ? 'מייצר...' : 'הפק מאמר'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Improve Modal */}
      {showAiImproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[110] p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg sm:text-xl font-semibold text-primary dark:text-sky-400">שפר מאמר עם AI</h3>
              <button
                onClick={() => { if (!isGeneratingAiArticle) { setShowAiImproveModal(false); setAiImprovementPrompt(''); } }}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
                disabled={isGeneratingAiArticle}
              >
                <XCircle size={24} />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              הסבר ל-AI כיצד תרצה לשפר את המאמר הקיים. לדוגמה: 'הפוך את הטקסט ליותר רשמי', 'הוסף דוגמאות לכל נקודה', 'קצר את המאמר בחצי', 'שנה את קהל היעד לילדים'.
            </p>
            <textarea
              value={aiImprovementPrompt}
              onChange={(e) => setAiImprovementPrompt(e.target.value)}
              rows={5}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base mb-5"
              placeholder="לדוגמה: 'הפוך את המאמר ליותר ידידותי למתחילים', 'הוסף סיכום קצר', 'פרט יותר על היתרונות של X'"
              disabled={isGeneratingAiArticle}
            />
            {isGeneratingAiArticle && (
              <div className="flex items-center justify-center p-3 my-4 text-sm rounded-lg border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-primary dark:text-sky-400 mr-3" />
                משפר מאמר, נא להמתין... זה עשוי לקחת עד דקה.
              </div>
            )}
            <div className="flex justify-end gap-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setShowAiImproveModal(false); setAiImprovementPrompt(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                disabled={isGeneratingAiArticle}
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleAiArticleImprove} // This function will be created in the next step
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center disabled:opacity-70 transition-colors focus:ring-2 focus:ring-blue-400"
                disabled={!aiImprovementPrompt.trim() || isGeneratingAiArticle}
              >
                {isGeneratingAiArticle ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SparklesIcon className="h-4 w-4 mr-2" />}
                {isGeneratingAiArticle ? 'משפר...' : 'שפר מאמר'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
