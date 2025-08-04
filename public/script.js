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
    let welcomeMessage = document.getElementById('welcome-message');

    const uploadMenu = document.getElementById('upload-menu');
    const cameraBtn = document.getElementById('camera-btn');
    const galleryBtn = document.getElementById('gallery-btn');
    const fileBtn = document.getElementById('file-btn');
    
    const newSessionBtn = document.getElementById('new-session-btn');
    const chatHistoryBtn = document.getElementById('chat-history-btn');
    const sessionsList = document.getElementById('sessions-list');
    const currentChatTitle = document.getElementById('current-chat-title');

    let selectedFile = null;
    let isFirstMessage = true;
    let currentSessionId = null;
    let isSubmitting = false;

    let typingTimeout;
    let deletionTimeout;

    const startTypingAnimation = (message) => {
        let i = 0;
        let isTyping = true;
        
        const cursor = welcomeMessage.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();

        const newCursor = document.createElement('span');
        newCursor.className = 'blinking-cursor';
        newCursor.textContent = '|';
        welcomeMessage.appendChild(newCursor);
        
        welcomeMessage.textContent = '';
        welcomeMessage.appendChild(newCursor);

        const animateLoop = () => {
            if (isTyping) {
                if (i < message.length) {
                    welcomeMessage.textContent = message.substring(0, i + 1);
                    welcomeMessage.appendChild(newCursor);
                    i++;
                    typingTimeout = setTimeout(animateLoop, 50);
                } else {
                    isTyping = false;
                    deletionTimeout = setTimeout(animateLoop, 7000);
                }
            } else {
                if (i >= 0) {
                    welcomeMessage.textContent = message.substring(0, i);
                    welcomeMessage.appendChild(newCursor);
                    i--;
                    deletionTimeout = setTimeout(animateLoop, 25);
                } else {
                    isTyping = true;
                    typingTimeout = setTimeout(animateLoop, 1000);
                }
            }
        };
        animateLoop();
    };

    const stopTypingAnimation = () => {
        clearTimeout(typingTimeout);
        clearTimeout(deletionTimeout);
        const cursor = welcomeMessage.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();
        welcomeMessage.textContent = '';
    };

    const initialMessage = `${getGreeting()}, aku Noa AI`;
    startTypingAnimation(initialMessage);

    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        loadSessionsList();
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    newSessionBtn.addEventListener('click', () => {
        startNewSession();
        sidebar.classList.remove('open');
    });

    chatHistoryBtn.addEventListener('click', () => {
        sessionsList.classList.toggle('show');
        chatHistoryBtn.classList.toggle('active');
    });

    function startNewSession() {
        currentSessionId = null;
        chatBox.innerHTML = `<div id="welcome-message" class="welcome-message"></div>`;
        isFirstMessage = true;
        welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            const greetingMessage = `${getGreeting()}, aku Noa AI`;
            startTypingAnimation(greetingMessage);
        }
        currentChatTitle.textContent = 'Noa AI';
        chatInput.focus();
    }
    
    async function loadSessionsList() {
        try {
            const response = await fetch('/api/chat', { method: 'GET' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to load sessions list: ${response.status} - ${errorData.message}`);
            }
            
            const { sessions } = await response.json();
            sessionsList.innerHTML = '';
            if (sessions && sessions.length > 0) {
                sessions.forEach(session => {
                    const li = document.createElement('li');
                    li.classList.add('session-list-item');

                    const titleButton = document.createElement('button');
                    titleButton.textContent = session.title;
                    titleButton.classList.add('session-title-button');
                    titleButton.dataset.sessionId = session.session_id;

                    titleButton.addEventListener('click', () => {
                        loadChatHistory(session.session_id, session.title);
                        sidebar.classList.remove('open');
                    });
                    
                    const sessionActions = document.createElement('div');
                    sessionActions.classList.add('session-actions');

                    const separator = document.createElement('div');
                    separator.classList.add('separator');
                    sessionActions.appendChild(separator);
                    
                    li.appendChild(titleButton);
                    li.appendChild(sessionActions);
                    sessionsList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.innerHTML = '<button style="color:var(--primary-text-color);">Tidak ada riwayat</button>';
                sessionsList.appendChild(li);
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            sessionsList.innerHTML = `<li><button style="color:var(--error-color);">Error: Gagal memuat sesi.</button></li>`;
        }
    }

    async function loadChatHistory(sessionId, title) {
        try {
            const response = await fetch(`/api/chat?sessionId=${sessionId}`, { method: 'GET' });
            if (!response.ok) throw new Error('Failed to load chat history.');
            
            const { history } = await response.json();
            
            chatBox.innerHTML = '';
            welcomeMessage.classList.add('hide');
            isFirstMessage = false;

            stopTypingAnimation();

            if (history && history.length > 0) {
                history.forEach(msg => {
                    appendMessage(msg.role, msg.text);
                });
            } else {
                appendMessage('ai', 'Riwayat chat ini masih kosong.');
            }

            currentSessionId = sessionId;
        } catch (error) {
            console.error('Error loading history:', error);
            chatBox.innerHTML = `<div id="welcome-message" class="welcome-message hide"></div>`;
            appendMessage('ai', 'Maaf, terjadi kesalahan saat memuat riwayat chat.');
            currentChatTitle.textContent = 'Noa AI';
            currentSessionId = null;
        }
    }

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 11) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    }

    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    uploadBtn.addEventListener('click', () => {
        uploadMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.upload-area') && uploadMenu.classList.contains('show')) {
            uploadMenu.classList.remove('show');
        }
    });

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
        const file = e.target.files && e.target.files.length > 0 ? e.target.files.item(0) : null;
        if (file) {
            selectedFile = file;
            displayFilePreview(file);
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;

        const userMessage = chatInput.value.trim();
        const fileToSend = fileInput.files.length > 0 ? fileInput.files.item(0) : null;

        if (userMessage || fileToSend) {
            isSubmitting = true;

            if (isFirstMessage) {
                welcomeMessage.classList.add('hide');
                isFirstMessage = false;
                stopTypingAnimation();
            }

            if (fileToSend) {
                if (fileToSend.type.startsWith('image/')) {
                    const imageCard = document.createElement('div');
                    imageCard.classList.add('message', 'user-message', 'image-card');
                    imageCard.addEventListener('click', () => showImagePreview(fileToSend));
                    
                    const image = document.createElement('img');
                    image.src = URL.createObjectURL(fileToSend);
                    imageCard.appendChild(image);
                    chatBox.appendChild(imageCard);
                } else {
                    const fileCard = document.createElement('div');
                    fileCard.classList.add('message', 'user-message', 'document-card');
                    
                    const fileExtension = fileToSend.name.split('.').pop().toLowerCase();
                    fileCard.classList.add(`file-type-${fileExtension}`);

                    const fileContent = document.createElement('div');
                    fileContent.classList.add('file-content');
                    const fileName = document.createElement('p');
                    fileName.textContent = `${fileToSend.name}`;
                    fileContent.appendChild(fileName);
                    
                    fileCard.appendChild(fileContent);
                    chatBox.appendChild(fileCard);
                }
            }
            
            if (userMessage) {
                appendMessage('user', userMessage);
            }
            
            chatBox.scrollTop = chatBox.scrollHeight;
            chatInput.value = '';
            chatInput.style.height = 'auto';
            removeFile();
            showTypingIndicator();

            try {
                const formData = new FormData();
                formData.append('message', userMessage);
                if (fileToSend) {
                    formData.append('file', fileToSend);
                }
                if (currentSessionId) {
                    formData.append('sessionId', currentSessionId);
                }

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server response was not ok: ${response.status} - ${errorText}`);
                }
                
                hideTypingIndicator();
                const data = await response.json();
                appendMessage('ai', data.text);
                
                if (data.sessionId && !currentSessionId) {
                    currentSessionId = data.sessionId;
                }
                
                loadSessionsList();
            } catch (error) {
                console.error('Error:', error);
                hideTypingIndicator();
                currentSessionId = null;
                isFirstMessage = true;
                appendMessage('ai', `Maaf, terjadi kesalahan saat memproses permintaanmu. Coba lagi nanti ya. Error: ${error.message}`);
            } finally {
                isSubmitting = false;
            }
        }
    });

    function showImagePreview(file) {
        const previewOverlay = document.createElement('div');
        previewOverlay.classList.add('image-preview-overlay');
        const previewImage = document.createElement('img');
        previewImage.src = URL.createObjectURL(file);
        
        previewOverlay.appendChild(previewImage);
        document.body.appendChild(previewOverlay);
        
        previewOverlay.addEventListener('click', () => {
            previewOverlay.remove();
        });
    }

    function appendMessage(sender, message) {
        if (!message) return;
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        
        const content = document.createElement('div');
        content.classList.add('message-content');
        const parts = message.split('```');
        
        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 1) { // Logika jika ini adalah blok kode
                const [lang, ...codeLines] = parts[i].split('\n');
                const codeContent = codeLines.join('\n').trim();
    
                const codeBlockContainer = document.createElement('div');
                codeBlockContainer.classList.add('code-block-container');
    
                const codeBlockHeader = document.createElement('div');
                codeBlockHeader.classList.add('code-block-header');
    
                const langLabel = document.createElement('span');
                langLabel.classList.add('code-language');
                langLabel.textContent = lang.toUpperCase().trim() || 'TEXT';
    
                const copyBtn = document.createElement('button');
                copyBtn.textContent = 'Copy';
                copyBtn.classList.add('copy-btn');
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(codeContent).then(() => {
                        copyBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            copyBtn.textContent = 'Copy';
                        }, 2000);
                    });
                });
    
                codeBlockHeader.appendChild(langLabel);
                codeBlockHeader.appendChild(copyBtn);
                
                // --- PERUBAHAN UTAMA ADA DI SINI ---
                // Kita tidak lagi membuat <pre> dan <code>, tapi sebuah <p>
                const codeAsText = document.createElement('p');
                codeAsText.classList.add('code-as-plain-text');
                // Menggunakan innerText agar line break (baris baru) tetap muncul
                codeAsText.innerText = codeContent;
                // --- AKHIR DARI PERUBAHAN ---
    
                codeBlockContainer.appendChild(codeBlockHeader);
                codeBlockContainer.appendChild(codeAsText); // Menambahkan elemen <p> yang baru
                content.appendChild(codeBlockContainer);
    
            } else if (i % 2 === 0 && parts[i].trim()) { // Logika jika ini teks biasa
                const textContent = document.createElement('p');
                textContent.innerHTML = parts[i].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>').replace(/"/g, "'");
                content.appendChild(textContent);
            }
        }
    
        messageElement.appendChild(content);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    
        // Panggilan ke Prism.highlightElement tidak akan berpengaruh lagi
        // karena kita tidak menggunakan elemen <pre><code> untuk blok kode ini.
        if (typeof Prism !== 'undefined') {
            const codeElements = content.querySelectorAll('pre code');
            codeElements.forEach(Prism.highlightElement);
        }
    }
    
    function showTypingIndicator() {
        if (!document.getElementById('typing-indicator')) {
            const typingIndicator = document.createElement('div');
            typingIndicator.id = 'typing-indicator';
            typingIndicator.classList.add('message', 'ai-message', 'typing-indicator');
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

    loadSessionsList();
});
