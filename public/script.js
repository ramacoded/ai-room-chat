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

    let selectedFiles = [];
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
                    const content = (msg.role === 'model' || msg.role === 'ai') ? markdownToHtml(msg.text) : msg.text;
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
        const newFiles = Array.from(e.target.files);
        if (selectedFiles.length + newFiles.length > 5) {
            alert('Anda hanya dapat mengupload maksimal 5 media.');
            fileInput.value = '';
            return;
        }
        selectedFiles.push(...newFiles);
        displayFilePreview();
        fileInput.value = '';
    });
    function displayFilePreview() {
        if (selectedFiles.length === 0) {
            filePreviewContainer.style.display = 'none';
            return;
        }
        filePreviewContainer.style.display = 'block';
        filePreviewContainer.innerHTML = '<div class="multi-preview-area"></div>';
        const previewArea = filePreviewContainer.querySelector('.multi-preview-area');

        selectedFiles.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'preview-item-image';
                previewItem.appendChild(img);
            } else {
                const fileIcon = document.createElement('div');
                fileIcon.className = 'preview-item-file';
                fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
                previewItem.appendChild(fileIcon);
            }

            const removeBtn = document.createElement('div');
            removeBtn.className = 'preview-item-remove';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => removeFile(index);
            previewItem.appendChild(removeBtn);

            previewArea.appendChild(previewItem);
        });
    }
    function removeFile(index) {
        selectedFiles.splice(index, 1);
        displayFilePreview();
    }
    function removeAllFilePreviews() {
        selectedFiles = [];
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        filePreviewContainer.innerHTML = '';
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const userMessage = chatInput.value.trim();
        const filesToSend = [...selectedFiles];

        if (!userMessage && filesToSend.length === 0) return;

        isSubmitting = true;
        const wasFirstMessage = isFirstMessage;

        if (wasFirstMessage) {
            if (welcomeMessage) welcomeMessage.classList.add('hide');
            stopTypingAnimation();
        }

        displaySentMedia(userMessage, filesToSend);

        chatInput.value = '';
        chatInput.style.height = 'auto';
        removeAllFilePreviews();
        showTypingIndicator();

        try {
            const formData = new FormData();
            formData.append('message', userMessage);
            filesToSend.forEach(file => {
                formData.append('files', file);
            });
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
                if (headerTitle) headerTitle.classList.add('in-conversation');
                if (data.newTitle) currentChatTitle.textContent = data.newTitle;
                loadSessionsList();
                isFirstMessage = false;
            }
            
        } catch (error) {
            console.error('Error:', error);
            hideTypingIndicator();
            appendMessage('ai', `<p>Maaf, terjadi kesalahan. Coba lagi nanti ya.<br><small>${error.message}</small></p>`);
        } finally {
            isSubmitting = false;
        }
    });

    function displaySentMedia(text, files) {
        const images = files.filter(f => f.type.startsWith('image/'));
        const otherFiles = files.filter(f => !f.type.startsWith('image/'));
        let lastElementAppended = null;

        if (images.length > 0) {
            const gridContainer = document.createElement('div');
            gridContainer.className = 'message user-message';
            
            const grid = document.createElement('div');
            grid.className = 'sent-media-grid';
            images.forEach(imgFile => {
                const item = document.createElement('div');
                item.className = 'sent-media-item';
                const img = document.createElement('img');
                img.src = URL.createObjectURL(imgFile);
                item.appendChild(img);
                item.addEventListener('click', () => showImagePreview(imgFile));
                grid.appendChild(item);
            });
            gridContainer.appendChild(grid);
            chatBox.appendChild(gridContainer);
            lastElementAppended = gridContainer;
        }

        if (otherFiles.length > 0) {
            otherFiles.forEach(file => {
                const fileMessageElement = document.createElement('div');
                fileMessageElement.className = 'message user-message';
                const fileItem = document.createElement('div');
                fileItem.className = 'sent-file-item';
                fileItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg><span>${file.name}</span>`;
                fileMessageElement.appendChild(fileItem);
                chatBox.appendChild(fileMessageElement);
                lastElementAppended = fileMessageElement;
            });
        }
        
        if (text) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message user-message';
            messageElement.innerHTML = `<div class="message-content"><p>${text}</p></div>`;
            chatBox.appendChild(messageElement);
            lastElementAppended = messageElement;
        }

        if (lastElementAppended) {
            lastElementAppended.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }
    
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
        if (sender === 'ai' || sender === 'model') {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        
        if (sender === 'ai' || sender === 'model') {
            enhanceCodeBlocks(messageElement);
        }
    }

    function showImagePreview(file) {
        const overlay = document.createElement('div');
        overlay.className = 'image-preview-overlay';
        const previewImg = document.createElement('img');
        previewImg.src = URL.createObjectURL(file);
        overlay.appendChild(previewImg);
        overlay.addEventListener('click', () => {
            overlay.remove();
        });
        document.body.appendChild(overlay);
    }

    function enhanceCodeBlocks(container) {
        const codeBlocks = container.querySelectorAll('pre > code[class*="language-"]');
        codeBlocks.forEach(codeElement => {
            const preElement = codeElement.parentElement;
            
            if (preElement.parentElement.classList.contains('code-block-container')) return;

            const codeContainer = document.createElement('div');
            codeContainer.className = 'code-block-container';

            const header = document.createElement('div');
            header.className = 'code-block-header';

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

    function markdownToHtml(md) {
        if (!md) return '';
        const processInlineMarkdown = (text) => {
            return text
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/~~(.*?)~~/g, '<s>$1</s>')
                .replace(/`(.*?)`/g, '<code>$1</code>');
        };

        const escapeHtml = (unsafe) => {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        let html = '';
        const lines = md.split('\n');
        let inList = null;
        let inCodeBlock = false;
        let codeBlockContent = '';
        let codeBlockLang = '';
        let inBlockquote = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    html += `<pre><code class="language-${codeBlockLang}">${escapeHtml(codeBlockContent.trim())}</code></pre>\n`;
                    inCodeBlock = false;
                    codeBlockContent = '';
                    codeBlockLang = '';
                } else {
                    if (inList) { html += `</${inList}>\n`; inList = null; }
                    if (inBlockquote) { html += `</blockquote>\n`; inBlockquote = false; }
                    inCodeBlock = true;
                    codeBlockLang = line.substring(3).trim();
                }
                continue;
            }
            if (inCodeBlock) {
                codeBlockContent += line + '\n';
                continue;
            }

            const closeOpenTags = () => {
                if (inList) { html += `</${inList}>\n`; inList = null; }
                if (inBlockquote) { html += `</blockquote>\n`; inBlockquote = false; }
            };
            if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|--')) {
                closeOpenTags();
                let tableHtml = '<table>\n';
                const headers = line.split('|').slice(1, -1).map(h => h.trim());
                tableHtml += '<thead>\n<tr>\n' + headers.map(h => `<th>${processInlineMarkdown(h)}</th>`).join('') + '</tr>\n</thead>\n';
                let j = i + 2;
                tableHtml += '<tbody>\n';
                while (j < lines.length && lines[j].includes('|')) {
                    const cells = lines[j].split('|').slice(1, -1).map(c => c.trim());
                    tableHtml += '<tr>' + cells.map(c => `<td>${processInlineMarkdown(c)}</td>`).join('') + '</tr>\n';
                    j++;
                }
                tableHtml += '</tbody>\n</table>\n';
                html += tableHtml;
                i = j - 1;
                continue;
            }
            
            if (line.match(/^(---|___|\*\*\*)$/)) {
                closeOpenTags();
                html += '<hr>\n';
                continue;
            }

            if (line.startsWith('>')) {
                if (!inBlockquote) {
                    if (inList) { html += `</${inList}>\n`; inList = null; }
                    html += '<blockquote>\n';
                    inBlockquote = true;
                }
                html += `<p>${processInlineMarkdown(line.substring(1).trim())}</p>\n`;
                continue;
            }
            if (inBlockquote && !line.startsWith('>')) {
                html += 'blockquote\n';
                inBlockquote = false;
            }

            if (line.startsWith('#')) {
                closeOpenTags();
                const level = line.match(/^#+/)[0].length;
                if (level <= 6) {
                    const content = line.substring(level).trim();
                    html += `<h${level}>${processInlineMarkdown(content)}</h${level}>\n`;
                    continue;
                }
            }

            const ulMatch = line.match(/^\s*[\*-]\s+(.*)/);
            const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
            if (ulMatch) {
                if (inList !== 'ul') {
                    if (inList) html += `</${inList}>\n`;
                    html += '<ul>\n';
                    inList = 'ul';
                }
                html += `  <li>${processInlineMarkdown(ulMatch[1])}</li>\n`;
                continue;
            } else if (olMatch) {
                if (inList !== 'ol') {
                    if (inList) html += `</${inList}>\n`;
                    html += '<ol>\n';
                    inList = 'ol';
                }
                html += `  <li>${processInlineMarkdown(olMatch[1])}</li>\n`;
                continue;
            }
            if (inList && !ulMatch && !olMatch) {
                html += `</${inList}>\n`;
                inList = null;
            }

            if (line.trim() !== '') {
                html += `<p>${processInlineMarkdown(line)}</p>\n`;
            }
        }

        if (inList) html += `</${inList}>\n`;
        if (inBlockquote) html += `</blockquote>\n`;
        if (inCodeBlock) html += `<pre><code class="language-${codeBlockLang}">${escapeHtml(codeBlockContent.trim())}</code></pre>\n`;

        return html.trim();
    }

    loadSessionsList();
});
