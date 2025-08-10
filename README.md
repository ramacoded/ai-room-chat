# Coreon AI 🔮

![Lisensi MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Framework](https://img.shields.io/badge/Framework-Node%20JS-green.svg)
![Platform](https://img.shields.io/badge/Platform-Vercel-black.svg)

**Coreon AI** adalah aplikasi web chat canggih yang didukung oleh Google Gemini. Aplikasi ini dirancang untuk memberikan pengalaman percakapan yang dinamis, interaktif, dan multi-modal, memungkinkan pengguna tidak hanya berinteraksi melalui teks, tetapi juga dengan gambar dan file.

---

### ✨ Demo Langsung

Anda dapat mencoba aplikasi ini secara langsung di: **[https://oreonai.vercel.app/](https://oreonai.vercel.app/)**

*(Catatan: URL ini diambil dari screenshot Anda, sesuaikan jika berbeda)*

### 📸 Tampilan Aplikasi

![Coreon AI](public/coreon.jpeg)

### 🚀 Fitur Utama

-   **💬 Percakapan AI Cerdas:** Ditenagai oleh model **Gemini 2.5 Flash** untuk respons yang cepat dan relevan.
-   **🖼️ Input Multi-modal:** Unggah hingga **5 media** sekaligus (gambar & file) untuk dianalisis oleh AI.
-   **🎨 Galeri Gambar Modern:** Media gambar yang dikirim ditampilkan dalam **slider horizontal (carousel)** dengan thumbnail persegi 1:1 yang rapi.
-   **👁️ Pratinjau Ukuran Penuh:** Klik pada thumbnail gambar untuk melihatnya dalam **ukuran penuh** dengan rasio aspek aslinya.
-   **💾 Manajemen Sesi & Riwayat:** Seluruh riwayat percakapan disimpan di **Supabase**, memungkinkan sesi dilanjutkan kapan saja.
-   **✍️ Judul Otomatis:** AI secara otomatis membuat judul yang relevan untuk setiap percakapan baru.
-   **⚙️ Kustomisasi Pengguna:**
    -   Pilihan **Tema** (Terang, Gelap, Sistem).
    -   Penyesuaian **Ukuran Teks** (Kecil, Normal, Besar).
-   **📱 Desain Responsif:** Tampilan yang adaptif untuk pengalaman optimal di desktop maupun perangkat mobile.

### 🛠️ Tumpukan Teknologi (Tech Stack)

-   **Frontend:**
    -   HTML5
    -   CSS3 (dengan Variabel CSS untuk Theming)
    -   Vanilla JavaScript (ES6+)
-   **Backend (Serverless):**
    -   Node.js
    -   Dijalankan pada platform seperti Vercel atau Netlify.
-   **Layanan & API:**
    -   **Google Gemini AI** (`gemini-2.5-flash`)
    -   **Supabase** (Database PostgreSQL)
-   **Library Pendukung:**
    -   `formidable` (untuk parsing file di backend)
    -   `moment-timezone` (untuk manajemen waktu di backend)

### 📂 Struktur Proyek

Struktur direktori proyek ini dirancang untuk kemudahan deployment di platform serverless modern:

| 💬 **Flexible Interaction** | Casual, open-minded, and responsive 24/7. |

---

## 🛠️ Tech Stack

- **Platform**: Web Interface / API-based integration  
- **Language**: JavaScript / Node.js / Python (varies per deployment)  
- **AI Models**: OpenAI, Gemini, or custom LLM integrations  
- **Media Processing**: FFmpeg, Whisper, Stable Diffusion (optional)
