(function() {
    let linksData = { standardLinks: [], adminLinks: [] };
    const role = sessionStorage.getItem('userRole') || 'Staff';
    const fullName = sessionStorage.getItem('fullName') || 'Staff Member';
    const isPowerUser = ['Admin', 'HR', 'HoD'].includes(role);

    const taskInstructions = {
        holiday: {
            title: "How to request a holiday or leave",
            steps: [
                "Navigate to the <a href='hr_app.html'>HR Portal</a>.",
                "Click on <strong>📋 HR Forms</strong> in the navigation bar.",
                "Select <strong>📅 Holiday Request Form</strong> or <strong>✉️ Staff Leave Request Form</strong>.",
                "Fill out the Google Form and submit it."
            ]
        },
        password: {
            title: "How to change your password",
            steps: [
                "Go to the <a href='change-password.html'>Change Password</a> page.",
                "Enter your current password.",
                "Enter and confirm your new password.",
                "Click <strong>Update Password</strong>."
            ]
        },
        news: {
            title: "How to post latest news",
            steps: [
                "On the <a href='index.html'>Main Portal</a>, locate the <strong>Latest News</strong> section.",
                "Click the <strong>Post News</strong> button (available for Admin, HR, and HoD).",
                "Fill in the Title, Content, and optional Image URL/Link.",
                "Click <strong>Post News</strong> to publish."
            ]
        },
        it: {
            title: "How to get IT Support",
            steps: [
                "Locate the <strong>Quick Links</strong> sidebar on the right of the <a href='index.html'>Main Portal</a>.",
                "Click on <strong>🖥️ IT Helpdesk</strong>.",
                "Complete the Monday.com support form with your issue details."
            ]
        },
        behaviour: {
            title: "How to report pupil behaviour",
            steps: [
                "Locate the <strong>Quick Links</strong> sidebar on the right of the <a href='index.html'>Main Portal</a>.",
                "Click on <strong>⚠️ Pupil Behaviour Report</strong>.",
                "Fill in the Google Form with the details of the incident and submit."
            ]
        },
        timetable: {
            title: "How to view your schedule/timetable",
            steps: [
                "Go to the <a href='department-timetables.html'>My Schedule</a> page.",
                "You can see your personal or department-wide timetables there."
            ]
        }
    };

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
            addBotMessage(`Hello ${fullName}! I'm here to help you find things and guide you through tasks. What can I assist you with today?`);
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
        div.textContent = text; // Safe: treat user input as plain text
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addBotMessage(html) {
        const div = document.createElement('div');
        div.className = 'chat-message bot-message';
        div.innerHTML = html; // Trusted: Bot responses are built from internal taskInstructions or links.json
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function formatInstruction(task) {
        let html = `<strong>${task.title}</strong><ol style="margin-top: 5px; padding-left: 20px;">`;
        task.steps.forEach(step => {
            html += `<li>${step}</li>`;
        });
        html += `</ol>`;
        return html;
    }

    // 4. Response Logic
    function generateResponse(query) {
        const q = query.toLowerCase();

        // Regex patterns for better matching (word boundaries, plurals)
        const reHoliday = /\bholiday(s)?\b|\bleave\b|\babsence\b/i;
        const rePassword = /\bpassword(s)?\b/i;
        const reNews = /\bnews\b|\bpost\b/i;
        const reIT = /\bit\b|\bhelpdesk\b|\bsupport\b/i;
        const reBehaviour = /\bbehaviour\b|\breport\b/i;
        const reTimetable = /\btimetable\b|\bschedule\b/i;

        if (reHoliday.test(q)) return formatInstruction(taskInstructions.holiday);
        if (rePassword.test(q)) return formatInstruction(taskInstructions.password);
        if (reNews.test(q)) return formatInstruction(taskInstructions.news);
        if (reIT.test(q)) return formatInstruction(taskInstructions.it);

        // Specific check for behaviour to avoid matching "report" too broadly if possible
        if (reBehaviour.test(q) && (q.includes('pupil') || q.includes('behaviour') || q.includes('report'))) {
            return formatInstruction(taskInstructions.behaviour);
        }
        if (reTimetable.test(q)) return formatInstruction(taskInstructions.timetable);

        // Match against links from links.json using tokenization for better relevance
        const queryTokens = q.split(/\s+/).filter(t => t.length > 3); // ignore small words

        let matches = linksData.standardLinks.filter(l => {
            const name = l.name.toLowerCase();
            if (q.includes(name)) return true;
            // Check if all tokens of the link name (or at least major ones) are in the query
            const nameTokens = name.split(/\s+/).filter(t => t.length > 3);
            if (nameTokens.length > 0 && nameTokens.every(t => q.includes(t))) return true;
            return false;
        });

        if (isPowerUser) {
            const adminMatches = linksData.adminLinks.filter(l => {
                const name = l.name.toLowerCase();
                if (q.includes(name)) return true;
                const nameTokens = name.split(/\s+/).filter(t => t.length > 3);
                if (nameTokens.length > 0 && nameTokens.every(t => q.includes(t))) return true;
                return false;
            });
            matches = matches.concat(adminMatches);
        }

        if (matches.length > 0) {
            let res = "I found these relevant links that might help:<br><ul>";
            const seen = new Set();
            matches.forEach(m => {
                if (!seen.has(m.url)) {
                    res += `<li><a href="${m.url}" target="_blank">${m.icon} ${m.name}</a></li>`;
                    seen.add(m.url);
                }
            });
            res += "</ul>";
            return res;
        }

        if (/\btask(s)?\b|\btodo\b/i.test(q)) {
             return 'Your personal tasks are located here: <a href="todo.html">My Tasks</a>';
        }

        return "I'm sorry, I couldn't find specific instructions for that. Try asking about 'holidays', 'passwords', 'IT support', 'pupil behaviour', or 'timetables'.";
    }
})();
