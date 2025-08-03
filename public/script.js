document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const filePreviewContainer = document.getElementById('file-preview');

    let selectedFile = null;

    // Menyesuaikan tinggi textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });

    // Menampilkan dialog unggah file saat tombol diklik
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle saat file dipilih
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            displayFilePreview(file);
        }
    });

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = chatInput.value.trim();
        
        if (userMessage || selectedFile) {
            appendMessage('user', userMessage, selectedFile);
            chatInput.value = '';
            chatInput.style.height = 'auto'; // Reset height
            removeFile();
            showTypingIndicator();

            try {
                // Menggunakan FormData untuk mengirim teks dan file
                const formData = new FormData();
                formData.append('message', userMessage);
                if (selectedFile) {
                    formData.append('file', selectedFile);
                }

                const response = await fetch('/api/chat', {
                    method: 'POST',
                    body: formData, // Mengirim FormData, bukan JSON
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
    function appendMessage(sender, message, file = null) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        
        if (file) {
            const filePreview = document.createElement('div');
            filePreview.classList.add('message-file-preview');
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.style.maxWidth = '150px';
                img.style.borderRadius = '10px';
                filePreview.appendChild(img);
            } else {
                const fileName = document.createElement('p');
                fileName.textContent = file.name;
                filePreview.appendChild(fileName);
            }
            messageElement.appendChild(filePreview);
        }

        const content = document.createElement('div');
        content.classList.add('message-content');
        
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

        messageElement.appendChild(content);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Function untuk menampilkan pratinjau file di bawah input
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
    
    // Function untuk menghapus pratinjau file
    window.removeFile = function() {
        selectedFile = null;
        fileInput.value = ''; // Reset input file
        filePreviewContainer.style.display = 'none';
        filePreviewContainer.innerHTML = '';
    }

    // Function to show/hide typing indicator
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
