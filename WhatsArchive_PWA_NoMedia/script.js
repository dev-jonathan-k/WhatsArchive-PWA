document.addEventListener("DOMContentLoaded", () => {
  const messagesContainer = document.getElementById('messages');
  const fileInput = document.getElementById('fileInput');
  let messages = [];

  // Helper to load starred message IDs from localStorage
  function loadStarred() {
    try {
      const stored = localStorage.getItem('starredMessages');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  // Helper to save starred message IDs to localStorage
  function saveStarred(ids) {
    localStorage.setItem('starredMessages', JSON.stringify(ids));
  }

  // Display messages in the DOM
  function displayMessages() {
    messagesContainer.innerHTML = '';
    const starredIds = loadStarred();
    messages.forEach(msg => {
      msg.starred = starredIds.includes(msg.id);
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      if (msg.starred) {
        messageElement.classList.add('starred');
      }

      let mediaHtml = '';
      if (msg.media && msg.media.length > 0) {
        const fileName = msg.media[0];
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg','jpeg','png','gif','webp'].includes(ext)) {
          mediaHtml = `<div class="media"><img src="${fileName}" alt="media"></div>`;
        } else if (['mp4','mov','avi'].includes(ext)) {
          mediaHtml = `<div class="media"><video src="${fileName}" controls></video></div>`;
        } else {
          mediaHtml = `<div class="media"><a href="${fileName}" download>${fileName}</a></div>`;
        }
      }

      messageElement.innerHTML = `
        <div class="sender">${msg.sender}</div>
        <div class="text">${msg.text}</div>
        ${mediaHtml}
        <button onclick="toggleStar(${msg.id})">⭐ ${msg.starred ? 'Unstar' : 'Star'}</button>
      `;
      messagesContainer.appendChild(messageElement);
    });
  }

  // Expose toggleStar globally so buttons can call it
  window.toggleStar = function(id) {
    const starredIds = loadStarred();
    const index = starredIds.indexOf(id);
    if (index >= 0) {
      starredIds.splice(index, 1);
    } else {
      starredIds.push(id);
    }
    saveStarred(starredIds);
    displayMessages();
  };

  // Parse WhatsApp chat export text into message objects
  function parseChat(text) {
    const lines = text.split(/\r?\n/);
    const msgs = [];
    let current = null;
    const pattern = /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}|\d{4}[\/\.\-]\d{1,2}[\/\.\-]\d{1,2}),\s+(\d{1,2}:\d{2}(?:\s?[APMapm]{2})?)\s+[-–]\s+(.*?):\s+(.*)$/;

    lines.forEach(line => {
      const m = line.match(pattern);
      if (m) {
        if (current) {
          msgs.push(current);
        }
        const sender = m[3].trim();
        let textPart = m[4].trim();
        const media = [];
        // Check for attached media indicated by <attached: filename>
        const attachedMatch = textPart.match(/<attached:\s*([^>]+)>/i);
        if (attachedMatch) {
          media.push(attachedMatch[1].trim());
          textPart = textPart.replace(attachedMatch[0], '').trim();
        } else {
          // Look for common filename pattern e.g. IMG-20200101-WA0000.jpg
          const fileMatch = textPart.match(/(IMG-|VID-|PTT-|AUD-|DOC-)[^\s]+\.[A-Za-z0-9]{2,5}/);
          if (fileMatch) {
            media.push(fileMatch[0]);
            textPart = textPart.replace(fileMatch[0], '').trim();
          }
        }
        current = {
          id: msgs.length + 1,
          sender: sender,
          time: m[1] + ' ' + m[2],
          text: textPart,
          media: media,
          starred: false
        };
      } else {
        if (current) {
          current.text += '\n' + line.trim();
        }
      }
    });
    if (current) {
      msgs.push(current);
    }
    return msgs;
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        messages = parseChat(ev.target.result);
        messages.forEach((msg, idx) => {
          msg.id = idx + 1;
        });
        displayMessages();
      };
      reader.readAsText(file);
    });
  }
});
