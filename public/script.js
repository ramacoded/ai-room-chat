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

    const uploadMenu = document.getElementById('upload-menu');
    const cameraBtn = document.getElementById('camera-btn');
    const galleryBtn = document.getElementById('gallery-btn');
    const fileBtn = document.getElementById('file-btn');
    const historyLink = document.querySelector('a[href="#"]'); // Ambil link Riwayat Chat

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

    // Memuat riwayat chat saat halaman dimuat
    async function loadHistory() {
        try {
            const response = await fetch('/api/chat', { method: 'GET' });
            if (!response.ok) throw new Error('Failed to load chat history.');
            
            const { history } = await response.json();
            if (history && history.length > 0) {
                // Menghilangkan welcome message jika riwayat sudah ada
                welcomeMessage.classList.add('hide');
                isFirstMessage = false;

                history.forEach(msg => {
                    appendMessage(msg.role, msg.text);
                });
            } else {
                welcomeMessage.textContent = `${getGreeting()}, aku Noa AI`;
            }
        } catch (error) {
            console.error('Error loading history:', error);
            welcomeMessage.textContent = `${getGreeting()}, aku Noa AI`;
        }
    }
    loadHistory();

    // Event listener untuk tombol Riwayat Chat
    historyLink.addEventListener('click', (e) => {
        e.preventDefault();
        chatBox.innerHTML = ''; // Hapus chat box
        loadHistory(); // Muat ulang riwayat chat
        sidebar.classList.remove('open'); // Tutup sidebar
    });
    
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    // Toggle upload menu
    uploadBtn.addEventListener('click', () => {
        uploadMenu.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.upload-area') && uploadMenu.classList.contains('show')) {
            uploadMenu.classList.remove('show');
        }
    });

    // Handle menu button clicks
    cameraBtn.addEventListener('click', () => {
        fileInput.setAttribute('capture', 'camera');
        fileInput.click();
        uploadMenu.classList.remove('show');
    });
    
    galleryBtn.addEventListener('click', () => {
        fileInput.removeAttribute('capture');
        fileInput.setAttribute('accept', 'image/*');
        fileInput.click();
        uploadMenu.classList.remove('show');
    });

    fileBtn.addEventListener('click', () => {
        fileInput.removeAttribute('capture');
        fileInput.removeAttribute('accept');
        fileInput.click();
        uploadMenu.classList.remove('show');
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
            if (isFirstMessage) {
                welcomeMessage.classList.add('hide');
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
