
document.addEventListener("DOMContentLoaded", () => {
  const messagesContainer = document.getElementById('messages');

  const messages = [
    { id: 1, sender: 'John', text: 'Hello, how are you?', starred: false, media: [] },
    { id: 2, sender: 'You', text: 'I'm good, thanks!', starred: false, media: [] },
    { id: 3, sender: 'John', text: 'Here's a photo I took today.', starred: false, media: ['photo1.jpg'] },
  ];

  function displayMessages() {
    messagesContainer.innerHTML = '';
    messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      if (message.starred) {
        messageElement.classList.add('starred');
      }
      messageElement.innerHTML = `
        <div class="sender">${message.sender}</div>
        <div class="text">${message.text}</div>
        ${message.media.length > 0 ? `<div class="media"><img src="/assets/${message.media[0]}" alt="media"></div>` : ''}
        <button onclick="toggleStar(${message.id})">⭐ ${message.starred ? 'Unstar' : 'Star'}</button>
      `;
      messagesContainer.appendChild(messageElement);
    });
  }

  function toggleStar(id) {
    const message = messages.find(msg => msg.id === id);
    if (message) {
      message.starred = !message.starred;
      displayMessages();
    }
  }

  displayMessages();
});
