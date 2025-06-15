import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Added import
import { SupabaseClient } from '@supabase/supabase-js'; // createClient removed
import { supabase } from '../utils/supabaseClient'; // Added import
import { APP_NAME } from '../constants'; // SUPABASE_URL, SUPABASE_ANON_KEY removed
import { PlusCircle, Edit2, Trash2, XCircle, Loader2, Sparkles as SparklesIcon } from 'lucide-react'; // Added SparklesIcon
import { SiteAdmin } from '../types'; // Corrected path
import { useEditor, EditorContent } from '@tiptap/react';
import { formatArticleContentToHtml } from '../utils/contentParser';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import EditorToolbar from '../components/ui/EditorToolbar'; // Import the toolbar
import AlertBlockNode from '../extensions/AlertBlockNode'; // Import the custom node
import { preparseAlertBlocks, postserializeAlertBlocks } from '../utils/alertBlockMarkdownParser'; // Import pre and post serializers

interface Article {
  id: string;
  created_at?: string;
  title: string;
  fullContent: string;
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

interface BlockedItem {
  id: string;
  type: 'IP' | 'EMAIL';
  value: string;
  reason?: string | null;
  created_at: string;
  admin_id?: string | null; // Optional: if you want to display who blocked it
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, session, logout: authLogout, loadingInitial } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null); // Renamed for clarity

  const authorizedEmails = ['hillelben14@gmail.com', 'hagben@gmail.com'];

  const [adminsList, setAdminsList] = useState<SiteAdmin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [errorAdmins, setErrorAdmins] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminExpiresAt, setNewAdminExpiresAt] = useState('');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

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
  const [hasUnsavedArticleChanges, setHasUnsavedArticleChanges] = useState(false);
  const [isSubmittingArticle, setIsSubmittingArticle] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [qaPreviewHtml, setQaPreviewHtml] = useState<string>(''); // Added state for QA preview

  // State for AI QA Generation
  const [showAiQAPromptModal, setShowAiQAPromptModal] = useState(false);
  const [aiQATopic, setAiQATopic] = useState('');
  const [isGeneratingAiQA, setIsGeneratingAiQA] = useState(false); // Used for both QA generation and improvement

  // State for AI QA Improvement
  const [showAiQAImproveModal, setShowAiQAImproveModal] = useState(false);
  const [aiQAImprovementPrompt, setAiQAImprovementPrompt] = useState('');

  // State for User Blocking Management
  const [userActivityIPs, setUserActivityIPs] = useState<string[]>([]);
  const [userActivityEmails, setUserActivityEmails] = useState<string[]>([]);
  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  const [isLoadingUserActivity, setIsLoadingUserActivity] = useState(false);
  const [errorUserActivity, setErrorUserActivity] = useState<string | null>(null);
  const [isLoadingBlockedItems, setIsLoadingBlockedItems] = useState(false);
  const [errorBlockedItems, setErrorBlockedItems] = useState<string | null>(null);
  const [newBlockValue, setNewBlockValue] = useState('');
  const [newBlockType, setNewBlockType] = useState<'IP' | 'EMAIL'>('IP');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

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
            // Updated to use state.renderContent to preserve inline formatting.
            // renderContent typically handles its own newlines for block content.
            // If it renders paragraph nodes within, those will be separated by newlines.
            state.renderContent(node);
            state.ensureNewLine(); // Ensure a newline after the block's content
            state.write('\n');     // Add an extra newline for separation, if desired
            // No state.closeBlock(node) needed as renderContent should handle block closing.
          }
          // Removed the `else` block to allow tiptap-markdown's default serializers
          // to handle all other node types (paragraphs, headings, lists, bold, italic, etc.).
        },
      }),
    ],
    content: '', // Initial content
onUpdate: ({ editor: currentEditor }) => {
  setCurrentArticle(prev => {
    if (!prev) return prev;

    const markdownOutput = currentEditor.storage.markdown.getMarkdown();
    console.log("Refactored Markdown Output (getMarkdown):", markdownOutput); // For debugging

    const correctlySerializedMarkdown = postserializeAlertBlocks(markdownOutput);
    const updated = { ...prev, fullContent: correctlySerializedMarkdown };

    localStorage.setItem('draftArticle', JSON.stringify(updated));
    return updated;
  });

  setHasUnsavedArticleChanges(true);
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
      if (currentQAItem) {
        // Using the same serialization strategy as the main editor
        const htmlContent = currentQaEditor.getHTML(); // Get HTML
        const markdownContent = postserializeAlertBlocks(htmlContent); // Convert custom blocks

        // Fallback if postserializeAlertBlocks isn't enough (e.g. it only handles custom blocks)
        // and we need full HTML-to-Markdown for the rest.
        // For now, we assume postserializeAlertBlocks gives a string that's "good enough" for storage,
        // or that tiptap-markdown's getMarkdown() was used if preferred.
        // Let's stick to the pattern from the article editor:
        // let markdownOutput = currentQaEditor.storage.markdown.getMarkdown();
        // const finalMarkdown = postserializeAlertBlocks(markdownOutput);

        if (currentQAItem.answer_text !== markdownContent) {
          setCurrentQAItem(prev => prev ? { ...prev, answer_text: markdownContent } : null);
        }
      }
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[100px] max-h-[300px] overflow-y-auto',
      }
    },
  });

  useEffect(() => {
    // Update editor if currentArticle.fullContent changes from outside,
    // or when the modal is opened with an article.
    if (editor && currentArticle) {
        const editorMarkdown = editor.storage.markdown.getMarkdown();
        // Explicitly ensure articleBody is a string
        const articleBody = typeof currentArticle.fullContent === 'string' ? currentArticle.fullContent : '';

        // Check if content is different before setting.
        // This is crucial to prevent infinite loops if getMarkdown() isn't perfectly idempotent
        // with setContent() for all syntaxes.
        if (editorMarkdown !== articleBody || !editor.storage.markdownInitialized) {
            // Pre-parse the Markdown to convert custom blocks to HTML
            const processedMarkdownOrHtml = preparseAlertBlocks(articleBody);
            try {
              editor.commands.setContent(processedMarkdownOrHtml, false, {
                preserveWhitespace: 'full',
              });
            } catch (error) {
              console.error("Error during editor.commands.setContent:", error);
              // Optionally, re-throw or handle further, e.g., by setting an error state
            }
            // Mark that we've initialized content to prevent re-processing if getMarkdown is lossy initially
            editor.storage.markdownInitialized = true;
        }
    } else if (editor && !currentArticle?.fullContent && !editor.storage.markdownInitialized) {
      // Ensure editor is cleared if article body is empty and not yet initialized
      try {
        editor.commands.clearContent();
      } catch (error) {
        console.error("Error during editor.commands.clearContent:", error);
      }
      editor.storage.markdownInitialized = true;
    }
  }, [currentArticle?.fullContent, editor, showArticleModal]);

  // useEffect for updating live preview
  useEffect(() => {
    if (currentArticle && currentArticle.fullContent) {
      const formattedHtml = formatArticleContentToHtml(currentArticle.fullContent);
      setPreviewHtml(formattedHtml);
    } else {
      setPreviewHtml('<p class="text-slate-500 dark:text-slate-400">Preview will appear here once you start writing...</p>');
    }
  }, [currentArticle?.fullContent]);

  // useEffect for updating QA live preview
  useEffect(() => {
    if (currentQAItem && currentQAItem.answer_text) {
      const formattedHtml = formatArticleContentToHtml(currentQAItem.answer_text);
      setQaPreviewHtml(formattedHtml);
    } else {
      setQaPreviewHtml('<p class="text-slate-500 dark:text-slate-400">Preview will appear here once you start writing...</p>');
    }
  }, [currentQAItem?.answer_text, currentQAItem]);


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

  const handleAiQAGenerate = async () => {
    if (!aiQATopic.trim() || !currentQAItem) return;
    setIsGeneratingAiQA(true);
    setErrorQA(null);

    const userProvidedInput = aiQATopic.trim();
    let promptInstruction = '';

    if (userProvidedInput.endsWith('?')) {
      promptInstruction = `
Please provide a comprehensive answer to the following question.
Format the answer using Markdown-like syntax (headings, bold: **text**, italics: *text*, lists: * item, alerts: >>> INFO: message).
Ensure the output strictly contains only the answer content. Do not include "Answer:" or any similar prefix.

Question:
${userProvidedInput}

Answer:
[Generated Answer Content in Markdown]
`;
    } else {
      promptInstruction = `
Based on the topic below, please formulate a relevant question and provide a comprehensive answer.
Format the answer using Markdown-like syntax (headings, bold: **text**, italics: *text*, lists: * item, alerts: >>> INFO: message).
Ensure the output for the answer strictly contains only the answer content itself, without any "Answer:" prefix.
Structure your response as follows:
Question: [Generated Question]
Answer:
[Generated Answer Content in Markdown]

Topic: ${userProvidedInput}
`;
    }

    try {
      const apiKey = 'AIzaSyCJemWe3N0tEkaSwRLz4iuJb5J-jmzDJUM'; // Hardcoded as per issue
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptInstruction }] }],
          generationConfig: { temperature: 0.7, topK: 1, topP: 1, maxOutputTokens: 2048 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error (QA):', errorData);
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}. ${errorData?.error?.message || ''}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No text generated by AI for QA.');
      }

      let generatedQuestion = currentQAItem.question_text || '';
      let generatedAnswer = '';

      if (userProvidedInput.endsWith('?')) {
        generatedAnswer = generatedText.trim();
      } else {
        const questionMatch = generatedText.match(/^Question:\s*(.*)/im);
        if (questionMatch && questionMatch[1]) {
          generatedQuestion = questionMatch[1].trim();
        }
        const answerMatch = generatedText.match(/^Answer:\s*([\s\S]*)/im);
        if (answerMatch && answerMatch[1]) {
          generatedAnswer = answerMatch[1].trim();
        } else if (!questionMatch && generatedText.includes(userProvidedInput)) {
           // If no "Question:" marker, and the original topic is in the response (heuristic)
           // then assume the text after the topic is the answer.
           // This is a fallback if "Answer:" marker is missing.
           const topicIndex = generatedText.indexOf(userProvidedInput);
           let potentialAnswer = generatedText.substring(topicIndex + userProvidedInput.length).trim();
           // Remove "Answer:" prefix if it exists, even if the regex didn't catch it.
           if (potentialAnswer.toLowerCase().startsWith('answer:')) {
             potentialAnswer = potentialAnswer.substring('answer:'.length).trim();
           }
           generatedAnswer = potentialAnswer;
        } else if (!questionMatch) {
            generatedAnswer = generatedText.trim(); // Fallback: assume the whole text is the answer
        }
      }

      if (!generatedAnswer && generatedText) { // If answer is still empty but we got text
        console.warn("AI QA response parsing might have failed to isolate the answer. Using full response as answer.");
        generatedAnswer = generatedText.trim();
         // Attempt to remove Question: prefix if it was added by mistake by the AI
        if (generatedAnswer.startsWith(generatedQuestion)) {
            generatedAnswer = generatedAnswer.substring(generatedQuestion.length).trim();
        }
        if (generatedAnswer.toLowerCase().startsWith('answer:')) {
            generatedAnswer = generatedAnswer.substring('answer:'.length).trim();
        }
      }

      if (!generatedAnswer) {
        throw new Error('AI did not generate a recognizable answer.');
      }

      setCurrentQAItem(prev => ({
        ...prev!,
        question_text: generatedQuestion,
        answer_text: generatedAnswer // This updates the state for the preview
      }));

      if (qaEditor) {
        // The editor content will be updated by the useEffect listening to currentQAItem.answer_text
        // which calls preparseAlertBlocks.
        // However, we can directly set it to ensure immediate update if needed,
        // though relying on the existing useEffect is cleaner.
        // For direct update:
        // qaEditor.commands.setContent(preparseAlertBlocks(generatedAnswer), true, { preserveWhitespace: 'full' });
      }

      setShowAiQAPromptModal(false);
      setAiQATopic('');

    } catch (error: any) {
      console.error('Failed to generate AI QA:', error);
      setErrorQA(`שגיאה ביצירת תשובה עם AI: ${error.message}`);
    } finally {
      setIsGeneratingAiQA(false);
    }
  };

  const handleAiQAImprove = async () => {
    if (!aiQAImprovementPrompt.trim() || !currentQAItem || !qaEditor) {
      setErrorQA("אנא הזן הוראות לשיפור וודא שיש תשובה קיימת לערוך.");
      return;
    }

    const currentAnswerMarkdown = qaEditor.storage.markdown.getMarkdown();
    if (!currentAnswerMarkdown?.trim()) {
      setErrorQA("התשובה הנוכחית ריקה. אנא כתוב תוכן לפני שתנסה לשפר אותו.");
      setShowAiQAImproveModal(false); // Close the improve modal, user should edit directly or generate first
      return;
    }

    setIsGeneratingAiQA(true); // Reuse loading state
    setErrorQA(null);

    const promptInstruction = `
Please improve the following Q&A answer based on the instructions provided.
Format the improved answer using Markdown-like syntax (headings, bold: **text**, italics: *text*, lists: * item, alerts: >>> INFO: message).
Ensure the output strictly contains only the improved answer body. Do not include "ImprovedAnswer:" or any similar prefix.

Instructions for improvement:
${aiQAImprovementPrompt}

Original Answer:
${currentAnswerMarkdown}

ImprovedAnswer:
[Generated Improved Answer Content in Markdown]
`;

    try {
      const apiKey = 'AIzaSyCJemWe3N0tEkaSwRLz4iuJb5J-jmzDJUM'; // Hardcoded as per issue
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptInstruction }] }],
          generationConfig: { temperature: 0.7, topK: 1, topP: 1, maxOutputTokens: 2048 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error (QA Improve):', errorData);
        throw new Error(`Gemini API request failed for QA improvement: ${response.status} ${response.statusText}. ${errorData?.error?.message || ''}`);
      }

      const data = await response.json();
      let improvedAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!improvedAnswer) {
        throw new Error('AI did not generate a recognizable improved answer.');
      }

      // Remove "ImprovedAnswer:" prefix if AI includes it despite instructions
      improvedAnswer = improvedAnswer.replace(/^ImprovedAnswer:\s*/i, '').trim();

      if (!improvedAnswer) {
        // This might happen if the AI only returned the prefix and nothing else.
        throw new Error('AI returned an empty improved answer after stripping prefix.');
      }

      // Update editor and state
      qaEditor.commands.setContent(preparseAlertBlocks(improvedAnswer), true, { preserveWhitespace: 'full' });
      // The editor's onUpdate callback should ideally handle updating currentQAItem.answer_text.
      // For more immediate state consistency for the preview, update it here too.
      setCurrentQAItem(prev => ({ ...prev!, answer_text: improvedAnswer }));


      setShowAiQAImproveModal(false);
      setAiQAImprovementPrompt('');

    } catch (error: any) {
      console.error('Failed to improve AI QA:', error);
      setErrorQA(`שגיאה בשיפור תשובה עם AI: ${error.message}`); // Set error in the main QA modal
    } finally {
      setIsGeneratingAiQA(false); // Reuse loading state
    }
  };


  // New useEffect for authorization
  useEffect(() => {
    if (loadingInitial) {
      setIsAuthorized(null);
      return;
    }

    if (!user || !session) {
      setIsAuthorized(false);
      return;
    }

    const checkAdminStatus = async () => {
      if (!user?.email) {
        setIsAuthorized(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('admin')
          .select('id, gmail, expires_at') // Ensure 'email' is the correct column name
          .eq('gmail', user.email) // Query by the user's email
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
          console.error('Error fetching admin status:', error);
          setIsAuthorized(false); // Deny access on unexpected error
          return;
        }

        if (data) {
          if (data.expires_at) {
            const expiryDate = new Date(data.expires_at);
            if (expiryDate > new Date()) {
              setIsAuthorized(true); // Temporary admin, still valid
            } else {
              // Temporary admin, expired
              // Check if email is in authorizedEmails as a fallback
              if (authorizedEmails.includes(user.email!)) {
                setIsAuthorized(true);
              } else {
                setIsAuthorized(false);
              }
            }
          } else {
            setIsAuthorized(true); // Permanent admin (no expiry date)
          }
        } else {
          // No admin record found for this email
          // Check if email is in authorizedEmails as a fallback
          if (authorizedEmails.includes(user.email!)) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        }
      } catch (err) {
        console.error('Exception fetching admin status:', err);
        setIsAuthorized(false);
      }
    };

    checkAdminStatus();
  }, [user, session, loadingInitial, supabase]); // Added supabase to dependencies, removed navigate, authLogout, authorizedEmails

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
Category: [Generated Category in Hebrew]
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
      let generatedCategory = ''; // Added for category

      const titleMatch = generatedText.match(/^Title:\s*(.*)/im);
      if (titleMatch) generatedTitle = titleMatch[1].trim();

      const slugMatch = generatedText.match(/^Slug:\s*(.*)/im);
      if (slugMatch) generatedSlug = slugMatch[1].trim();

      // Non-greedy match for preview, stopping before Body:, Slug:, Title:, Category: or end of string
      const previewMatch = generatedText.match(/^Preview:\s*([\s\S]*?)(?=^Body:|^Slug:|^Title:|^Category:|$)/im);
      if (previewMatch) generatedPreview = previewMatch[1].trim();

      const categoryMatch = generatedText.match(/^Category:\s*(.*)/im);
      if (categoryMatch && categoryMatch[1]) generatedCategory = categoryMatch[1].trim();

      const bodyMatch = generatedText.match(/^Body:\s*([\s\S]*)/im);
      if (bodyMatch) generatedBody = bodyMatch[1].trim();

      // Fallbacks and error handling
      // Adjusted condition to include generatedCategory
      if (!generatedTitle && !generatedSlug && !generatedPreview && !generatedCategory && !generatedBody && generatedText.length > 0) {
        // If no markers found, and there's text, assume it's all body. Title will be derived.
        generatedBody = generatedText;
        console.warn("AI response did not follow the expected Title/Slug/Preview/Category/Body structure. Assigning full response to body.");
      } else {
        // Handle cases where some fields might be missing or body marker was not found correctly
        // Adjusted condition to include generatedCategory
        if (!generatedBody && (generatedTitle || generatedSlug || generatedPreview || generatedCategory)) {
            let remainingText = generatedText;
            if (titleMatch) remainingText = remainingText.substring(remainingText.indexOf(titleMatch[0]) + titleMatch[0].length);
            if (slugMatch) remainingText = remainingText.substring(remainingText.indexOf(slugMatch[0]) + slugMatch[0].length);
            if (previewMatch) remainingText = remainingText.substring(remainingText.indexOf(previewMatch[0]) + previewMatch[0].length);
            if (categoryMatch) remainingText = remainingText.substring(remainingText.indexOf(categoryMatch[0]) + categoryMatch[0].length);
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
              fullContent: generatedBody,
              category: generatedCategory, // Use generated category
          }));
      } else {
           setCurrentArticle({
              id: '', // New article
              title: generatedTitle,
              artag: generatedSlug,
              excerpt: generatedPreview,
              fullContent: generatedBody,
              category: generatedCategory, // Use generated category
              imageUrl: '', // Default imageUrl
          });
      }

      // The editor content will be updated by the useEffect listening to currentArticle.fullContent
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
        setCurrentArticle(prev => ({ ...prev!, fullContent: improvedBody }));
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

  const fetchAdmins = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingAdmins(true);
    setErrorAdmins(null);
    try {
      const { data, error } = await supabase.from('admin').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAdminsList(data || []);
    } catch (err: any) {
      setErrorAdmins(`שגיאה בטעינת רשימת המנהלים: ${err.message}`);
    } finally {
      setIsLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized && supabase) {
      fetchArticles();
      fetchQAItems();
      fetchAdmins(); // Call fetchAdmins here
    }
  }, [isAuthorized, fetchArticles, fetchQAItems, fetchAdmins]); // Add fetchAdmins to dependency array

  const fetchBlockedItems = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingBlockedItems(true);
    setErrorBlockedItems(null);
    try {
      const { data, error } = await supabase
        .from('blocked_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBlockedItems(data || []);
    } catch (err: any) {
      setErrorBlockedItems(`שגיאה בטעינת פריטים חסומים: ${err.message}`);
    } finally {
      setIsLoadingBlockedItems(false);
    }
  }, [supabase]);

  const fetchUserActivityIPs = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingUserActivity(true);
    setErrorUserActivity(null);
    try {
      // Fetching all IPs and then making them unique client-side
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('ip_address')
        .neq('ip_address', null) // Ensure ip_address is not null
        .eq('is_admin_activity', false); // Exclude admin activity

      if (error) throw error;

      const uniqueIPs = Array.from(new Set(data?.map(item => item.ip_address).filter(ip => ip))); // Filter out null/undefined again just in case
      setUserActivityIPs(uniqueIPs);
    } catch (err: any) {
      setErrorUserActivity(`שגיאה בטעינת כתובות IP של משתמשים: ${err.message}`);
    } finally {
      setIsLoadingUserActivity(false);
    }
  }, [supabase]);

  const fetchUserActivityEmails = useCallback(async () => {
    if (!supabase) return;
    setIsLoadingUserActivity(true); // Use the same loading state for both IPs and Emails activity
    setErrorUserActivity(null); // Use the same error state
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('email')
        .neq('email', null) // Ensure email is not null
        .eq('is_admin_activity', false); // Exclude admin activity

      if (error) throw error;

      const uniqueEmails = Array.from(new Set(data?.map(item => item.email).filter(email => email)));
      setUserActivityEmails(uniqueEmails);
    } catch (err: any) {
      setErrorUserActivity(`שגיאה בטעינת כתובות אימייל של משתמשים: ${err.message}`);
    } finally {
      setIsLoadingUserActivity(false);
    }
  }, [supabase]);

  // Update main useEffect to include new fetch functions
  useEffect(() => {
    if (isAuthorized && supabase) {
      fetchArticles();
      fetchQAItems();
      fetchAdmins();
      fetchBlockedItems();
      fetchUserActivityIPs();
      fetchUserActivityEmails();
    }
  }, [isAuthorized, supabase, fetchArticles, fetchQAItems, fetchAdmins, fetchBlockedItems, fetchUserActivityIPs, fetchUserActivityEmails]);

  const handleAddBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockValue.trim()) {
      setErrorBlockedItems('ערך לחסימה (IP/Email) לא יכול להיות ריק.');
      return;
    }
    setIsSubmittingBlock(true);
    setErrorBlockedItems(null);
    try {
      const blockData = {
        type: newBlockType,
        value: newBlockValue.trim(),
        reason: newBlockReason.trim() || null,
        admin_id: user?.id, // Optional: Log which admin blocked it
      };
      const { error } = await supabase.from('blocked_items').insert([blockData]);
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
            setErrorBlockedItems(`פריט זה (${newBlockValue}) כבר חסום.`);
        } else {
            throw error;
        }
      } else {
        alert(`'${newBlockValue}' נחסם בהצלחה.`);
        setNewBlockValue('');
        setNewBlockReason('');
        // setNewBlockType('IP'); // Optionally reset type, or keep user's last selection
        fetchBlockedItems(); // Refresh the list
      }
    } catch (err: any) {
      setErrorBlockedItems(`שגיאה בחסימת הפריט: ${err.message}`);
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleUnblockItem = async (itemId: string, itemValue: string) => {
    if (!window.confirm(`האם אתה בטוח שברצונך לבטל חסימה עבור '${itemValue}'?`)) return;
    setIsLoadingBlockedItems(true); // Indicate loading for list modification
    setErrorBlockedItems(null);
    try {
      const { error } = await supabase.from('blocked_items').delete().eq('id', itemId);
      if (error) throw error;
      alert(`החסימה עבור '${itemValue}' בוטלה בהצלחה.`);
      fetchBlockedItems(); // Refresh the list
    } catch (err: any) {
      setErrorBlockedItems(`שגיאה בביטול החסימה: ${err.message}`);
    } finally {
      // setIsLoadingBlockedItems(false); // fetchBlockedItems will set this
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminEmail: string) => {
    if (user?.email === adminEmail) {
      alert("אינך יכול להסיר את עצמך.");
      return;
    }
    if (!window.confirm(`האם אתה בטוח שברצונך להסיר את המנהל עם האימייל ${adminEmail}? פעולה זו אינה ניתנת לשחזור.`)) return;

    setIsLoadingAdmins(true); // Use general loading state for list modification
    setErrorAdmins(null);

    try {
      const { error } = await supabase.from('admin').delete().eq('id', adminId);
      if (error) throw error;
      alert('מנהל הוסר בהצלחה!');
      fetchAdmins(); // Refresh the admin list
    } catch (err: any) {
      setErrorAdmins(`שגיאה בהסרת מנהל: ${err.message}`);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.includes('@')) {
      setErrorAdmins('כתובת אימייל לא תקינה.');
      return;
    }
    setIsSubmittingAdmin(true);
    setErrorAdmins(null);

    const adminData: { gmail: string; expires_at?: string } = { gmail: newAdminEmail };

    if (newAdminExpiresAt.trim()) {
      const expiryDate = new Date(newAdminExpiresAt.trim());
      if (isNaN(expiryDate.getTime())) {
        setErrorAdmins('תאריך תפוגה אינו תקין. אנא השתמש בפורמט YYYY-MM-DD HH:MM:SS או השאר ריק.');
        setIsSubmittingAdmin(false);
        return;
      }
      adminData.expires_at = expiryDate.toISOString();
    }

    try {
      const { error } = await supabase.from('admin').insert([adminData]);
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setErrorAdmins('מנהל עם כתובת אימייל זו כבר קיים.');
        } else {
          throw error;
        }
      } else {
        alert('מנהל נוסף בהצלחה!');
        setShowAdminModal(false);
        setNewAdminEmail('');
        setNewAdminExpiresAt('');
        fetchAdmins(); // Refresh the admin list
      }
    } catch (err: any) {
      setErrorAdmins(`שגיאה בהוספת מנהל: ${err.message}`);
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleOpenArticleModal = (article: Article | null = null) => {
    if (article) {
      const normalizedArticle: Article = {
        ...article,
        fullContent: (article as any).full_content ?? article.fullContent ?? '',
      };
      setCurrentArticle(normalizedArticle);
      setHasUnsavedArticleChanges(false);
    } else {
      const draft = localStorage.getItem('draftArticle');
      if (draft) {
        try {
          const parsed = JSON.parse(draft) as Article;
          setCurrentArticle(parsed);
        } catch {
          setCurrentArticle({ id: '', title: '', fullContent: '', category: '', artag: '', imageUrl: '', excerpt: '' });
        }
      } else {
        setCurrentArticle({ id: '', title: '', fullContent: '', category: '', artag: '', imageUrl: '', excerpt: '' });
      }
      setHasUnsavedArticleChanges(!!draft);
    }
    setShowArticleModal(true);
  };
  const handleCloseArticleModal = () => {
    if (hasUnsavedArticleChanges && !window.confirm('Discard unsaved changes?')) {
      return;
    }
    setShowArticleModal(false);
    setCurrentArticle(null);
    setErrorArticles(null);
    localStorage.removeItem('draftArticle');
    setHasUnsavedArticleChanges(false);
  };
  const handleArticleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (currentArticle) {
      setCurrentArticle({ ...currentArticle, [e.target.name]: e.target.value });
      setHasUnsavedArticleChanges(true);
    }
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArticle || !supabase) return;
    setIsSubmittingArticle(true); setErrorArticles(null);
    const articleData = {
      title: currentArticle.title,
      fullContent: currentArticle.fullContent,
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
      localStorage.removeItem('draftArticle');
      setHasUnsavedArticleChanges(false);
      handleCloseArticleModal();
      fetchArticles();
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
    setCurrentQAItem(null); // This will also clear the preview via useEffect by an external trigger
    setQaPreviewHtml('<p class="text-slate-500 dark:text-slate-400">Preview will appear here once you start writing...</p>'); // Explicitly clear
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
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 clamp-2">{(article.fullContent || '').substring(0,120) + ((article.fullContent || '').length > 120 ? '...' : '')}</p>
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

        {/* Admin Management Section */}
        <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg mt-6 sm:mt-8">
          <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-500">ניהול מנהלים</h2>
            {user?.email && authorizedEmails.includes(user.email) && (
              <button 
                onClick={() => setShowAdminModal(true)}
                className="px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center shadow-md text-sm font-medium transition-colors"
              >
                <PlusCircle size={18} className="ml-2" /> הוסף מנהל
              </button>
            )}
          </div>
          {isLoadingAdmins && (
            <div className="flex flex-col items-center justify-center p-6 text-slate-600 dark:text-slate-400">
              <Loader2 className="h-10 w-10 animate-spin text-primary dark:text-sky-400" />
              <p className="mt-3 text-sm">טוען רשימת מנהלים...</p>
            </div>
          )}
          {errorAdmins && <div className="p-3 my-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorAdmins}</div>}
          {!isLoadingAdmins && !errorAdmins && adminsList.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400 text-center py-6 text-sm">לא נמצאו מנהלים.</p>
          )}
          {!isLoadingAdmins && !errorAdmins && adminsList.length > 0 && (
            <div className="space-y-3">
              {adminsList.map(admin => (
                <div key={admin.id} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-slate-50 dark:bg-slate-700/40 flex justify-between items-center">
                  <div>
                    <p className="text-md font-semibold text-slate-800 dark:text-slate-100">{admin.gmail}</p>
                    {admin.expires_at && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        תוקף: {new Date(admin.expires_at).toLocaleDateString('he-IL')} {new Date(admin.expires_at).toLocaleTimeString('he-IL')}
                      </p>
                    )}
                  </div>
                  {user?.email && authorizedEmails.includes(user.email) && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.id, admin.gmail)}
                      className="px-3 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-red-500 hover:bg-red-600 text-white"
                      disabled={isSubmittingAdmin || isLoadingAdmins || (user?.email === admin.gmail)} // Prevent self-removal and disable during other operations
                    >
                      <Trash2 size={14} className="ml-1.5" />
                      הסר מנהל
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* User Blocking Management Section */}
        <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg mt-6 sm:mt-8">
          <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-500">ניהול חסימות משתמשים</h2>
          </div>

          {/* Manual Blocking Form */}
          <form onSubmit={handleAddBlockSubmit} className="mb-8 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/30">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-3">הוסף חסימה ידנית</h3>
            {errorBlockedItems && <div className="p-3 mb-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorBlockedItems}</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <label htmlFor="newBlockValue" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ערך לחסימה (IP/Email)</label>
                <input
                  type="text"
                  id="newBlockValue"
                  value={newBlockValue}
                  onChange={(e) => setNewBlockValue(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm"
                  placeholder="הכנס כתובת IP או אימייל"
                  required
                />
              </div>
              <div>
                <label htmlFor="newBlockType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">סוג חסימה</label>
                <select
                  id="newBlockType"
                  value={newBlockType}
                  onChange={(e) => setNewBlockType(e.target.value as 'IP' | 'EMAIL')}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm"
                >
                  <option value="IP">IP</option>
                  <option value="EMAIL">EMAIL</option>
                </select>
              </div>
              <div>
                <label htmlFor="newBlockReason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">סיבה (אופציונלי)</label>
                <input
                  type="text"
                  id="newBlockReason"
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm"
                  placeholder="סיבת החסימה"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center shadow-md text-sm font-medium transition-colors disabled:opacity-60"
              disabled={isSubmittingBlock || !newBlockValue.trim()}
            >
              {isSubmittingBlock ? <Loader2 size={18} className="animate-spin ml-2" /> : <PlusCircle size={18} className="ml-2" />}
              {isSubmittingBlock ? 'חוסם...' : 'הוסף חסימה'}
            </button>
          </form>

          {/* Currently Blocked Items List */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-3">פריטים חסומים כרגע</h3>
            {isLoadingBlockedItems && (
              <div className="flex flex-col items-center justify-center p-5 text-slate-600 dark:text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-sky-400" />
                <p className="mt-2 text-xs">טוען פריטים חסומים...</p>
              </div>
            )}
            {!isLoadingBlockedItems && errorBlockedItems && <div className="p-3 my-2 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorBlockedItems}</div>}
            {!isLoadingBlockedItems && !errorBlockedItems && blockedItems.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-center py-5 text-sm">לא נמצאו פריטים חסומים.</p>
            )}
            {!isLoadingBlockedItems && !errorBlockedItems && blockedItems.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {blockedItems.map(item => (
                  <div key={item.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-slate-50 dark:bg-slate-700/40 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{item.value} <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-100">{item.type}</span></p>
                      {item.reason && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">סיבה: {item.reason}</p>}
                      <p className="text-xs text-slate-400 dark:text-slate-500">נחסם בתאריך: {new Date(item.created_at).toLocaleString('he-IL')}</p>
                    </div>
                    <button
                      onClick={() => handleUnblockItem(item.id, item.value)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-md flex items-center transition-colors bg-green-500 hover:bg-green-600 text-white"
                      disabled={isLoadingBlockedItems} // Disable while any list modification is happening
                    >
                      <Trash2 size={14} className="ml-1" />בטל חסימה
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Activity Section */}
          <div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-4">פעילות משתמשים אחרונה (לא מנהלים)</h3>
            {isLoadingUserActivity && (
              <div className="flex flex-col items-center justify-center p-5 text-slate-600 dark:text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-sky-400" />
                <p className="mt-2 text-xs">טוען פעילות משתמשים...</p>
              </div>
            )}
            {errorUserActivity && <div className="p-3 my-2 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorUserActivity}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Activity IPs List */}
              <div>
                <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">כתובות IP ייחודיות:</h4>
                {!isLoadingUserActivity && !errorUserActivity && userActivityIPs.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs py-3">לא נמצאו כתובות IP בפעילות המשתמשים.</p>
                )}
                {!isLoadingUserActivity && userActivityIPs.length > 0 && (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 text-sm">
                    {userActivityIPs.map(ip => {
                      const isBlocked = blockedItems.some(b => b.type === 'IP' && b.value === ip);
                      return (
                        <div key={ip} className={`p-2 border rounded-md flex justify-between items-center text-xs ${isBlocked ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600'}`}>
                          <span className={isBlocked ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}>{ip}</span>
                          {isBlocked ? (
                            <span className="px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-300 flex items-center"><Ban size={12} className="ml-1" /> חסום</span>
                          ) : (
                            <button
                              onClick={() => { setNewBlockValue(ip); setNewBlockType('IP'); setNewBlockReason('חסימה מתוך רשימת פעילות'); handleAddBlockSubmit(new Event('submit') as any); }}
                              className="px-2 py-1 text-xs font-medium rounded-md flex items-center transition-colors bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                              disabled={isSubmittingBlock}
                            >
                              <Ban size={12} className="ml-1" /> חסום IP
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* User Activity Emails List */}
              <div>
                <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">כתובות אימייל ייחודיות:</h4>
                {!isLoadingUserActivity && !errorUserActivity && userActivityEmails.length === 0 && (
                   <p className="text-slate-500 dark:text-slate-400 text-xs py-3">לא נמצאו כתובות אימייל בפעילות המשתמשים.</p>
                )}
                {!isLoadingUserActivity && userActivityEmails.length > 0 && (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 text-sm">
                    {userActivityEmails.map(email => {
                      const isBlocked = blockedItems.some(b => b.type === 'EMAIL' && b.value === email);
                      return (
                        <div key={email} className={`p-2 border rounded-md flex justify-between items-center text-xs ${isBlocked ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600'}`}>
                           <span className={isBlocked ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}>{email}</span>
                          {isBlocked ? (
                            <span className="px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-300 flex items-center"><Ban size={12} className="ml-1" /> חסום</span>
                          ) : (
                            <button
                              onClick={() => { setNewBlockValue(email); setNewBlockType('EMAIL'); setNewBlockReason('חסימה מתוך רשימת פעילות'); handleAddBlockSubmit(new Event('submit') as any); }}
                              className="px-2 py-1 text-xs font-medium rounded-md flex items-center transition-colors bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                              disabled={isSubmittingBlock}
                            >
                              <Ban size={12} className="ml-1" /> חסום אימייל
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {showArticleModal && currentArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[100] p-4" dir="rtl">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-400">{currentArticle.id ? 'עריכת מאמר' : 'הוספת מאמר חדש'}</h3>
                <button onClick={handleCloseArticleModal} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"><XCircle size={26} /></button>
              </div>
              <form onSubmit={handleArticleSubmit} className="flex flex-col flex-grow overflow-y-hidden">
                {errorArticles && <div className="p-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 mb-4">{errorArticles}</div>}

                <div className="flex flex-1 gap-6 overflow-y-auto mb-4"> {/* Two-pane container */}
                  {/* Left Pane: Editor and Fields */}
                  <div className="w-1/2 flex flex-col space-y-5 overflow-y-auto p-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">כותרת</label>
                      <input type="text" name="title" id="title" value={currentArticle.title} onChange={handleArticleFormChange} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" required />
                    </div>

                    <div className="my-4"> {/* Adjusted margin for AI buttons */}
                      <div className="flex flex-col sm:flex-row sm:gap-2 space-y-2 sm:space-y-0"> {/* Use gap for consistency */}
                        <button
                          type="button"
                          onClick={() => setShowAiPromptModal(true)}
                          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-purple-400"
                          disabled={isGeneratingAiArticle || isSubmittingArticle}
                        >
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          הפק מאמר בעזרת AI
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAiImproveModal(true)}
                          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-400"
                          disabled={isGeneratingAiArticle || isSubmittingArticle || !currentArticle?.fullContent?.trim()}
                        >
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          שפר מאמר עם AI
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col flex-grow"> {/* Make this div a flex container to allow EditorContent to grow */}
                      <label htmlFor="body" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">תוכן מלא</label>
                      <div className="border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm flex flex-col flex-grow"> {/* Also make this a flex-col and allow to grow */}
                        {editor && <EditorToolbar editor={editor} />}
                        {editor && <EditorContent editor={editor} className="w-full p-3 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white text-sm sm:text-base min-h-[400px] flex-grow overflow-y-auto" />} {/* Apply flex-grow here */}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto"> {/* Add mt-auto to push subsequent elements to bottom if editor grows */}
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
                  </div>

                  {/* Right Pane: Preview */}
                  <div className="w-1/2 overflow-y-auto p-4 border-r border-slate-300 dark:border-slate-600"> {/* Adjusted padding and border */}
                    <div
                      className="prose prose-lg dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex justify-end gap-x-3 pt-5 mt-auto border-t border-slate-300 dark:border-slate-700"> {/* Increased pt */}
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
              <form onSubmit={handleQASubmit} className="flex flex-col flex-grow overflow-y-hidden">
                {errorQA && <div className="p-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 mb-4">{errorQA}</div>}

                <div className="flex flex-1 gap-x-6 overflow-y-auto mb-4 pr-1 sm:pr-2"> {/* Two-pane container */}
                  {/* Left Pane: Editor Fields */}
                  <div className="w-1/2 flex flex-col space-y-5">
                    <div>
                      <label htmlFor="question_text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">שאלה</label>
                      <textarea name="question_text" id="question_text" value={currentQAItem.question_text} onChange={handleQAQuestionChange} rows={4} className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base" required />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Use current question as default topic if available
                        setAiQATopic(currentQAItem.question_text || '');
                        setShowAiQAPromptModal(true);
                      }}
                      className="w-full sm:w-auto mt-1 px-3 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center justify-center transition-colors shadow hover:shadow-md focus:ring-2 focus:ring-purple-400 disabled:opacity-60"
                      disabled={isGeneratingAiQA || isSubmittingQA}
                    >
                      <SparklesIcon className="h-3.5 w-3.5 mr-1.5" />
                      הפק תשובה עם AI
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!qaEditor?.getHTML() || qaEditor.isEmpty || !currentQAItem?.answer_text?.trim()) {
                           setErrorQA("התשובה הנוכחית ריקה. אנא כתוב תוכן או הפק תשובה לפני שתנסה לשפר אותה.");
                           return;
                        }
                        setAiQAImprovementPrompt(''); // Clear previous improvement prompt
                        setShowAiQAImproveModal(true);
                      }}
                      className="w-full sm:w-auto mt-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center transition-colors shadow hover:shadow-md focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                      disabled={isGeneratingAiQA || isSubmittingQA || !currentQAItem?.answer_text?.trim()}
                    >
                      <SparklesIcon className="h-3.5 w-3.5 mr-1.5" />
                      שפר תשובה עם AI
                    </button>
                    <div className="flex flex-col flex-grow mt-3"> {/* Added mt-3 for spacing */}
                      <label htmlFor="answer_text_editor" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">תשובה</label>
                      <div className="border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm flex flex-col flex-grow">
                        {qaEditor && <EditorToolbar editor={qaEditor} />}
                        {qaEditor && <EditorContent editor={qaEditor} id="answer_text_editor" className="w-full p-3 focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white text-sm sm:text-base min-h-[250px] flex-grow overflow-y-auto" />}
                      </div>
                    </div>
                  </div>

                  {/* Right Pane: QA Preview */}
                  <div className="w-1/2 overflow-y-auto p-4 border-r border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                    <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 sticky top-0 bg-slate-50 dark:bg-slate-800/30 py-2 z-10">תצוגה מקדימה (תשובה):</h4>
                    <div
                      className="prose prose-sm sm:prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: qaPreviewHtml }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-x-3 pt-5 mt-auto border-t border-slate-300 dark:border-slate-700">
                  <button type="button" onClick={handleCloseQAModal} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors" disabled={isSubmittingQA}>ביטול</button>
                  <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg flex items-center disabled:opacity-70 transition-colors" disabled={isSubmittingQA || !currentQAItem.question_text.trim()}>
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

      {/* Add Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[100] p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-700 pb-4 mb-6">
              <h3 className="text-xl sm:text-2xl font-semibold text-primary dark:text-sky-400">הוספת מנהל חדש</h3>
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setNewAdminEmail('');
                  setNewAdminExpiresAt('');
                  setErrorAdmins(null); // Clear previous errors specific to admin operations
                }}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
                disabled={isSubmittingAdmin}
              >
                <XCircle size={26} />
              </button>
            </div>
            <form onSubmit={handleAddAdminSubmit} className="overflow-y-auto space-y-5 pr-1 sm:pr-2 flex-grow">
              {errorAdmins && <div className="p-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorAdmins}</div>}
              
              <div>
                <label htmlFor="newAdminEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">כתובת אימייל</label>
                <input
                  type="email"
                  name="newAdminEmail"
                  id="newAdminEmail"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base"
                  required
                  disabled={isSubmittingAdmin}
                />
              </div>
              
              <div>
                <label htmlFor="newAdminExpiresAt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">תאריך תפוגה (אופציונלי)</label>
                <input
                  type="text" // Using text for simplicity, could be date/datetime-local
                  name="newAdminExpiresAt"
                  id="newAdminExpiresAt"
                  value={newAdminExpiresAt}
                  onChange={(e) => setNewAdminExpiresAt(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base"
                  placeholder="YYYY-MM-DD HH:MM:SS (לדוגמה: 2024-12-31 23:59:59)"
                  disabled={isSubmittingAdmin}
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  השאר ריק למנהל קבוע. אם תזין תאריך, המנהל יפוג בתאריך זה.
                </p>
              </div>
              
              <div className="flex justify-end gap-x-3 pt-5 mt-auto border-t border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setNewAdminEmail('');
                    setNewAdminExpiresAt('');
                    setErrorAdmins(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  disabled={isSubmittingAdmin}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg flex items-center disabled:opacity-70 transition-colors"
                  disabled={isSubmittingAdmin || !newAdminEmail.trim()}
                >
                  {isSubmittingAdmin && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isSubmittingAdmin ? 'מוסיף...' : 'הוסף מנהל'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* AI QA Prompt Modal */}
      {showAiQAPromptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[110] p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg sm:text-xl font-semibold text-primary dark:text-sky-400">הפק תשובה עם AI</h3>
                <button
                    onClick={() => { if (!isGeneratingAiQA) {setShowAiQAPromptModal(false); setAiQATopic(''); setErrorQA(null);} }}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
                    disabled={isGeneratingAiQA}
                >
                    <XCircle size={24} />
                </button>
            </div>
            {errorQA && <div className="p-3 mb-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorQA}</div>}
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              הזן נושא כללי או שאלה ספציפית. ה-AI ינסח תשובה בפורמט Markdown.
              אם תזין רק נושא, ה-AI ינסה לנסח גם שאלה מתאימה.
            </p>
            <textarea
              value={aiQATopic}
              onChange={(e) => setAiQATopic(e.target.value)}
              rows={4}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base mb-5"
              placeholder="לדוגמה: 'מהם היתרונות של X?', או פשוט 'יתרונות X' וה-AI ינסח שאלה."
              disabled={isGeneratingAiQA}
            />
            {isGeneratingAiQA && (
              <div className="flex items-center justify-center p-3 my-4 text-sm rounded-lg border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-primary dark:text-sky-400 mr-3" />
                מייצר תשובה, נא להמתין...
              </div>
            )}
            <div className="flex justify-end gap-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setShowAiQAPromptModal(false); setAiQATopic(''); setErrorQA(null);}}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                disabled={isGeneratingAiQA}
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleAiQAGenerate}
                className="px-5 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg flex items-center disabled:opacity-70 transition-colors"
                disabled={!aiQATopic.trim() || isGeneratingAiQA}
              >
                {isGeneratingAiQA ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SparklesIcon className="h-4 w-4 mr-2" />}
                {isGeneratingAiQA ? 'מייצר...' : 'הפק תשובה'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI QA Improvement Modal */}
      {showAiQAImproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-[110] p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-7 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg sm:text-xl font-semibold text-primary dark:text-sky-400">שפר תשובה עם AI</h3>
                <button
                    onClick={() => { if (!isGeneratingAiQA) {setShowAiQAImproveModal(false); setAiQAImprovementPrompt(''); setErrorQA(null);} }}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
                    disabled={isGeneratingAiQA}
                >
                    <XCircle size={24} />
                </button>
            </div>
            {errorQA && <div className="p-3 mb-3 text-sm rounded-lg border bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">{errorQA}</div>}
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              הסבר ל-AI כיצד תרצה לשפר את התשובה הנוכחית. לדוגמה: 'הפוך את הטקסט ליותר רשמי', 'הוסף דוגמאות', 'קצר את התשובה'.
            </p>
            <textarea
              value={aiQAImprovementPrompt}
              onChange={(e) => setAiQAImprovementPrompt(e.target.value)}
              rows={4}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white shadow-sm text-sm sm:text-base mb-5"
              placeholder="לדוגמה: 'הפוך את התשובה ליותר ידידותית למתחילים', 'פרט יותר על נקודה X'"
              disabled={isGeneratingAiQA}
            />
            {isGeneratingAiQA && (
              <div className="flex items-center justify-center p-3 my-4 text-sm rounded-lg border bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-primary dark:text-sky-400 mr-3" />
                משפר תשובה, נא להמתין...
              </div>
            )}
            <div className="flex justify-end gap-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => { setShowAiQAImproveModal(false); setAiQAImprovementPrompt(''); setErrorQA(null);}}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
                disabled={isGeneratingAiQA}
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleAiQAImprove}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center disabled:opacity-70 transition-colors focus:ring-2 focus:ring-blue-400"
                disabled={!aiQAImprovementPrompt.trim() || isGeneratingAiQA}
              >
                {isGeneratingAiQA ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SparklesIcon className="h-4 w-4 mr-2" />}
                {isGeneratingAiQA ? 'משפר...' : 'שפר תשובה'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Improve Modal for Articles (existing) */}
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
                onClick={handleAiArticleImprove}
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
