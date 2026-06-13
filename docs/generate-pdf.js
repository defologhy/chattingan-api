import PDFDocument from "pdfkit";
import { createWriteStream, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const doc = new PDFDocument({
  size: "A4",
  margin: 50,
  info: {
    Title: "Dokumentasi Sistem Chattingan",
    Author: "Chattingan Team",
    Subject: "System Flow Documentation",
  },
});

const output = createWriteStream(join(__dirname, "system-flow.pdf"));
doc.pipe(output);

// ===================== Color Constants =====================
const colors = {
  primary: "#1677ff",
  dark: "#1a1a2e",
  text: "#333333",
  muted: "#666666",
  border: "#e0e0e0",
  codeBg: "#f5f5f5",
  tableHeader: "#1677ff",
  tableBorder: "#d9d9d9",
};

// ===================== Helper Functions =====================
function addHeader(text, level) {
  const sizes = { 1: 24, 2: 18, 3: 14, 4: 12 };
  const size = sizes[level] || 12;
  const y = doc.y;

  if (level === 1) {
    doc.moveTo(50, y).lineTo(545, y).lineWidth(2).stroke(colors.primary);
    doc.moveDown(0.5);
  }

  doc.font("Helvetica-Bold").fontSize(size).fillColor(colors.dark).text(text, { underline: false });
  doc.moveDown(level === 1 ? 1 : 0.5);
}

function addBody(text) {
  doc.font("Helvetica").fontSize(10).fillColor(colors.text).text(text, { align: "justify", lineGap: 4 });
  doc.moveDown(0.3);
}

function addBullet(text, indent = 20) {
  doc.font("Helvetica").fontSize(10).fillColor(colors.text);
  doc.text(`  \u2022  ${text}`, { indent, lineGap: 3 });
}

function addCode(code) {
  const lines = code.split("\n");
  const lineHeight = 14;
  const padding = 8;
  const codeWidth = 495;
  const codeHeight = lines.length * lineHeight + padding * 2;

  // Check if we need a new page
  if (doc.y + codeHeight > 750) {
    doc.addPage();
  }

  const startX = 50;
  const startY = doc.y;

  doc.roundedRect(startX, startY, codeWidth, codeHeight, 4).fill(colors.codeBg);

  doc.font("Courier").fontSize(8).fillColor(colors.text);
  lines.forEach((line, i) => {
    doc.text(line, startX + padding, startY + padding + i * lineHeight, { width: codeWidth - padding * 2 });
  });

  doc.y = startY + codeHeight + 10;
}

function addTable(headers, rows) {
  const colWidth = 495 / headers.length;
  const rowHeight = 22;
  const startX = 50;
  const startY = doc.y;

  // Check page space
  const tableHeight = (rows.length + 1) * rowHeight + 20;
  if (startY + tableHeight > 750) {
    doc.addPage();
  }

  let currentY = doc.y;

  // Header row
  doc.roundedRect(startX, currentY, 495, rowHeight, 4).fill(colors.tableHeader);
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
  headers.forEach((h, i) => {
    doc.text(h, startX + i * colWidth + 6, currentY + 5, { width: colWidth - 12 });
  });

  currentY += rowHeight;

  // Data rows
  doc.font("Helvetica").fontSize(9).fillColor(colors.text);
  rows.forEach((row, ri) => {
    const bgColor = ri % 2 === 0 ? "#ffffff" : "#fafafa";
    doc.rect(startX, currentY, 495, rowHeight).fill(bgColor);
    doc.rect(startX, currentY, 495, rowHeight).stroke(colors.tableBorder);
    row.forEach((cell, ci) => {
      doc.fillColor(colors.text).text(cell, startX + ci * colWidth + 6, currentY + 5, { width: colWidth - 12 });
    });
    currentY += rowHeight;
  });

  doc.y = currentY + 10;
}

function addHR() {
  const y = doc.y;
  doc.moveTo(50, y).lineTo(545, y).lineWidth(1).stroke(colors.border);
  doc.moveDown(0.5);
}

function addPageBreak() {
  doc.addPage();
}

// ===================== COVER PAGE =====================
// Background
doc.rect(0, 0, 595.28, 841.89).fill("#1a1a2e");

doc.rect(0, 350, 595.28, 4).fill(colors.primary);
doc.rect(0, 360, 595.28, 140).fill("#16213e");

// Title
doc.font("Helvetica-Bold").fontSize(36).fillColor("#ffffff").text("Dokumentasi Sistem", 50, 200, { align: "center" });
doc.font("Helvetica-Bold").fontSize(36).fillColor(colors.primary).text("Chattingan", 50, 245, { align: "center" });

// Subtitle
doc.font("Helvetica").fontSize(14).fillColor("#a0a0a0").text("System Flow & Architecture Documentation", 50, 310, { align: "center" });

// Info box
doc.font("Helvetica").fontSize(11).fillColor("#cccccc");
doc.text("Versi: 1.0", 50, 420, { align: "center" });
doc.text("Tanggal: " + new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }), 50, 440, { align: "center" });
doc.text("Platform: Web (Next.js + Express + Socket.IO + MySQL)", 50, 460, { align: "center" });

// Footer
doc.font("Helvetica").fontSize(9).fillColor("#666666").text("Confidential - Chattingan Project", 50, 780, { align: "center" });

// ===================== TABLE OF CONTENTS =====================
doc.addPage();
addHR();
addHeader("Daftar Isi", 1);

const toc = [
  { page: 3, title: "1. Arsitektur Sistem" },
  { page: 3, title: "   1.1 High-Level Architecture" },
  { page: 4, title: "   1.2 Struktur Folder Frontend" },
  { page: 5, title: "   1.3 Struktur Folder Backend" },
  { page: 6, title: "2. Alur Data" },
  { page: 6, title: "   2.1 Alur Request (Proxy Pattern)" },
  { page: 7, title: "   2.2 Alur Autentikasi" },
  { page: 9, title: "3. Real-time Chat Flow (WebSocket)" },
  { page: 9, title: "   3.1 Koneksi WebSocket" },
  { page: 10, title: "   3.2 Kirim & Terima Pesan" },
  { page: 11, title: "4. Database Schema" },
  { page: 12, title: "5. Detail Teknis" },
  { page: 12, title: "   5.1 Authentication Strategy" },
  { page: 12, title: "   5.2 Error Handling Flow" },
  { page: 13, title: "   5.3 Environment Variables" },
  { page: 13, title: "6. Alur Navigasi Halaman" },
  { page: 14, title: "7. Alur Inisialisasi Aplikasi" },
  { page: 15, title: "8. Format Response API" },
  { page: 16, title: "9. Flow Diagram (Textual)" },
];

toc.forEach((item) => {
  doc.font(item.title.startsWith("   ") ? "Helvetica" : "Helvetica-Bold").fontSize(10).fillColor(colors.text);
  doc.text(`${item.title.padEnd(50, ".")} ${item.page}`, 50, doc.y, { width: 495 });
  doc.moveDown(0.3);
});

// ===================== 1. ARSITEKTUR SISTEM =====================
doc.addPage();
addHeader("1. Arsitektur Sistem", 1);

addHeader("1.1 High-Level Architecture", 2);
addBody("Sistem Chattingan menggunakan arsitektur Proxy Pattern, di mana browser tidak langsung terhubung ke Backend API. Semua request melewati Next.js API Routes yang bertindak sebagai proxy layer.");

addCode(`
+----------+     +-----------+     +----------------+     +----------+
| Browser  | --> | Next.js   | --> | Server-Side    | --> | Express  |
| (React)  |     | Pages     |     | Controllers    |     | API      |
+----------+     +-----------+     +----------------+     +----------+
      |                                                       |
      |  WebSocket (Socket.IO)                                |
      +-------------------------------------------------------+
`);

addBody("Komponen utama sistem:");
addBullet("Frontend (FE): Next.js Pages Router + React + Ant Design");
addBullet("Backend (BE): Node.js + Express + Socket.IO + Sequelize ORM");
addBullet("Database: MySQL (localhost)");
addBullet("Real-time: Socket.IO (WebSocket dengan JWT auth)");

addPageBreak();
addHeader("1.2 Struktur Folder Frontend", 2);

addCode(`
chattingan/
  pages/
    _app.js              # App wrapper (AuthProvider, ChatProvider)
    _document.js         # Custom Document
    index.js             # Halaman daftar chat (home)
    login.js             # Halaman login
    register.js          # Halaman registrasi
    chat/[id].js         # Halaman chat room
    api/
      auth/
        login.js         # Proxy login ke BE
        register.js      # Proxy register ke BE
        me.js            # Proxy get current user
      messages/
        users.js         # Proxy get daftar user
        [userId].js      # Proxy get/send messages
  src/
    contexts/
      AuthContext.js     # Auth state (useReducer)
      ChatContext.js     # Chat state (useReducer)
    controllers/
      auth/
        login.js         # Logic server-side login
        register.js      # Logic server-side register
        me.js            # Logic server-side get user
      messages/
        get-users.js     # Logic get daftar user
        get-messages.js  # Logic get riwayat chat
    lib/
      api.js             # Axios instance
      socket.js          # Socket.IO client singleton
    components/
      commons/layouts/
        MainLayout.js    # Layout utama
        MainLayout.module.css
    configurations/
      index.js           # Konfigurasi environment
`);

addPageBreak();
addHeader("1.3 Struktur Folder Backend", 2);

addCode(`
chattingan-api/
  src/
    chattingan.js            # Entry point + WebSocket server + DB sync
    app.js                   # Express app setup (CORS, parser, routes)
    configurations/
      logger.js              # Winston logger
    databases/
      connections/
        sequelize.js         # Koneksi Sequelize ke MySQL
      models/
        users.js             # Model User (Sequelize)
        messages.js          # Model Message (Sequelize)
    middlewares/
      auth.js                # JWT authentication middleware
    routes/
      v1/
        auth.js              # Route: register, login, me, logout
        messages.js          # Route: get users, get messages
    controllers/
      v1/
        auth/
          register.js        # Registrasi user baru
          login.js           # Login + generate JWT
          me.js              # Get data user saat ini
          logout.js          # Hapus cookie/session
        messages/
          get-users.js       # Daftar user (kecuali diri sendiri)
          get-messages.js    # Riwayat chat antara 2 user
      functions/
        error-handlers.js    # Centralized error handler
`);

// ===================== 2. ALUR DATA =====================
doc.addPage();
addHeader("2. Alur Data", 1);

addHeader("2.1 Alur Request (Proxy Pattern)", 2);
addBody("Setiap request dari browser melalui 4 lapisan sebelum mencapai Backend API:");

addCode(`
Browser        Next.js API Route       Server Controller        Backend API
--------       -----------------       ----------------        -----------
   |                 |                       |                     |
   | 1. GET /api     |                       |                     |
   |---------------->|                       |                     |
   |                 | 2. Validasi JWT       |                     |
   |                 | (authorization.js)    |                     |
   |                 |-----------------------|                     |
   |                 |                       |                     |
   |                 | 3. Panggil controller |                     |
   |                 |---------------------->|                     |
   |                 |                       | 4. Axios request    |
   |                 |                       |-------------------->|
   |                 |                       |                     |
   |                 |                       | 5. Response JSON    |
   |                 |                       |<--------------------|
   |                 |                       |                     |
   |                 | 6. Forward response   |                     |
   |                 |<----------------------|                     |
   | 7. Response     |                       |                     |
   |<----------------|                       |                     |
`);

addBody("Keuntungan Proxy Pattern:");
addBullet("Keamanan: Token JWT tidak terekspos ke browser");
addBullet("Validasi: Semua request terautentikasi sebelum mencapai BE");
addBullet("Logging: Centralized logging di API Route");
addBullet("Flexibility: Bisa transform response sebelum dikirim ke browser");

addPageBreak();
addHeader("2.2 Alur Autentikasi", 2);

addHeader("Registrasi User", 3);
addBody("User mendaftar dengan nama, nomor telepon, dan password. Backend memproses registrasi dan langsung login.");

addCode(`
Browser              API Route                  Controller           Backend API
-------              -----------------          ----------           -----------
  | POST name,       |                          |                     |
  | phone, password  |                          |                     |
  |----------------->|                          |                     |
  |                  | panggil controller       |                     |
  |                  |------------------------->|                     |
  |                  |                          | POST /auth/register |
  |                  |                          |-------------------->|
  |                  |                          |                     |
  |                  |                          |- Hash password      |
  |                  |                          |- Simpan ke DB       |
  |                  |                          |- Generate JWT       |
  |                  |                          |                     |
  |                  |                          |<--------------------|
  |                  |                          | { token, user }     |
  |                  | set cookie token         |                     |
  |                  |<-------------------------|                     |
  | redirect /       |                          |                     |
  |<-----------------|                          |                     |
`);

addHeader("Login User", 3);
addBody("User login dengan nomor telepon dan password. Backend memvalidasi dan mengembalikan JWT token.");

addCode(`
Browser              API Route                  Controller           Backend API
-------              -----------------          ----------           -----------
  | POST phone,      |                          |                     |
  | password         |                          |                     |
  |----------------->|                          |                     |
  |                  | panggil controller       |                     |
  |                  |------------------------->|                     |
  |                  |                          | POST /auth/login    |
  |                  |                          |-------------------->|
  |                  |                          |                     |
  |                  |                          |- Cari user by phone  |
  |                  |                          |- Compare password   |
  |                  |                          |- Generate JWT       |
  |                  |                          |                     |
  |                  |                          |<--------------------|
  |                  |                          | { token, user }     |
  |                  | set cookie token         |                     |
  |                  |<-------------------------|                     |
  | redirect /       |                          |                     |
  |<-----------------|                          |                     |
`);

// ===================== 3. REAL-TIME CHAT FLOW =====================
doc.addPage();
addHeader("3. Real-time Chat Flow (WebSocket)", 1);

addHeader("3.1 Koneksi WebSocket", 2);
addBody("Saat user login dan masuk ke halaman chat, FE melakukan koneksi WebSocket ke BE dengan menyertakan JWT token sebagai autentikasi.");

addCode(`
  Browser (FE)                    Socket.IO Server (BE)
  -------------                   ----------------------
       |                                |
       | 1. connect(token)              |
       |------------------------------->|
       |                                |
       | 2. Verifikasi JWT              |
       |                                |
       | 3. Join room "user:{userId}"   |
       |                                |
       | 4. Broadcast online users      |
       |<-------------------------------|
       |                                |
       | 5. Koneksi siap                |
`);

addBody("Event Socket.IO yang digunakan:");

addTable(
  ["Event", "Arah", "Deskripsi"],
  [
    ["connect", "Client -> Server", "Koneksi WebSocket dengan JWT"],
    ["new_message", "Server -> Client", "Pesan baru diterima"],
    ["online_users", "Server -> Client", "Daftar user online diperbarui"],
    ["disconnect", "Client -> Server", "User keluar / koneksi putus"],
  ]
);

addPageBreak();
addHeader("3.2 Kirim & Terima Pesan", 2);
addBody("Flow pengiriman pesan secara real-time antara dua user:");

addCode(`
User A           API Route          Controller          BE + Socket       User B
-------          ----------         ----------          -----------       -------
  | POST msg     |                  |                   |                 |
  |-------------->|                  |                   |                 |
  |               | panggil          |                   |                 |
  |               | controller       |                   |                 |
  |               |----------------->|                   |                 |
  |               |                  | POST /messages    |                 |
  |               |                  |------------------>|                 |
  |               |                  |                   |                 |
  |               |                  |                   |- Save to DB     |
  |               |                  |                   |                 |
  |               |                  |                   | emit            |
  |               |                  |                   | "new_message"   |
  |               |                  |                   |---------------->|
  |               |                  |                   |                 |
  |               |  Response OK     |                   |  Receive        |
  |               |<-----------------|                   |  real-time      |
  |  UI Updated   |                  |                   |                 |
  |<--------------|                  |                   |                 |
`);

addBody("Tahapan pengiriman pesan:");
addBullet("User A mengetik pesan dan menekan Enter / Tombol Kirim");
addBullet("FE mengirim POST request ke API Route /api/messages/[userId]");
addBullet("API Route memvalidasi JWT dan memanggil controller");
addBullet("Controller melakukan POST ke Backend API dengan Axios");
addBullet("Backend menyimpan pesan ke database MySQL");
addBullet("Backend mengirim event 'new_message' via Socket.IO ke User B");
addBullet("User B menerima pesan secara real-time tanpa refresh");
addBullet("FE User A juga memperbarui UI dengan pesan yang baru dikirim");

// ===================== 4. DATABASE SCHEMA =====================
doc.addPage();
addHeader("4. Database Schema", 1);

addBody("Sistem menggunakan dua tabel utama: users dan messages.");

addHeader("Table: users", 3);
addTable(
  ["Column", "Type", "Description"],
  [
    ["id", "INT (PK, AUTO_INCREMENT)", "Primary key"],
    ["name", "VARCHAR(255)", "Nama lengkap user"],
    ["phone", "VARCHAR(20) (UNIQUE)", "Nomor telepon (login ID)"],
    ["password", "VARCHAR(255)", "Password (bcrypt hash)"],
    ["created_at", "DATETIME", "Waktu dibuat"],
    ["updated_at", "DATETIME", "Waktu diupdate"],
  ]
);

doc.moveDown(1);
addHeader("Table: messages", 3);
addTable(
  ["Column", "Type", "Description"],
  [
    ["id", "INT (PK, AUTO_INCREMENT)", "Primary key"],
    ["sender_id", "INT (FK -> users.id)", "Pengirim pesan"],
    ["receiver_id", "INT (FK -> users.id)", "Penerima pesan"],
    ["message", "TEXT", "Isi pesan"],
    ["created_at", "DATETIME", "Waktu dikirim"],
    ["updated_at", "DATETIME", "Waktu diupdate"],
  ]
);

doc.moveDown(1);
addHeader("Entity Relationship", 3);
addBody("Relasi antara users dan messages adalah one-to-many: satu user dapat mengirim banyak pesan, dan satu user dapat menerima banyak pesan.");

addCode(`
+-----------------+       +---------------------+
|     users       |       |     messages        |
+-----------------+       +---------------------+
| id (PK)         |<------| sender_id           |
| name            |       | receiver_id         |
| phone (UNIQUE)  |       | message (TEXT)      |
| password (hash) |       | created_at          |
| created_at      |       | updated_at          |
| updated_at      |       +---------------------+
+-----------------+            |       ^
                               |       |
                               +-------+
                             (FK -> users.id)
`);

// ===================== 5. DETAIL TEKNIS =====================
doc.addPage();
addHeader("5. Detail Teknis", 1);

addHeader("5.1 Authentication Strategy", 2);
addBody("Sistem menggunakan JWT (JSON Web Token) yang disimpan di cookie HTTP untuk autentikasi.");
addBullet("JWT token dibuat saat login/register sukses");
addBullet("Token disimpan di cookie (bukan localStorage) untuk keamanan lebih");
addBullet("Setiap API Route memvalidasi cookie via authorization.js middleware");
addBullet("Jika token invalid/expired, return 401 Unauthorized");
addBullet("Logout: cookie dihapus dari response");
addBullet("JWT Secret: chattingan_secret_key_2024 (dari environment variable)");

doc.moveDown(0.5);
addHeader("5.2 Error Handling Flow", 2);
addBody("Error handling terpusat di error-handlers.js yang menangani berbagai jenis error:");

addCode(`
Controller Logic
       |
       |--- try: execute Axios request
       |       |
       |       |--- success: return response 200
       |       |
       |       |--- error: throw to error handler
       |               |
       |               |--- ECONNREFUSED
       |               |     -> "Service Unavailable"
       |               |     -> Log warning
       |               |
       |               |--- error.response exists
       |               |     -> Forward error dari internal service
       |               |     -> Include status_code & message
       |               |
       |               |--- Unknown error
       |                     -> Generic error message
       |                     -> Log full error
       |
       |--- return response dengan format standar
`);

addPageBreak();
addHeader("5.3 Environment Variables", 2);

addHeader("Frontend (.env.local)", 3);
addTable(
  ["Variable", "Value", "Description"],
  [
    ["NEXT_PUBLIC_API_URL", "http://localhost:3001", "Base URL Backend API"],
    ["NEXT_PUBLIC_SOCKET_URL", "http://localhost:3001", "URL Socket.IO server"],
  ]
);

doc.moveDown(1);
addHeader("Backend (.env)", 3);
addTable(
  ["Variable", "Value", "Description"],
  [
    ["PORT", "3001", "Port Express server"],
    ["DB_HOST", "localhost", "Host MySQL"],
    ["DB_USER", "root", "User MySQL"],
    ["DB_PASSWORD", "(kosong)", "Password MySQL"],
    ["DB_NAME", "chattingan", "Nama database"],
    ["JWT_SECRET", "chattingan_secret_key_2024", "Secret key JWT"],
    ["APP_BASE_URL", "http://localhost:3001", "Base URL backend"],
    ["TIMEZONE", "Asia/Jakarta", "Timezone default"],
  ]
);

doc.moveDown(1);
addHeader("Port yang Digunakan", 2);
addTable(
  ["Service", "Port"],
  [
    ["Frontend (Next.js)", "3000"],
    ["Backend (Express)", "3001"],
    ["Database (MySQL)", "3306"],
  ]
);

// ===================== 6. ALUR NAVIGASI =====================
doc.addPage();
addHeader("6. Alur Navigasi Halaman", 1);

addBody("Berikut adalah alur navigasi antar halaman dalam aplikasi:");

addCode(`
/register              /login               / (Home)
   |                      |                    |
   |--- Register -------->|                    |
   |                      |--- Login --------->|
   |                      |                    |
   |                      |                    |--- Klik kontak ----> /chat/[id]
   |                      |                    |                       |
   |                      |                    |                       |--- Kirim pesan
   |                      |                    |                       |--- Terima pesan
   |                      |                    |                       |       (realtime)
   |                      |                    |                       |
   |                      |                    |<--- Back (panah) ----|
   |                      |                    |
   |                      |<--- Logout --------|
   |                      |
   |                      |--- (redirect jika
   |                      |     belum login)
   |                      |
`);

addBody("Penjelasan tiap halaman:");
addBullet("/register: Form registrasi user baru (name, phone, password)");
addBullet("/login: Form login (phone, password) dengan redirect ke halaman utama");
addBullet("/ (Home): Daftar kontak yang bisa di-chat, dengan status online");
addBullet("/chat/[id]: Room chat 2 arah dengan real-time messaging");

// ===================== 7. ALUR INISIALISASI =====================
doc.addPage();
addHeader("7. Alur Inisialisasi Aplikasi", 1);

addHeader("7.1 Frontend (_app.js)", 2);
addBody("Urutan inisialisasi saat aplikasi frontend dijalankan:");

addCode(`
1. AuthProvider (React Context)
   |-- state: { user, loading }
   |-- useEffect on mount:
        - checkAuth() -> GET /api/auth/me
        - Jika valid: set user data
        - Jika tidak: set loading=false (redirect ke /login)

2. ChatProvider (React Context)
   |-- state: { users, messages, onlineUsers }
   |-- useEffect ketika user tersedia:
        - initSocket() -> konek WebSocket ke BE
        - fetchUsers() -> GET /api/messages/users
        - Listen event "online_users" dari Socket.IO

3. ConfigProvider (Ant Design)
   |-- theme: colorPrimary=#1677ff, borderRadius=8

4. MainLayout (Wrapper)
   |-- div container dengan styling global
   |-- Render Component sesuai route
`);

addPageBreak();
addHeader("7.2 Backend (chattingan.js)", 2);
addBody("Urutan inisialisasi saat aplikasi backend dijalankan:");

addCode(`
1. Load environment variables (.env)
   |-- dotenv.config()

2. Inisialisasi Express App (app.js)
   |-- CORS: origin=http://localhost:3000 (FE)
   |-- JSON body parser
   |-- Cookie parser
   |-- Morgan HTTP logger
   |-- Route mounting:
        /api/v1/auth     -> routes/v1/auth.js
        /api/v1/messages -> routes/v1/messages.js

3. Koneksi Database (Sequelize)
   |-- MySQL connection ke localhost
   |-- Test koneksi via .authenticate()
   |-- Sync models:
        - users table (create if not exists)
        - messages table (create if not exists)

4. WebSocket Server (Socket.IO)
   |-- Attach ke HTTP server
   |-- CORS: origin=http://localhost:3000
   |-- Middleware: JWT authentication
   |-- Event handlers:
        - connection:
            * Extract user dari JWT
            * Join room "user:{userId}"
            * Broadcast daftar online users
        - disconnect:
            * Broadcast daftar online users (updated)

5. Start HTTP Server
   |-- Listen on port 3001
   |-- Log: "Server running on port 3001"
`);

// ===================== 8. FORMAT RESPONSE =====================
doc.addPage();
addHeader("8. Format Response API", 1);

addBody("Semua response API menggunakan format standar JSON.");

addHeader("Response Sukses", 3);
addCode(`
{
  "status_code": 200,
  "data": {
    "id": 1,
    "name": "John Doe",
    "phone": "08123456789"
  }
}
`);

addHeader("Response Error", 3);
addCode(`
{
  "status_code": 400,
  "timestamp": "2024-01-01 12:00:00.000",
  "error_title": "Validasi Gagal",
  "error_message": "Nomor telepon sudah terdaftar",
  "path": "http://localhost:3001/api/v1/auth/register"
}
`);

addHeader("Status Code yang Digunakan", 2);
addTable(
  ["Status Code", "Description"],
  [
    ["200", "OK - Request berhasil"],
    ["201", "Created - Resource berhasil dibuat"],
    ["400", "Bad Request - Input tidak valid"],
    ["401", "Unauthorized - Token tidak valid/kadaluarsa"],
    ["404", "Not Found - Resource tidak ditemukan"],
    ["405", "Method Not Allowed - HTTP method tidak sesuai"],
    ["500", "Internal Server Error - Error sistem"],
  ]
);

// ===================== 9. FLOW DIAGRAM =====================
doc.addPage();
addHeader("9. Flow Diagram (Textual)", 1);

addBody("Berikut ringkasan flow untuk setiap skenario utama dalam bentuk diagram tekstual:");

addHeader("Registrasi", 3);
addCode(`
[REGISTRASI]
  Browser -> POST /api/auth/register (name, phone, password)
         -> [BE] Validasi input
         -> [BE] Hash password (bcrypt)
         -> [BE] Simpan user ke database
         -> [BE] Generate JWT token
         -> [FE] Set cookie + redirect ke /
`);

doc.moveDown(1);
addHeader("Login", 3);
addCode(`
[LOGIN]
  Browser -> POST /api/auth/login (phone, password)
         -> [BE] Cari user by phone
         -> [BE] Verifikasi password (bcrypt.compare)
         -> [BE] Generate JWT token
         -> [FE] Set cookie + redirect ke /
`);

doc.moveDown(1);
addHeader("Chat 2 Arah", 3);
addCode(`
[CHAT 2 ARAH]
  User A -> Klik User B di daftar chat
         -> GET /api/messages/[userId] (ambil riwayat)
         -> Tampilkan pesan-pesan sebelumnya
         -> Ketik pesan + Enter
         -> POST /api/messages/[userId] (message)
         -> [BE] Simpan ke database
         -> [BE] Emit "new_message" ke User B via Socket.IO
         -> User B langsung lihat pesan (real-time)
`);

doc.moveDown(1);
addHeader("Logout", 3);
addCode(`
[LOGOUT]
  User -> Klik tombol "Keluar"
       -> GET /api/auth/logout
       -> [BE] Hapus cookie token
       -> Redirect ke /login
`);

// ===================== FOOTER =====================
doc.addPage();
doc.rect(0, 0, 595.28, 841.89).fill("#1a1a2e");
doc.font("Helvetica-Bold").fontSize(24).fillColor("#ffffff").text("Chattingan", 50, 350, { align: "center" });
doc.font("Helvetica").fontSize(12).fillColor("#a0a0a0").text("Copyright \u00A9 " + new Date().getFullYear() + " - All Rights Reserved", 50, 400, { align: "center" });
doc.font("Helvetica").fontSize(10).fillColor("#666666").text("Dokumentasi ini bersifat rahasia dan hanya untuk internal tim.", 50, 430, { align: "center" });

// ===================== FINALIZE =====================
doc.end();

console.log("PDF generated: docs/system-flow.pdf");
