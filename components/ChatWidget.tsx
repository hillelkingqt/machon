import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple chat widget using Gemini API
const GEMINI_API_KEY = 'AIzaSyA4TppVdydykoU7bCPGr-IeyAbhCJZQDBM';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input } as Message;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: userMsg.text }] }] }),
        }
      );
      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text || '❌ אירעה שגיאה';
      setMessages(prev => [...prev, { role: 'ai', text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '❌ אירעה שגיאה' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 text-right" dir="rtl">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-primary text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all"
      >
        צ'אט
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-80 h-96 bg-white dark:bg-secondary-light rounded-lg shadow-lg overflow-hidden flex flex-col mt-2"
          >
            <div className="flex-grow p-2 space-y-2 overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`p-2 rounded-lg whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-primary/20 text-right'
                      : 'bg-gray-100 dark:bg-secondary text-right'
                  }`}
                  dangerouslySetInnerHTML={{ __html: m.text }}
                />
              ))}
              {loading && <div className="p-2 text-sm">מטעין...</div>}
            </div>
            <div className="p-2 border-t border-gray-200 flex gap-2">
              <input
                className="flex-grow border rounded px-2 py-1"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="כתבו הודעה..."
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-primary text-white rounded px-3 py-1 disabled:opacity-50"
              >
                שלח
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;
