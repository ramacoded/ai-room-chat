document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen Utama ---
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    let welcomeMessage = document.getElementById('welcome-message');
    const newSessionBtn = document.getElementById('new-session-btn');
    const chatHistoryBtn = document.getElementById('chat-history-btn');
    const sessionsList = document.getElementById('sessions-list');
    const currentChatTitle = document.getElementById('current-chat-title');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const filePreviewContainer = document.getElementById('file-preview');
    const uploadMenu = document.getElementById('upload-menu');
    const cameraBtn = document.getElementById('camera-btn');
    const galleryBtn = document.getElementById('gallery-btn');
    const fileBtn = document.getElementById('file-btn');

    // --- Elemen Pengaturan ---
    const settingsPage = document.getElementById('settings-page');
    const openSettingsBtn = document.getElementById('open-settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const textSizeSwitcher = document.getElementById('text-size-switcher');
    const enterToSendToggle = document.getElementById('enter-to-send-toggle');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const langSetting = document.getElementById('setting-language');
    const exportSetting = document.getElementById('setting-export');

    let selectedFile = null;
    let isFirstMessage = true;
    let currentSessionId = null;
    let isSubmitting = false;

    // =================================================================
    // PENGATURAN & TEMA
    // =================================================================

    openSettingsBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                settingsPage.classList.add('open');
            });
        } else {
            settingsPage.classList.add('open');
        }
    });
    closeSettingsBtn.addEventListener('click', () => {
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                settingsPage.classList.remove('open');
            });
        } else {
            settingsPage.classList.remove('open');
        }
    });
    // --- Logika Tema ---
    const applyTheme = (theme) => {
        const doc = document.documentElement;
        doc.classList.remove('light-theme', 'dark-theme');
        let themeToApply = theme;

        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            themeToApply = prefersDark ? 'dark' : 'light';
        }
        doc.classList.add(themeToApply === 'light' ? 'light-theme' : 'dark-theme');
    };

    const updateThemeButtons = (selectedTheme) => {
        themeSwitcher.querySelectorAll('button').forEach(button => {
            button.classList.remove('active');
            if (button.dataset.theme === selectedTheme) button.classList.add('active');
        });
    };

    themeSwitcher.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const selectedTheme = event.target.dataset.theme;
            if (document.startViewTransition) {
                document.startViewTransition(() => applyTheme(selectedTheme));
            } else {
                applyTheme(selectedTheme);
            }
            localStorage.setItem('app-theme', selectedTheme);
            updateThemeButtons(selectedTheme);
        }
    });
    // --- Logika Ukuran Teks ---
    const applyTextSize = (size) => {
        const doc = document.documentElement;
        doc.classList.remove('text-small', 'text-large');
        if (size === 'small') doc.classList.add('text-small');
        if (size === 'large') doc.classList.add('text-large');
    };
    const updateTextSizeButtons = (selectedSize) => {
        textSizeSwitcher.querySelectorAll('button').forEach(button => {
            button.classList.remove('active');
            if (button.dataset.size === selectedSize) button.classList.add('active');
        });
    };

    textSizeSwitcher.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON') {
            const selectedSize = event.target.dataset.size;
            applyTextSize(selectedSize);
            localStorage.setItem('app-text-size', selectedSize);
            updateTextSizeButtons(selectedSize);
        }
    });
    // --- Logika Kirim dengan Enter ---
    let enterToSend = localStorage.getItem('app-enter-to-send') === 'true';
    enterToSendToggle.checked = enterToSend;
    enterToSendToggle.addEventListener('change', () => {
        enterToSend = enterToSendToggle.checked;
        localStorage.setItem('app-enter-to-send', enterToSend);
    });
    chatInput.addEventListener('keydown', (e) => {
        if (enterToSend && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    });
    // --- Pengaturan Placeholder ---
    langSetting.addEventListener('click', () => alert('Fitur ganti bahasa belum tersedia.'));
    exportSetting.addEventListener('click', () => alert('Fitur ekspor data belum tersedia.'));
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus SEMUA riwayat percakapan? Tindakan ini tidak dapat diurungkan.')) {
            alert('Semua riwayat telah dihapus.');
            // Anda bisa menambahkan logika penghapusan data di sini
        }
    });
    // --- Muat semua pengaturan saat halaman dibuka ---
    const savedTheme = localStorage.getItem('app-theme') || 'system';
    applyTheme(savedTheme);
    updateThemeButtons(savedTheme);
    const savedTextSize = localStorage.getItem('app-text-size') || 'normal';
    applyTextSize(savedTextSize);
    updateTextSizeButtons(savedTextSize);

    // =================================================================
    // LOGIKA CHAT
    // =================================================================

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
        welcomeMessage.innerHTML = '';
    };

    const initialMessage = `${getGreeting()}, Namaku Evelyn.`;
    if (welcomeMessage) {
        startTypingAnimation(initialMessage);
    }
    
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
            const greetingMessage = `${getGreeting()}, Aku Evelyn`;
            startTypingAnimation(greetingMessage);
        }
        currentChatTitle.textContent = 'Evelyn';
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
            // welcomeMessage.classList.add('hide'); // This line can cause errors, better to just clear the box.
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
            currentChatTitle.textContent = title; // Set title when loading history
        } catch (error) {
            console.error('Error loading history:', error);
            chatBox.innerHTML = ``;
            appendMessage('ai', 'Maaf, terjadi kesalahan saat memuat riwayat chat.');
            currentChatTitle.textContent = 'Evelyn';
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
                if(welcomeMessage) {
                    welcomeMessage.classList.add('hide');
                }
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
                        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
                    });
                });
    
                codeBlockHeader.appendChild(langLabel);
                codeBlockHeader.appendChild(copyBtn);
                
                const codeAsText = document.createElement('p');
                codeAsText.classList.add('code-as-plain-text');
                codeAsText.innerText = codeContent;
    
                codeBlockContainer.appendChild(codeBlockHeader);
                codeBlockContainer.appendChild(codeAsText);
                content.appendChild(codeBlockContainer);
                content.classList.add('has-code-block');
            } else if (parts[i].trim()) { // Logika jika ini teks biasa
                const textContent = document.createElement('p');
                
                // === PERBAIKAN REGEX LINK ADA DI SINI ===
                const urlRegex = /(https?:\/\/[^\]\s"'<>()\[]+)/g;
                let processedText = parts[i]
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
            
                processedText = processedText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>');
                
                textContent.innerHTML = processedText;
                content.appendChild(textContent);
            }
        }
    
        messageElement.appendChild(content);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    
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
            typingIndicator.innerHTML = `<div class="message-content"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
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
