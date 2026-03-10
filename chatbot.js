(function() {
    let linksData = { standardLinks: [], adminLinks: [] };
    const role = sessionStorage.getItem('userRole') || 'Staff';
    const fullName = sessionStorage.getItem('fullName') || 'Staff Member';
    const isPowerUser = ['Admin', 'HR', 'HoD'].includes(role);

    // 1. Fetch Links
    fetch('links.json')
        .then(response => response.json())
        .then(data => {
            linksData = data;
        })
        .catch(err => console.error("Chatbot: Error loading links.json", err));

    // 2. Inject UI
    const chatbotHtml = `
        <div id="chatbot-button">💬</div>
        <div id="chatbot-window">
            <div id="chatbot-header">
                <span>Staff Assistant</span>
                <span id="chatbot-close">✖</span>
            </div>
            <div id="chatbot-messages"></div>
            <div id="chatbot-input-container">
                <input type="text" id="chatbot-input" placeholder="How can I help you?">
                <button id="chatbot-send">Send</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHtml);

    const btn = document.getElementById('chatbot-button');
    const windowEl = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const inputEl = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const messagesEl = document.getElementById('chatbot-messages');

    // 3. UI Logic
    btn.onclick = () => {
        const isVisible = windowEl.style.display === 'flex';
        windowEl.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible && messagesEl.children.length === 0) {
            addBotMessage(`Hello ${fullName}! I'm here to help you find things on the portal. What are you looking for today?`);
        }
    };

    closeBtn.onclick = () => {
        windowEl.style.display = 'none';
    };

    sendBtn.onclick = handleUserInput;
    inputEl.onkeypress = (e) => { if (e.key === 'Enter') handleUserInput(); };

    function handleUserInput() {
        const text = inputEl.value.trim();
        if (!text) return;

        addUserMessage(text);
        inputEl.value = '';

        setTimeout(() => {
            const response = generateResponse(text);
            addBotMessage(response);
        }, 500);
    }

    function addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'chat-message user-message';
        div.textContent = text;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addBotMessage(html) {
        const div = document.createElement('div');
        div.className = 'chat-message bot-message';
        div.innerHTML = html;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // 4. Response Logic
    function generateResponse(query) {
        const q = query.toLowerCase();

        // Match against standard links
        let matches = linksData.standardLinks.filter(l =>
            l.name.toLowerCase().includes(q) || q.includes(l.name.toLowerCase())
        );

        // Match against admin links if power user
        if (isPowerUser) {
            const adminMatches = linksData.adminLinks.filter(l =>
                l.name.toLowerCase().includes(q) || q.includes(l.name.toLowerCase())
            );
            matches = matches.concat(adminMatches);
        }

        if (matches.length > 0) {
            let res = "I found these relevant links for you:<br><ul>";
            matches.forEach(m => {
                res += `<li><a href="${m.url}" target="_blank">${m.icon} ${m.name}</a></li>`;
            });
            res += "</ul>";
            return res;
        }

        // Generic keywords
        if (q.includes('help') || q.includes('support')) {
            return "You can reach out to the IT Support Team or check the IT Helpdesk link in the Quick Links section.";
        }

        if (q.includes('password')) {
            return 'You can change your password here: <a href="change-password.html">Change Password</a>';
        }

        if (q.includes('hr') || q.includes('holiday') || q.includes('leave')) {
            return 'You can find HR forms and information in the <a href="hr_app.html">HR Portal</a>.';
        }

        if (q.includes('task') || q.includes('todo')) {
             return 'Your tasks are located here: <a href="todo.html">My Tasks</a>';
        }

        return "I'm sorry, I couldn't find anything specific for that. Try searching for things like 'holiday', 'password', 'IT help', or 'tasks'.";
    }
})();
