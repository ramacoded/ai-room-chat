// File: public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.main-container');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const filePreviewContainer = document.getElementById('file-preview');

    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const welcomeMessage = document.getElementById('welcome-message');

    let selectedFile = null;
    let isFirstMessage = true;

    // Sidebar functionality
    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Welcome message functionality
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 11) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    }

    welcomeMessage.textContent = `${getGreeting()}, aku Noa AI`;

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            displayFilePreview(file);
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = chatInput.value.trim();
        
        if (userMessage || selectedFile) {
            // HILANGKAN WELCOME MESSAGE SECARA INSTAN PADA PESAN PERTAMA
            if (isFirstMessage) {
                welcomeMessage.classList.add('hide'); // Menggunakan kelas 'hide'
                isFirstMessage = false;
            }

            appendMessage('user', userMessage, selectedFile);
            chatInput.value = '';
            chatInput.style.height = 'auto';
            removeFile();
            showTypingIndicator();

            try {
                const formData = new FormData();
                formData.append('message', userMessage);
                if (selectedFile) {
                    formData.append('file', selectedFile);
                }

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    body: formData,
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

    function appendMessage(sender, message, file = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        
        if (file) {
            const filePreview = document.createElement('div');
            filePreview.classList.add('message-file-preview');
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                filePreview.appendChild(img);
            } else {
                const fileName = document.createElement('p');
                fileName.textContent = file.name;
                filePreview.appendChild(fileName);
            }
            content.appendChild(filePreview);
        }

        const parts = message.split(/```/);
        parts.forEach((part, index) => {
            if (index % 2 === 1) {
                const codeBlock = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = part;
                
                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copy';
                copyBtn.classList.add('copy-btn');
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(part).then(() => {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.textContent = 'Copy';
                        }, 2000);
                    });
                });
                
                codeBlock.appendChild(code);
                codeBlock.appendChild(copyBtn);
                content.appendChild(codeBlock);
            } else {
                if (part.trim()) {
                    const textContent = document.createElement('p');
                    textContent.textContent = part;
                    content.appendChild(textContent);
                }
            }
        });

        messageElement.appendChild(content);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function displayFilePreview(file) {
        filePreviewContainer.style.display = 'flex';
        filePreviewContainer.innerHTML = '';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.classList.add('file-preview-image');
            filePreviewContainer.appendChild(img);
        } else {
            const fileInfo = document.createElement('div');
            fileInfo.classList.add('file-preview-info');
            fileInfo.textContent = `File: ${file.name}`;
            filePreviewContainer.appendChild(fileInfo);
        }

        const closeBtn = document.createElement('span');
        closeBtn.classList.add('file-preview-close');
        closeBtn.innerHTML = '&#x2716;';
        closeBtn.onclick = removeFile;
        filePreviewContainer.appendChild(closeBtn);
    }
    
    window.removeFile = function() {
        selectedFile = null;
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        filePreviewContainer.innerHTML = '';
    }

    function showTypingIndicator() {
        if (!document.getElementById('typing-indicator')) {
            const typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing-indicator';
            typingIndicator.classList.add('typing-indicator', 'ai-message');
            typingIndicator.innerHTML = `
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
});
