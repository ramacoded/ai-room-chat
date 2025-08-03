document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Menyesuaikan tinggi textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = chatInput.value.trim();
        if (userMessage) {
            appendMessage('user', userMessage);
            chatInput.value = '';
            chatInput.style.height = 'auto'; // Reset height
            showTypingIndicator();

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: userMessage }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                hideTypingIndicator();
                appendMessage('ai', data.text);
            } catch (error) {
                console.error('Error:', error);
                hideTypingIndicator();
                appendMessage('ai', 'Maaf, terjadi kesalahan saat memproses permintaanmu. Coba lagi nanti ya.');
            }
        }
    });

    // Function to append a new message to the chat box
    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        
        const avatar = document.createElement('img');
        avatar.classList.add('message-avatar');
        avatar.src = sender === 'user' ? 'https://img.icons8.com/color/48/000000/user.png' : 'https://img.icons8.com/color/48/000000/robot-3d.png';
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        
        // Split message by code blocks and render appropriately
        const parts = message.split(/```/);
        parts.forEach((part, index) => {
            if (index % 2 === 1) {
                const codeBlock = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = part;
                codeBlock.appendChild(code);
                content.appendChild(codeBlock);
            } else {
                if (part.trim()) {
                    const textContent = document.createElement('p');
                    textContent.textContent = part;
                    content.appendChild(textContent);
                }
            }
        });

        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Function to show/hide typing indicator
    function showTypingIndicator() {
        if (!document.getElementById('typing-indicator')) {
            const typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing-indicator';
            typingIndicator.classList.add('typing-indicator', 'ai-message');
            typingIndicator.innerHTML = `
                <img src="[https://img.icons8.com/color/48/000000/robot-3d.png](https://img.icons8.com/color/48/000000/robot-3d.png)" alt="Noa AI" class="message-avatar">
                <div class="message-content">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
            chatBox.appendChild(typingIndicator);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Theme switching logic with the smooth circular effect
    themeToggleBtn.addEventListener('click', () => {
        const effectElement = document.createElement('div');
        effectElement.classList.add('theme-switch-effect');
        document.body.appendChild(effectElement);
        
        const rect = themeToggleBtn.getBoundingClientRect();
        effectElement.style.top = `${rect.top + rect.height / 2}px`;
        effectElement.style.left = `${rect.left + rect.width / 2}px`;

        effectElement.classList.add('active');

        // Wait for the animation to finish before changing the theme
        setTimeout(() => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // Clean up the effect element
            effectElement.remove();
        }, 600); // This duration should match the CSS transition duration
    });
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeToggleBtn.textContent = '☀️';
    } else {
        themeToggleBtn.textContent = '🌙';
    }

});
