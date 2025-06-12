// --- Configuration ---
// WARNING: API Tokens and IDs should be stored as Environment Variables/Secrets in Cloudflare settings for security.
const TELEGRAM_BOT_TOKEN = "7629088499:AAH50PYKJrfQVlvR5EU44O8d32EM4aqF4UI"; // !!! החלף ב-Environment Variable בשם TELEGRAM_BOT_TOKEN !!!
const TELEGRAM_TARGET_CHAT_ID = "7547836101"; // !!! החלף ב-Environment Variable בשם TELEGRAM_TARGET_CHAT_ID !!!

const MAX_TELEGRAM_MESSAGE_LENGTH = 4000;

const ALLOWED_ORIGIN = '*'; // !!! החלף בדומיין שלך בייצור !!!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// --- Event Listener for Incoming Requests ---
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handles incoming requests, routing them based on method.
 */
async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  const url = new URL(request.url);

  if (request.method === 'POST') {
    if (url.pathname === '/login-notify') {
      return await handleLoginNotification(request);
    }
    return await handleContactForm(request);
  }

  return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
}

/**
 * Handles CORS preflight (OPTIONS) requests.
 */
function handleOptions(request) {
  const headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, { headers: CORS_HEADERS });
  } else {
    return new Response(null, {
      headers: {
        ...CORS_HEADERS,
        'Allow': 'POST, OPTIONS',
      },
    });
  }
}

/**
 * Escapes special characters for Telegram's older 'Markdown' parse mode.
 * Characters to escape: *, _, `, [, \
 * @param {string} text - The text to escape.
 * @returns {string} The escaped text.
 */
function escapeMarkdownSimple(text) {
  if (typeof text !== 'string') return '';
  // Escape backslash first, then the other characters
  return text.replace(/\\/g, '\\\\').replace(/([_*`\[])/g, '\\$1');
}

/**
 * Sends a message to the configured Telegram chat using 'Markdown' (legacy).
 */
async function sendTelegramMessage(text, chatId, botToken) {
  if (!botToken || !chatId) {
    const errorMessage = "שגיאת הגדרות שרת: טוקן בוט או מזהה צ'אט של טלגרם חסרים.";
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  let messageToSend = text;

  if (messageToSend.length > MAX_TELEGRAM_MESSAGE_LENGTH) {
    // Basic truncation, consider smarter truncation if needed
    messageToSend = messageToSend.substring(0, MAX_TELEGRAM_MESSAGE_LENGTH - 20) + "... (הודעה נחתכה)";
    console.warn("Telegram message was truncated due to length.");
  }

  try {
    let response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageToSend,
        parse_mode: 'Markdown', // Using legacy Markdown
      }),
    });

    let result = await response.json();

    if (!response.ok || !result.ok) {
      console.error(`Telegram API Error ('Markdown' mode) (${response.status}):`, result.description || 'Unknown error');
      // Fallback: Try sending as plain text if Markdown parsing failed
      if (result.description && result.description.toLowerCase().includes('parse')) {
        console.warn("'Markdown' parsing failed. Attempting to send as plain text.");
        // For plain text, send the original text (before any escaping)
        const plainTextOriginal = text; // Use the 'text' argument before it might have been escaped
        let plainTextToSend = plainTextOriginal;
        if (plainTextToSend.length > MAX_TELEGRAM_MESSAGE_LENGTH) {
            plainTextToSend = plainTextToSend.substring(0, MAX_TELEGRAM_MESSAGE_LENGTH - 20) + "... (הודעה נחתכה)";
        }

        const plainResponse = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: plainTextToSend,
          }),
        });
        const plainResult = await plainResponse.json();
        if (!plainResponse.ok || !plainResult.ok) {
          console.error(`Telegram API Error (Plain Text Fallback) (${plainResponse.status}):`, plainResult.description || 'Unknown error');
          return { success: false, error: `שגיאת API של טלגרם (נסיון חוזר נכשל): ${plainResult.description || 'שגיאה לא ידועה'}` };
        }
        console.log("Message sent as plain text after 'Markdown' failure.");
        return { success: true };
      }
      return { success: false, error: `שגיאת API של טלגרם: ${result.description || 'שגיאה לא ידועה'}` };
    }
    return { success: true };
  } catch (error) {
    console.error("Network error sending message to Telegram:", error);
    return { success: false, error: "שגיאת רשת בעת ניסיון שליחה לטלגרם." };
  }
}

/**
 * Handles the contact form submission.
 */
async function handleContactForm(request) {
  try {
    const formData = await request.json();
    const { name, email, message } = formData;

    if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
      return new Response(JSON.stringify({ success: false, error: "שדות חסרים. יש למלא שם, אימייל והודעה." }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ success: false, error: "כתובת אימייל אינה תקינה." }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const clientIp = request.headers.get('CF-Connecting-IP') || 'לא זוהה';
    const submissionTime = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour12: false });

    // Using simple Markdown, escape only essential characters for name and email.
    // Message content will be in a code block, so it doesn't need escaping for Markdown.
    // IP and time are unlikely to contain problematic characters for simple Markdown display.
    const telegramMessageText = `
*פנייה חדשה מאתר מכון אביב*

*שם מלא:* ${escapeMarkdownSimple(name.trim())}
*אימייל:* ${escapeMarkdownSimple(email.trim())}

*הודעה:*
\`\`\`
${message.trim()}
\`\`\`

---
*פרטים נוספים:*
IP: ${clientIp}
זמן שליחה: ${submissionTime}
    `.trim();

    const botTokenToUse = typeof TELEGRAM_BOT_TOKEN_ENV !== 'undefined' ? TELEGRAM_BOT_TOKEN_ENV : TELEGRAM_BOT_TOKEN;
    const chatIdToUse = typeof TELEGRAM_TARGET_CHAT_ID_ENV !== 'undefined' ? TELEGRAM_TARGET_CHAT_ID_ENV : TELEGRAM_TARGET_CHAT_ID;

    const telegramResult = await sendTelegramMessage(telegramMessageText, chatIdToUse, botTokenToUse);

    if (telegramResult.success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: telegramResult.error || "שליחת ההודעה לטלגרם נכשלה." }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error("Error processing contact form:", error);
    let errorMessage = "אירעה שגיאה פנימית בעיבוד הפנייה.";
    let errorStatus = 500;

    if (error instanceof SyntaxError) {
      errorMessage = "פורמט הנתונים שנשלח אינו תקין (JSON שגוי).";
      errorStatus = 400;
    }
    return new Response(JSON.stringify({ success: false, error: errorMessage, details: error.message }), {
      status: errorStatus,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handles login notification submissions.
 */
async function handleLoginNotification(request) {
  try {
    const { email, name } = await request.json();

    if (!email || !email.trim()) {
      return new Response(JSON.stringify({ success: false, error: "כתובת אימייל חסרה." }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const clientIp = request.headers.get('CF-Connecting-IP') || 'לא זוהה';
    const loginTime = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', hour12: false });

    const telegramMessageText = `
*התחברות חדשה לאתר*
${name ? `*שם:* ${escapeMarkdownSimple(name)}\n` : ''}*אימייל:* ${escapeMarkdownSimple(email)}
IP: ${clientIp}
זמן התחברות: ${loginTime}
    `.trim();

    const botTokenToUse = typeof TELEGRAM_BOT_TOKEN_ENV !== 'undefined' ? TELEGRAM_BOT_TOKEN_ENV : TELEGRAM_BOT_TOKEN;
    const chatIdToUse = typeof TELEGRAM_TARGET_CHAT_ID_ENV !== 'undefined' ? TELEGRAM_TARGET_CHAT_ID_ENV : TELEGRAM_TARGET_CHAT_ID;

    const telegramResult = await sendTelegramMessage(telegramMessageText, chatIdToUse, botTokenToUse);

    if (telegramResult.success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ success: false, error: telegramResult.error || "שליחת ההודעה לטלגרם נכשלה." }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error processing login notification:", error);
    let errorMessage = "אירעה שגיאה פנימית בעיבוד ההתחברות.";
    let errorStatus = 500;

    if (error instanceof SyntaxError) {
      errorMessage = "פורמט הנתונים שנשלח אינו תקין (JSON שגוי).";
      errorStatus = 400;
    }
    return new Response(JSON.stringify({ success: false, error: errorMessage, details: error.message }), {
      status: errorStatus,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}
