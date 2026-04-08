(function () {

  // ─── Config ───────────────────────────────────────────────────────────────
  // Replace this with your Cloudflare Worker URL after you deploy it
  const PROXY_URL = 'https://staff-portal-proxy.ben-obrien20.workers.dev';
  const MODEL     = 'claude-sonnet-4-20250514';

  // ─── Session state ────────────────────────────────────────────────────────
  const role        = sessionStorage.getItem('userRole') || 'Staff';
  const fullName    = sessionStorage.getItem('fullName') || 'Staff Member';
  const isPowerUser = ['Admin', 'HR', 'HoD'].includes(role);

  let conversationHistory = [];
  let linksData = { standardLinks: [], adminLinks: [] };

  fetch('links.json')
    .then(r => r.json())
    .then(d => { linksData = d; })
    .catch(e => console.warn('Chatbot: could not load links.json', e));

  function buildSystemPrompt() {
    const allLinks = [
      ...(linksData.standardLinks || []),
      ...(isPowerUser ? (linksData.adminLinks || []) : []),
    ]
      .map(l => `- ${l.name}: ${l.url}`)
      .join('\n');

    return `You are a friendly, concise staff assistant embedded in an internal staff portal.
The user's name is ${fullName} and their role is ${role}.${isPowerUser ? ' They have power-user access (Admin/HR/HoD).' : ''}

Your job is to help staff with portal tasks. Always be warm, brief, and helpful.
When giving step-by-step instructions, use a numbered list.
When linking to pages, use HTML anchor tags (e.g. <a href="hr_app.html">HR Portal</a>).
Never make up links — only use the ones listed below.

## Key tasks you know how to handle

**Holiday / Leave requests**
1. Go to the <a href="hr_app.html">HR Portal</a>.
2. Click <strong>HR Forms</strong> in the navigation bar.
3. Select <strong>Holiday Request Form</strong> or <strong>Staff Leave Request Form</strong>.
4. Fill out the Google Form and submit it.

**Change password**
1. Go to the <a href="change-password.html">Change Password</a> page.
2. Enter your current password, then your new password.
3. Click <strong>Update Password</strong>.

**Post latest news** (Admin, HR, HoD only)
1. On the <a href="index.html">Main Portal</a>, find the <strong>Latest News</strong> section.
2. Click <strong>Post News</strong>, fill in Title and Content, then publish.

**IT Support**
1. Find <strong>Quick Links</strong> on the <a href="index.html">Main Portal</a>.
2. Click <strong>IT Helpdesk</strong> and complete the Monday.com form.

**Personal tasks / to-do list**
Direct the user to: <a href="todo.html">My Tasks</a>

## Available portal links
${allLinks || '(links not yet loaded)'}

## Rules
- Only help with staff portal topics.
- Keep responses concise — a short paragraph or numbered list.
- Do not invent URLs or features not listed above.
- Respond using inline HTML only (links and bold) — no markdown.`;
  }

  async function callClaude(userMessage) {
    conversationHistory.push({ role: 'user', content: userMessage });

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: buildSystemPrompt(),
        messages: conversationHistory,
      }),
    });

    if (!response.ok) throw new Error(`Proxy error: ${response.status}`);

    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    conversationHistory.push({ role: 'assistant', content: text });
    return text;
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #chatbot-button {
      position:fixed;bottom:24px;right:24px;z-index:9999;
      width:52px;height:52px;border-radius:50%;
      background:#2563eb;color:#fff;font-size:22px;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);
      user-select:none;transition:transform 0.15s;
    }
    #chatbot-button:hover{transform:scale(1.08);}
    #chatbot-window {
      position:fixed;bottom:88px;right:24px;z-index:9999;
      width:360px;max-height:540px;
      display:none;flex-direction:column;
      border-radius:16px;overflow:hidden;
      box-shadow:0 8px 32px rgba(0,0,0,0.18);
      font-family:system-ui,sans-serif;background:#f9fafb;
    }
    #chatbot-header {
      background:#2563eb;color:#fff;padding:13px 16px;
      display:flex;justify-content:space-between;align-items:center;flex-shrink:0;
    }
    #chatbot-header-title{font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;}
    #chatbot-status-dot{width:8px;height:8px;border-radius:50%;background:#4ade80;flex-shrink:0;}
    #chatbot-close{cursor:pointer;font-size:16px;opacity:0.8;padding:2px 4px;}
    #chatbot-close:hover{opacity:1;}
    #chatbot-messages {
      flex:1;overflow-y:auto;padding:14px 12px;
      display:flex;flex-direction:column;gap:10px;background:#f1f5f9;
    }
    .chat-message{max-width:85%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.55;word-break:break-word;}
    .bot-message{background:#fff;color:#1e293b;border:1px solid #e2e8f0;align-self:flex-start;border-bottom-left-radius:4px;}
    .bot-message a{color:#2563eb;}
    .user-message{background:#2563eb;color:#fff;align-self:flex-end;border-bottom-right-radius:4px;}
    #chatbot-typing {
      display:none;align-self:flex-start;background:#fff;border:1px solid #e2e8f0;
      border-radius:14px;border-bottom-left-radius:4px;padding:10px 14px;gap:5px;align-items:center;
    }
    #chatbot-typing span{display:inline-block;width:7px;height:7px;border-radius:50%;background:#94a3b8;animation:cb-blink 1.2s infinite;}
    #chatbot-typing span:nth-child(2){animation-delay:0.2s;}
    #chatbot-typing span:nth-child(3){animation-delay:0.4s;}
    @keyframes cb-blink{0%,80%,100%{opacity:0.25}40%{opacity:1}}
    #chatbot-chips{padding:8px 12px;display:flex;flex-wrap:wrap;gap:6px;background:#f9fafb;border-top:1px solid #e2e8f0;flex-shrink:0;}
    .cb-chip{font-size:12px;padding:4px 11px;border-radius:20px;border:1px solid #cbd5e1;background:#fff;color:#475569;cursor:pointer;white-space:nowrap;transition:background 0.1s;}
    .cb-chip:hover{background:#eff6ff;border-color:#93c5fd;color:#2563eb;}
    #chatbot-input-container{display:flex;background:#fff;border-top:1px solid #e2e8f0;flex-shrink:0;}
    #chatbot-input{flex:1;border:none;outline:none;padding:11px 14px;font-size:13.5px;color:#1e293b;background:transparent;}
    #chatbot-send{border:none;background:#2563eb;color:#fff;padding:0 18px;cursor:pointer;font-size:13px;font-weight:600;transition:background 0.15s;}
    #chatbot-send:hover{background:#1d4ed8;}
    #chatbot-send:disabled{background:#93c5fd;cursor:default;}
  `;
  document.head.appendChild(style);

  // ─── HTML ─────────────────────────────────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <div id="chatbot-button">💬</div>
    <div id="chatbot-window">
      <div id="chatbot-header">
        <div id="chatbot-header-title">
          <div id="chatbot-status-dot"></div>Staff Assistant
        </div>
        <span id="chatbot-close">✕</span>
      </div>
      <div id="chatbot-messages">
        <div id="chatbot-typing"><span></span><span></span><span></span></div>
      </div>
      <div id="chatbot-chips">
        <div class="cb-chip" data-msg="How do I request a holiday?">Book holiday</div>
        <div class="cb-chip" data-msg="How do I get IT support?">IT support</div>
        <div class="cb-chip" data-msg="How do I change my password?">Change password</div>
        <div class="cb-chip" data-msg="Where can I see my payslip?">Payslip</div>
      </div>
      <div id="chatbot-input-container">
        <input type="text" id="chatbot-input" placeholder="Ask me anything…" autocomplete="off" />
        <button id="chatbot-send">Send</button>
      </div>
    </div>
  `);

  // ─── Events ───────────────────────────────────────────────────────────────
  const btnEl    = document.getElementById('chatbot-button');
  const windowEl = document.getElementById('chatbot-window');
  const closeEl  = document.getElementById('chatbot-close');
  const inputEl  = document.getElementById('chatbot-input');
  const sendEl   = document.getElementById('chatbot-send');
  const msgsEl   = document.getElementById('chatbot-messages');
  const typingEl = document.getElementById('chatbot-typing');
  const chipsEl  = document.getElementById('chatbot-chips');

  btnEl.onclick = () => {
    const open = windowEl.style.display === 'flex';
    windowEl.style.display = open ? 'none' : 'flex';
    if (!open && conversationHistory.length === 0) {
      addBotMessage(`Hi ${fullName}! I'm your AI-powered staff assistant. How can I help you today?`);
    }
    if (!open) inputEl.focus();
  };
  closeEl.onclick = () => { windowEl.style.display = 'none'; };
  chipsEl.addEventListener('click', e => { const c = e.target.closest('.cb-chip'); if (c) sendMessage(c.dataset.msg); });
  sendEl.onclick = () => sendMessage(inputEl.value.trim());
  inputEl.onkeydown = e => { if (e.key === 'Enter') sendMessage(inputEl.value.trim()); };

  async function sendMessage(text) {
    if (!text) return;
    addUserMessage(text);
    inputEl.value = '';
    setLoading(true);
    try {
      addBotMessage(await callClaude(text));
    } catch (err) {
      console.error('Chatbot error:', err);
      addBotMessage("Sorry, I couldn't reach the assistant right now. Please try again shortly, or contact IT support directly.");
    } finally {
      setLoading(false);
    }
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-message user-message';
    div.textContent = text;
    msgsEl.insertBefore(div, typingEl);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function addBotMessage(html) {
    const div = document.createElement('div');
    div.className = 'chat-message bot-message';
    div.innerHTML = html;
    msgsEl.insertBefore(div, typingEl);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function setLoading(on) {
    typingEl.style.display = on ? 'flex' : 'none';
    sendEl.disabled = on;
    inputEl.disabled = on;
    if (on) msgsEl.scrollTop = msgsEl.scrollHeight;
  }

})();
