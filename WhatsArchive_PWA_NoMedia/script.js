document.addEventListener("DOMContentLoaded", () => {
    const messagesContainer = document.getElementById('messages');
    const fileInput = document.getElementById('fileInput');
    const searchInput = document.getElementById('searchInput');
    let messages = [];

    // Load starred IDs from localStorage
    function loadStarred() {
        try {
            const stored = localStorage.getItem('starredMessages');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    // Save starred IDs back to localStorage
    function saveStarred(ids) {
        try {
            localStorage.setItem('starredMessages', JSON.stringify(ids));
        } catch (e) {
            // ignore storage errors
        }
    }

    // Escape HTML to prevent injection
    function escapeHtml(text) {
        return String(text || '').replace(/[&<>"']/g, function(match) {
            const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return escapes[match];
        });
    }

    // Render a list of messages to the DOM
    function displayMessages(msgs = messages) {
        messagesContainer.innerHTML = '';
        const starredIds = loadStarred();
        msgs.forEach((msg) => {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('message');
            if (starredIds.includes(msg.id)) {
                msgDiv.classList.add('starred');
            }

            const senderDiv = document.createElement('div');
            senderDiv.classList.add('sender');
            senderDiv.innerHTML = escapeHtml(msg.sender || '');
            msgDiv.appendChild(senderDiv);

            const textDiv = document.createElement('div');
            textDiv.classList.add('text');
            textDiv.innerHTML = escapeHtml(msg.text || '');
            msgDiv.appendChild(textDiv);

            if (msg.mediaFilename) {
                const ext = msg.mediaFilename.split('.').pop().toLowerCase();
                if (['jpg','jpeg','png','gif','webp'].includes(ext)) {
                    const img = document.createElement('img');
                    img.classList.add('media');
                    img.src = msg.mediaFilename;
                    msgDiv.appendChild(img);
                } else {
                    const link = document.createElement('a');
                    link.href = msg.mediaFilename;
                    link.textContent = msg.mediaFilename;
                    link.classList.add('media');
                    link.target = '_blank';
                    msgDiv.appendChild(link);
                }
            }

            const btn = document.createElement('button');
            btn.textContent = starredIds.includes(msg.id) ?'Unstar' : 'Star'
            btn.addEventListener('click', () => {
                toggleStar(msg.id);
            });
            msgDiv.appendChild(btn);

            messagesContainer.appendChild(msgDiv);
        });
    }

    // Refresh the display based on current search query
    function refreshDisplay() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        if (query) {
            const filtered = messages.filter(m => {
                const textMatch = m.text && m.text.toLowerCase().includes(query);
                const senderMatch = m.sender && m.sender.toLowerCase().includes(query);
                return textMatch || senderMatch;
            });
            displayMessages(filtered);
        } else {
            displayMessages(messages);
        }
    }

    // Toggle starred state for a message
    function toggleStar(id) {
        const starred = loadStarred();
        const idx = starred.indexOf(id);
        if (idx === -1) {
            starred.push(id);
        } else {
            starred.splice(idx, 1);
        }
        saveStarred(starred);
        refreshDisplay();
    }

    // Parse WhatsApp chat export into structured messages
    function parseChat(text) {
        const lines = text.split(/\r?\n/);
        const msgs = [];
        let current = null;
        const pattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2})(?:\s?[AP]M)?\s-\s([^:]+?):\s([\s\S]*)$/;
        lines.forEach((line) => {
            const m = line.match(pattern);
            if (m) {
                if (current) msgs.push(current);
                const date = m[1];
                const time = m[2];
                const sender = m[3];
                let textPart = m[4];
                let mediaFilename = null;
                const attachedMatch = textPart.match(/<attached: ([^>]+)>/);
                if (attachedMatch) {
                    mediaFilename = attachedMatch[1];
                } else {
                    const fileMatch = textPart.match(/(IMG-|VID-|AUDIO-).*?\.(jpg|jpeg|png|gif|mp4|mp3|wav|m4a|3gp)/i);
                    if (fileMatch) {
                        mediaFilename = fileMatch[0];
                    }
                }
                current = {
                    id: 0,
                    date,
                    time,
                    sender,
                    text: textPart,
                    mediaFilename
                };
            } else {
                if (current) {
                    current.text += '\n' + line;
                }
            }
        });
        if (current) msgs.push(current);
        return msgs;
    }

    // Handle file input change
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                messages = parseChat(ev.target.result);
                messages.forEach((msg, idx) => {
                    msg.id = idx + 1;
                });
                refreshDisplay();
            };
            reader.readAsText(file);
        });
    }

    // Attach search listener
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            refreshDisplay();
        });
    }

    // Initialize display
    refreshDisplay();
});
