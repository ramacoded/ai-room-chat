document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.main-container');

    const handleViewportHeight = () => {
        if (mainContainer) {
            mainContainer.style.height = `${window.innerHeight}px`;
        }
    };

    handleViewportHeight();
    window.addEventListener('resize', handleViewportHeight);

    let typingInterval;

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
    const headerTitle = document.querySelector('.header-title');
    const currentChatTitle = document.getElementById('current-chat-title');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const filePreviewContainer = document.getElementById('file-preview');
    const uploadMenu = document.getElementById('upload-menu');
    const cameraBtn = document.getElementById('camera-btn');
    const galleryBtn = document.getElementById('gallery-btn');
    const fileBtn = document.getElementById('file-btn');

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
        const button = event.target.closest('button');
        if (!button) return;

        const selectedTheme = button.dataset.theme;

        if (document.startViewTransition) {
            const x = event.clientX;
            const y = event.clientY;
            const endRadius = Math.hypot(
               Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );

            const transition = document.startViewTransition(() => {
                applyTheme(selectedTheme);
            });

            transition.ready.then(() => 
            {
                document.documentElement.animate({
                    clipPath: [
                        `circle(0% at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`
                   ]
                }, {
                    duration: 500,
                    easing: 'ease-in-out',
                    pseudoElement: '::view-transition-new(root)'
               });
            });
        } else {
            applyTheme(selectedTheme);
        }

        localStorage.setItem('app-theme', selectedTheme);
        updateThemeButtons(selectedTheme);
    });
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
    langSetting.addEventListener('click', () => alert('Fitur ganti bahasa belum tersedia.'));
    exportSetting.addEventListener('click', () => alert('Fitur ekspor data belum tersedia.'));
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus SEMUA riwayat percakapan? Tindakan ini tidak dapat diurungkan.')) {
            alert('Semua riwayat telah dihapus.');
        }
    });
    const savedTheme = localStorage.getItem('app-theme') || 'system';
    applyTheme(savedTheme);
    updateThemeButtons(savedTheme);
    const savedTextSize = localStorage.getItem('app-text-size') || 'normal';
    applyTextSize(savedTextSize);
    updateTextSizeButtons(savedTextSize);

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
        if (welcomeMessage) {
            const cursor = welcomeMessage.querySelector('.blinking-cursor');
            if (cursor) cursor.remove();
            welcomeMessage.innerHTML = '';
        }
    };

    const initialMessage = `${getGreeting()}, Namaku Coreon.`;
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
            const greetingMessage = `${getGreeting()}, saya Coreon`;
            startTypingAnimation(greetingMessage);
        }
        if (headerTitle) {
            headerTitle.classList.remove('in-conversation');
        }
        chatInput.focus();
    }

    async function loadSessionsList() {
        try {
            const response = await fetch('/api/chat', { method: 'GET' });
            if (!response.ok) {
                throw new Error(`Gagal memuat daftar sesi: ${response.status}`);
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
                sessionsList.innerHTML = '<li><button style="color:var(--secondary-text-color);">Tidak ada riwayat</button></li>';
            }
        } catch (error) {
            console.error('Error loading sessions:', error);
            sessionsList.innerHTML = `<li><button style="color:var(--error-color);">Error: Gagal memuat sesi.</button></li>`;
        }
    }

    async function loadChatHistory(sessionId, title) {
        try {
            const response = await fetch(`/api/chat?sessionId=${sessionId}`, { method: 'GET' });
            if (!response.ok) throw new Error('Gagal memuat riwayat chat.');
            const { history } = await response.json();
            chatBox.innerHTML = '';
            isFirstMessage = false;
            stopTypingAnimation();
            if (headerTitle) {
                headerTitle.classList.add('in-conversation');
            }
            if (history && history.length > 0) {
                history.forEach(msg => {
                    const content = (msg.role === 'ai') ? markdownToHtml(msg.text) : msg.text;
                    appendMessage(msg.role, content);
                });
            }
            currentSessionId = sessionId;
            currentChatTitle.textContent = title;
        } catch (error) {
            console.error('Error loading history:', error);
            appendMessage('ai', '<p>Maaf, terjadi kesalahan saat memuat riwayat chat.</p>');
            if (headerTitle) {
                headerTitle.classList.remove('in-conversation');
            }
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

        if (!userMessage && !fileToSend) return;

        isSubmitting = true;

        const wasFirstMessage = isFirstMessage;

        if (wasFirstMessage) {
            if (welcomeMessage) welcomeMessage.classList.add('hide');
            stopTypingAnimation();
        }

        if (userMessage) {
            appendMessage('user', userMessage);
        }
        
        if (fileToSend) {
            displaySentFile(fileToSend);
        }

        chatInput.value = '';
        chatInput.style.height = 'auto';
        removeFilePreview(); 
        showTypingIndicator();
        try {
            const formData = new FormData();
            formData.append('message', userMessage);
            if (fileToSend) formData.append('file', fileToSend);
            if (currentSessionId) formData.append('sessionId', currentSessionId);

            const response = await fetch('/api/chat', { method: 'POST', body: formData });
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
            
            if (wasFirstMessage) {
                if (headerTitle) {
                    headerTitle.classList.add('in-conversation');
                }
                if (data.newTitle) {
                    currentChatTitle.textContent = data.newTitle;
                }
                loadSessionsList();
                isFirstMessage = false;
            }
            
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            appendMessage('ai', `<p>Maaf, terjadi kesalahan saat memproses permintaanmu. Coba lagi nanti ya.<br><small>Error: ${error.message}</small></p>`);
        } finally {
            isSubmitting = false;
        }
    });

    function appendMessage(sender, content) {
        if (!content) return;
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        
        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('message-content');
        if (sender === 'user') {
            contentWrapper.innerHTML = `<p>${content.replace(/\n/g, '<br>')}</p>`;
        } else {
            contentWrapper.innerHTML = content;
        }
    
        messageElement.appendChild(contentWrapper);
        chatBox.appendChild(messageElement);
        if (sender === 'ai') {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        
        if (sender === 'ai') {
            enhanceCodeBlocks(messageElement);
        }
    }

    function enhanceCodeBlocks(container) {
        const codeBlocks = container.querySelectorAll('pre > code[class*="language-"]');
        codeBlocks.forEach(codeElement => {
            const preElement = codeElement.parentElement;
            
            if (preElement.parentElement.classList.contains('code-block-container')) return;

            const codeContainer = document.createElement('div');
            codeContainer.className = 'code-block-container';

            const header = document.createElement('div');
            header.className 
            = 'code-block-header';

            const langLabel = document.createElement('span');
            langLabel.className = 'code-language';
            const langMatch = codeElement.className.match(/language-(\w+)/);
            langLabel.textContent = (langMatch && langMatch[1]) ? langMatch[1].toUpperCase() : 'CODE';

            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy';
      
            copyBtn.className = 'copy-btn';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(codeElement.innerText).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
                });
            });

            header.appendChild(langLabel);
            header.appendChild(copyBtn);
            preElement.parentNode.insertBefore(codeContainer, preElement);
            codeContainer.appendChild(header);
            codeContainer.appendChild(preElement);
            if (typeof Prism !== 'undefined') {
                Prism.highlightElement(codeElement);
            }
        });
    }
    
    function showTypingIndicator() {
        if (document.getElementById('typing-indicator')) return;
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typing-indicator';
        typingIndicator.classList.add('message', 'ai-message', 'typing-indicator');
        typingIndicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots-container">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                   </div>
                <p class="typing-text"></p>
            </div>`;
        chatBox.appendChild(typingIndicator);

        const typingTextElement = typingIndicator.querySelector('.typing-text');
        const possibleTexts = [
            "Berpikir...",
            "Mencari informasi...",
            "Menyusun jawaban...",
            "Mencari sumber..."
        ];
        let currentIndex = Math.floor(Math.random() * possibleTexts.length);
        typingTextElement.textContent = possibleTexts[currentIndex];

        clearInterval(typingInterval);
        typingInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % possibleTexts.length;
            typingTextElement.textContent = possibleTexts[currentIndex];
        }, 3000);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function hideTypingIndicator() {
        clearInterval(typingInterval);
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
        closeBtn.onclick = removeFilePreview;
        filePreviewContainer.appendChild(closeBtn);
    }
    
    function removeFilePreview() {
        selectedFile = null;
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        filePreviewContainer.innerHTML = '';
    }

    function displaySentFile(file) {
        if (file.type.startsWith('image/')) {
            const imageCard = document.createElement('div');
            imageCard.classList.add('message', 'user-message', 'image-card');
            imageCard.addEventListener('click', () => showImagePreview(file));
            const image = document.createElement('img');
            image.src = URL.createObjectURL(file);
            imageCard.appendChild(image);
            chatBox.appendChild(imageCard);
        } else {
            const fileCard = document.createElement('div');
            fileCard.classList.add('message', 'user-message', 'document-card');
            const fileExtension = file.name.split('.').pop().toLowerCase();
            fileCard.classList.add(`file-type-${fileExtension}`);
            const fileContent = document.createElement('div');
            fileContent.classList.add('file-content');
            const fileName = document.createElement('p');
            fileName.textContent = `${file.name}`;
            fileContent.appendChild(fileName);
            fileCard.appendChild(fileContent);
            chatBox.appendChild(fileCard);
        }
    }
    
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

    function markdownToHtml(md) {
        if (!md) return '';
        const processInlineMarkdown = (text) => text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/~~(.*?)~~/g, '<s>$1</s>').replace(/`(.*?)`/g, '<code>$1</code>');
        const escapeHtml = (unsafe) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        const blocks = md.split(/\n{2,}/);
        let html = '';

        for (const block of blocks) {
            if (!block.trim()) continue;
            if (block.startsWith('```') && block.endsWith('```')) {
                const lines = block.split('\n');
      
                const lang = lines[0].substring(3).trim();
                const code = lines.slice(1, -1).join('\n');
                html += `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
                continue;
            }
            const isList = block.match(/^\s*([\*\-+]|\d+\.)\s/);
     
            if (isList) {
                let listHtml = '';
                const lines = block.split('\n');
                const listType = lines[0].match(/^\s*\d+\./) ? 'ol' : 'ul';
                listHtml += `<${listType}>`;
            
                for (const line of lines) {
                    const itemContent = line.replace(/^\s*([\*\-+]|\d+\.)\s/, '');
                    listHtml += `<li>${processInlineMarkdown(itemContent)}</li>`;
                }
                listHtml += `</${listType}>`;
                html += listHtml;
                continue;
            }
            const paragraphContent = block.replace(/\n/g, '<br>');
            html += `<p>${processInlineMarkdown(paragraphContent)}</p>`;
        }
        return html.trim();
    }

    loadSessionsList();
});
