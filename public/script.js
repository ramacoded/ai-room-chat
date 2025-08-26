document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.querySelector('.main-container');

    const handleViewportHeight = () => {
        if (mainContainer) {
            mainContainer.style.height = `${window.innerHeight}px`;
        }
    };

    handleViewportHeight();
    window.addEventListener('resize', handleViewportHeight);

    let typingAnimationTimeout;
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
    
    chatInput.addEventListener('blur', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
            handleViewportHeight();
        }, 100);
    });

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

       
// File: public/script.js

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

        const response = await fetch('/api/chat', {
            method: 'POST',
            body: formData
        });

        hideTypingIndicator();

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server response was not ok: ${response.status} - ${errorText}`);
        }

        const newSessionId = response.headers.get('X-Session-Id');
        const newTitle = response.headers.get('X-New-Title');

        if (newSessionId && !currentSessionId) {
            currentSessionId = newSessionId;
        }
        if (wasFirstMessage) {
            if (headerTitle) headerTitle.classList.add('in-conversation');
            if (newTitle) currentChatTitle.textContent = newTitle;
            loadSessionsList();
            isFirstMessage = false;
        }

        // --- PERUBAHAN TOTAL LOGIKA STREAMING ---

        // 1. Buat elemen pesan AI dengan kontainer teks dan kursor
        const aiMessageElement = appendMessage('ai', '', true);
        const contentWrapper = aiMessageElement.querySelector('.message-content');
        contentWrapper.innerHTML = '<span class="ai-text-content"></span><span class="blinking-cursor">|</span>';
        const textContentSpan = contentWrapper.querySelector('.ai-text-content');
        const cursorSpan = contentWrapper.querySelector('.blinking-cursor');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponseText = '';

        while (true) {
            const {
                value,
                done
            } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataString = line.substring(6);
                    if (dataString === '[DONE]') {
                        // 3. Jika selesai, hapus kursor dan format final
                        cursorSpan.remove();
                        break;
                    }
                    try {
                        const data = JSON.parse(dataString);
                        if (data.text) {
                            // 2. Tambahkan teks yang masuk ke kontainer
                            fullResponseText += data.text;
                            textContentSpan.textContent += data.text; // Cukup tambahkan teks
                            aiMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                        if (data.error) {
                            throw new Error(data.error);
                        }
                    } catch (e) {
                        // Abaikan error parsing JSON
                    }
                }
            }
        }

        // 4. Setelah stream benar-benar selesai, render markdown
        contentWrapper.innerHTML = markdownToHtml(fullResponseText);
        enhanceCodeBlocks(contentWrapper);
        aiMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
        // --- INI BAGIAN YANG DIUBAH ---
        lastElementAppended.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

    
    function appendMessage(sender, content, returnElement = false) {
        if (!content && sender === 'ai' && !returnElement) return;

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
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        if (sender === 'ai' || sender === 'model') {
            enhanceCodeBlocks(messageElement);
        }

        if (returnElement) {
            return messageElement;
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
    
    function showTypingIndicator(files = []) {
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
    chatBox.scrollTop = chatBox.scrollHeight;

    const typingTextElement = typingIndicator.querySelector('.typing-text');

    // Kumpulan frasa yang lebih realistis dan terstruktur
    const phrases = {
        start: ["Menganalisis permintaan...", "Memproses input Anda..."],
        file: {
            image: ["Memindai visual...", "Mendeteksi objek pada gambar...", "Membaca gambar..."],
            other: ["Menganalisis konten file...", "Membaca dokumen terlampir..."]
        },
        thinking: ["Membuat kerangka jawaban...", "Menghubungkan informasi...", "Menyusun rencana respons..."],
        generating: ["Merangkai kalimat...", "Menulis draf...", "Memformat kode...", "Menambahkan detail..."],
        finalizing: ["Melakukan verifikasi akhir...", "Meninjau ulang jawaban..."]
    };

    // Fungsi untuk memilih frasa acak dari sebuah array
    const getRandomPhrase = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Alur animasi yang lebih realistis
    let sequenceStep = 0;
    const runSequence = () => {
        clearTimeout(typingAnimationTimeout);
        let currentPhrase = '';
        let nextStepDelay = 2000; // Jeda waktu default

        switch (sequenceStep) {
            case 0: // Tahap Awal
                currentPhrase = getRandomPhrase(phrases.start);
                break;

            case 1: // Tahap Analisis File (jika ada)
                if (files.length > 0) {
                    const isImage = files.some(f => f.type.startsWith('image/'));
                    currentPhrase = getRandomPhrase(isImage ? phrases.file.image : phrases.file.other);
                    nextStepDelay = 2500; // Beri waktu lebih untuk "analisis file"
                } else {
                    // Lewati tahap ini jika tidak ada file
                    sequenceStep++;
                    runSequence();
                    return;
                }
                break;

            case 2: // Tahap Berpikir
                currentPhrase = getRandomPhrase(phrases.thinking);
                break;
            
            case 3: // Tahap Menghasilkan (akan berulang)
                const generationPool = [...phrases.generating, ...phrases.finalizing];
                typingTextElement.textContent = getRandomPhrase(generationPool);
                
                // Mulai interval yang berulang untuk tahap ini
                clearInterval(typingInterval);
                typingInterval = setInterval(() => {
                    typingTextElement.textContent = getRandomPhrase(generationPool);
                }, 3000);
                return; // Hentikan sekuens setTimeout
        }

        typingTextElement.textContent = currentPhrase;
        sequenceStep++;
        typingAnimationTimeout = setTimeout(runSequence, nextStepDelay);
    };

    runSequence(); // Mulai sekuens animasi
}

function hideTypingIndicator() {
    // Hentikan semua timer animasi
    clearTimeout(typingAnimationTimeout);
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
        const blocks = md.split(/\n\s*\n/);
        for (const block of blocks) {
            if (!block.trim()) continue;

            if (block.startsWith('```') && block.endsWith('```')) {
                const lines = block.split('\n');
                const lang = lines[0].substring(3).trim();
                const code = lines.slice(1, -1).join('\n');
                html += `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
                continue;
            }

            if (block.startsWith('#')) {
                const level = block.match(/^#+/)[0].length;
                if (level <= 6) {
                    const content = block.substring(level).trim();
                    html += `<h${level}>${processInlineMarkdown(content)}</h${level}>`;
                    continue;
                }
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

            if (block.startsWith('>')) {
                const content = block.split('\n').map(line => line.substring(1).trim()).join('<br>');
                html += `<blockquote><p>${processInlineMarkdown(content)}</p></blockquote>`;
                continue;
            }

            const paragraphContent = block.replace(/\n/g, '<br>');
            html += `<p>${processInlineMarkdown(paragraphContent)}</p>`;
        }

        return html.trim();
    }

    loadSessionsList();
});



