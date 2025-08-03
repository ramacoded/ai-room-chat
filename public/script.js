// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const fileInput = document.getElementById('file-input');
    const filePreview = document.getElementById('file-preview');
    const welcomeMessage = document.getElementById('welcome-message');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const newSessionBtn = document.getElementById('new-session-btn');
    const sessionsList = document.getElementById('sessions-list');
    const currentChatTitle = document.getElementById('current-chat-title');
    const chatHistoryBtn = document.getElementById('chat-history-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadMenu = document.getElementById('upload-menu');
    const cameraBtn = document.getElementById('camera-btn');
    const galleryBtn = document.getElementById('gallery-btn');
    const fileBtn = document.getElementById('file-btn');
    const deletePopup = document.getElementById('delete-popup');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    let currentSessionId = localStorage.getItem('currentSessionId') || null;
    let fileToUpload = null;
    let sessionToDelete = null;

    // Inisialisasi
    const init = async () => {
        setupEventListeners();
        await loadSessions();
        if (currentSessionId) {
            await loadSession(currentSessionId);
        } else {
            welcomeMessage.innerHTML = `<p>Halo! Saya Noa, asisten AI Anda.</p>`;
            currentChatTitle.textContent = "Noa AI";
        }
    };

    const setupEventListeners = () => {
        chatInput.addEventListener('input', autoResizeTextarea);
        chatForm.addEventListener('submit', handleFormSubmit);
        openSidebarBtn.addEventListener('click', () => sidebar.classList.add('open'));
        closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('open'));
        newSessionBtn.addEventListener('click', startNewSession);
        chatHistoryBtn.addEventListener('click', toggleChatHistory);
        uploadBtn.addEventListener('click', toggleUploadMenu);
        fileInput.addEventListener('change', handleFileSelect);

        // Upload menu button listeners
        cameraBtn.addEventListener('click', () => fileInput.click()); // Placeholder, kamera tidak diimplementasikan
        galleryBtn.addEventListener('click', () => fileInput.click());
        fileBtn.addEventListener('click', () => fileInput.click());

        // Delete popup listeners
        cancelDeleteBtn.addEventListener('click', () => {
            deletePopup.style.display = 'none';
            sessionToDelete = null;
        });

        confirmDeleteBtn.addEventListener('click', async () => {
            if (sessionToDelete) {
                await deleteSession(sessionToDelete);
                deletePopup.style.display = 'none';
                sessionToDelete = null;
            }
        });

        // Event listener untuk menutup sidebar saat area lain diklik
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !openSidebarBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
            if (uploadMenu.classList.contains('show') && !uploadBtn.contains(e.target) && !uploadMenu.contains(e.target)) {
                uploadMenu.classList.remove('show');
            }
        });
    };

    const autoResizeTextarea = () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message === '' && !fileToUpload) return;

        displayMessage(message, 'user');
        chatInput.value = '';
        autoResizeTextarea();
        welcomeMessage.classList.add('hide');

        try {
            const formData = new FormData();
            formData.append('message', message);
            if (fileToUpload) {
                formData.append('file', fileToUpload);
                removeFile();
            }
            if (currentSessionId) {
                formData.append('sessionId', currentSessionId);
            }

            const typingIndicator = displayTypingIndicator();
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            removeTypingIndicator(typingIndicator);

            if (data.sessionId) {
                currentSessionId = data.sessionId;
                localStorage.setItem('currentSessionId', currentSessionId);
                await loadSessions();
                
                // Perbarui judul chat jika ada
                if (data.title) {
                    currentChatTitle.textContent = data.title;
                    const sessionItem = document.querySelector(`.session-list-item[data-session-id="${currentSessionId}"] .session-title-button`);
                    if (sessionItem) {
                        sessionItem.textContent = data.title;
                    }
                }
            }
            displayMessage(data.response, 'ai');

        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator();
            displayMessage('Maaf, terjadi kesalahan. Silakan coba lagi.', 'ai');
        }
    };

    const handleFileSelect = (e) => {
        fileToUpload = e.target.files[0];
        if (fileToUpload) {
            const reader = new FileReader();
            reader.onload = (e) => {
                filePreview.innerHTML = `
                    <span class="file-preview-close" onclick="removeFile()">✖</span>
                    <img src="${e.target.result}" alt="Preview" class="file-preview-image">
                    <p class="file-preview-info">${fileToUpload.name}</p>
                `;
                filePreview.style.display = 'flex';
            };
            reader.readAsDataURL(fileToUpload);
        }
        uploadMenu.classList.remove('show');
    };

    const removeFile = () => {
        fileToUpload = null;
        fileInput.value = null;
        filePreview.style.display = 'none';
        filePreview.innerHTML = '';
    };

    const displayMessage = (message, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        
        // Handle code blocks
        if (message.includes('```')) {
            const parts = message.split('```');
            contentElement.innerHTML = '';
            parts.forEach((part, index) => {
                if (index % 2 === 1) {
                    const codeBlock = document.createElement('pre');
                    const codeLang = part.substring(0, part.indexOf('\n')).trim();
                    const codeContent = part.substring(part.indexOf('\n') + 1);
                    codeBlock.classList.add(`language-${codeLang}`);
                    codeBlock.innerHTML = `<code>${codeContent}</code>`;
                    contentElement.appendChild(codeBlock);
                } else {
                    const textContent = document.createElement('p');
                    textContent.textContent = part.trim();
                    if (textContent.textContent) {
                        contentElement.appendChild(textContent);
                    }
                }
            });
        } else {
            contentElement.textContent = message;
        }

        messageElement.appendChild(contentElement);
        chatBox.appendChild(messageElement);
        Prism.highlightAll();
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const displayTypingIndicator = () => {
        const typingIndicatorElement = document.createElement('div');
        typingIndicatorElement.classList.add('message', 'ai-message', 'typing-indicator');
        typingIndicatorElement.innerHTML = `
            <div class="message-content">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatBox.appendChild(typingIndicatorElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        return typingIndicatorElement;
    };

    const removeTypingIndicator = (indicatorElement) => {
        if (indicatorElement) {
            indicatorElement.remove();
        } else {
            const currentIndicator = document.querySelector('.typing-indicator');
            if (currentIndicator) {
                currentIndicator.remove();
            }
        }
    };

    const loadSessions = async () => {
        try {
            const response = await fetch('/api/sessions');
            const sessions = await response.json();
            sessionsList.innerHTML = ''; // Kosongkan daftar sesi sebelumnya

            if (sessions.length === 0) {
                sessionsList.innerHTML = `<li class="no-sessions">Belum ada riwayat chat.</li>`;
                return;
            }

            sessions.forEach(session => {
                const li = document.createElement('li');
                li.classList.add('session-list-item');
                li.setAttribute('data-session-id', session.id);
                li.innerHTML = `
                    <button class="session-title-button">${session.title}</button>
                    <div class="session-actions">
                        <span class="separator"></span>
                        <button class="delete-session-btn">✖</button>
                    </div>
                `;
                sessionsList.appendChild(li);

                li.querySelector('.session-title-button').addEventListener('click', async () => {
                    currentSessionId = session.id;
                    localStorage.setItem('currentSessionId', currentSessionId);
                    await loadSession(currentSessionId);
                    sidebar.classList.remove('open');
                });

                li.querySelector('.delete-session-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); // Mencegah klik menyebar ke tombol judul
                    sessionToDelete = session.id;
                    deletePopup.style.display = 'flex';
                });
            });
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    const loadSession = async (sessionId) => {
        try {
            chatBox.innerHTML = '';
            welcomeMessage.classList.add('hide');

            const response = await fetch(`/api/sessions/${sessionId}`);
            const data = await response.json();
            
            if (data.history) {
                data.history.forEach(item => {
                    displayMessage(item.parts, item.role);
                });
            }
            if (data.title) {
                currentChatTitle.textContent = data.title;
            }
        } catch (error) {
            console.error('Error loading session:', error);
            chatBox.innerHTML = '<p>Gagal memuat sesi.</p>';
        }
    };

    const startNewSession = () => {
        currentSessionId = null;
        localStorage.removeItem('currentSessionId');
        chatBox.innerHTML = '';
        welcomeMessage.classList.remove('hide');
        welcomeMessage.innerHTML = `<p>Halo! Saya Noa, asisten AI Anda.</p>`;
        currentChatTitle.textContent = "Noa AI";
        sidebar.classList.remove('open');
        removeFile();
    };

    const deleteSession = async (sessionId) => {
        try {
            await fetch(`/api/chat?sessionId=${sessionId}`, {
                method: 'DELETE'
            });
            
            // Jika sesi yang dihapus adalah sesi aktif
            if (currentSessionId === sessionId) {
                startNewSession();
            }
            await loadSessions();
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    const toggleChatHistory = () => {
        sessionsList.classList.toggle('show');
        const caretIcon = chatHistoryBtn.querySelector('.caret-icon');
        if (sessionsList.classList.contains('show')) {
            caretIcon.style.transform = 'rotate(90deg)';
        } else {
            caretIcon.style.transform = 'rotate(0deg)';
        }
    };

    const toggleUploadMenu = () => {
        uploadMenu.classList.toggle('show');
    };

    window.removeFile = removeFile; // Jadikan fungsi bisa diakses secara global

    init();
});
