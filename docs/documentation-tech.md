# Technical Documentation — Chattingan

Dokumen ini menjelaskan secara teknis seluruh arsitektur, alur data, komponen, dan flow fitur dari aplikasi Chattingan (WhatsApp-like chat app).

---

## Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Struktur Proyek](#3-struktur-proyek)
4. [Proxy Layer Pattern](#4-proxy-layer-pattern)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Real-time Chat (WebSocket)](#6-real-time-chat-websocket)
7. [Database Schema & Relationships](#7-database-schema--relationships)
8. [API Endpoints](#8-api-endpoints)
9. [Frontend State Management](#9-frontend-state-management)
10. [Fitur Flow Detail](#10-fitur-flow-detail)
11. [File Upload Strategy](#11-file-upload-strategy)
12. [Error Handling](#12-error-handling)
13. [Environment Variables](#13-environment-variables)
14. [Migration History](#14-migration-history)

---

## 1. Tech Stack

### Frontend (`chattingan/`)

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js (Pages Router) |
| UI Library | React 18 + Ant Design 5 |
| Bahasa | JavaScript (ES6+), JSX |
| State Management | React Context + useReducer |
| HTTP Client | Axios |
| Real-time Client | Socket.IO Client |
| Voice Recording | MediaRecorder API |
| Date/Time | date-fns + date-fns-tz |
| Emoji Picker | emoji-picker-react |
| Linting | ESLint |
| Styling | CSS Modules + LESS + Ant Design vars |

### Backend (`chattingan-api/`)

| Layer | Teknologi |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Bahasa | ES6+ JavaScript (via Babel) |
| Database ORM | Sequelize 6 |
| Database | MariaDB |
| Real-time Server | Socket.IO |
| Auth | JWT (jsonwebtoken) |
| File Upload | Multer |
| Logging | Winston + Morgan |
| Validation | validator.js |
| Testing | Jest |

---

## 2. Arsitektur Sistem

### High-Level Architecture

```
+----------+     HTTP      +-----------+     Axios     +----------------+     REST      +----------+
| Browser  | ----------->  | Next.js   | ----------->  | Server-Side    | ----------->  | Express  |
| (React)  | <-----------  | Pages     | <-----------  | Controllers    | <-----------  | API      |
|          |     JSON      |           |               | (src/controllers)|              | (Backend)|
+----------+               +-----------+               +----------------+               +----------+
      |                          |                            |                              |
      |     WebSocket (Socket.IO) |                            |                              |
      +---------------------------+----------------------------+------------------------------+
                                                               |
                                                          +----------+
                                                          | MariaDB  |
                                                          +----------+
```

### Layer Descriptions

1. **Browser (React)** — Menampilkan UI, interaksi user. Tidak boleh langsung akses backend.
2. **Next.js Pages** — Merender halaman React di sisi server (SSR/CSR). Juga menyediakan API Routes sebagai proxy.
3. **Server-Side Controllers** — Berisi logika proxy: menerima request dari API Routes, meneruskan ke Backend API via Axios.
4. **Express API** — Backend utama: logic bisnis, akses database, WebSocket server.
5. **MariaDB** — Database relasional.

### Diagram Component Tree (React)

```
<App> (_app.js)
  ├── <AuthProvider> (src/contexts/AuthContext.js)
  │   ├── <ThemeProvider> (src/contexts/ThemeContext.js)
  │   │   ├── <ChatProvider> (src/contexts/ChatContext.js)
  │   │   │   ├── <MainLayout>
  │   │   │   │   ├── <IndexPage> (pages/index.js)
  │   │   │   │   │   ├── Header (user info, settings, theme, logout)
  │   │   │   │   │   ├── SearchBar
  │   │   │   │   │   ├── GroupList + CreateGroupModal
  │   │   │   │   │   └── ContactList (dengan Dropdown Pin/Block)
  │   │   │   │   │
  │   │   │   │   ├── <ChatRoomPage> (pages/chat/[id].js)
  │   │   │   │   │   ├── Header (avatar, name, online status, block menu)
  │   │   │   │   │   ├── BlockedBanner (jika diblokir)
  │   │   │   │   │   ├── MessageList
  │   │   │   │   │   │   ├── <MessageBubble> (reply, edit, reactions, delete)
  │   │   │   │   │   │   │   ├── <ReplyPreview>
  │   │   │   │   │   │   │   ├── <MediaContent>
  │   │   │   │   │   │   │   │   ├── <Image> (preview)
  │   │   │   │   │   │   │   │   ├── <VoiceBubble> (audio player)
  │   │   │   │   │   │   │   │   └── <FileLink>
  │   │   │   │   │   │   │   └── <ReactionsRow>
  │   │   │   │   │   ├── ReplyPreviewBar
  │   │   │   │   │   ├── EmojiPicker
  │   │   │   │   │   └── InputArea (text + mic + attach + emoji)
  │   │   │   │   │
  │   │   │   │   ├── <GroupChatPage> (pages/chat/group/[id].js)
  │   │   │   │   │   └── (sama seperti ChatRoomPage + sender avatar)
  │   │   │   │   │
  │   │   │   │   └── <SettingsPage> (pages/settings.js)
  │   │   │   │       ├── ProfileCard + AvatarUpload
  │   │   │   │       └── BlockedContactsList
  │   │   │   │
  │   │   │   └── <LoginPage> / <RegisterPage>
  │   │   │
  │   └── </ChatProvider>
  └── </ThemeProvider>
```

---

## 3. Struktur Proyek

### Frontend (`chattingan/`)

```
chattingan/
├── pages/
│   ├── _app.js                     # App wrapper: AuthProvider + ChatProvider + ThemeProvider
│   ├── _document.js                # Custom Document (fonts, meta)
│   ├── index.js                    # Home: daftar kontak + group + pin/block menu
│   ├── login.js                    # Halaman login
│   ├── register.js                 # Halaman registrasi
│   ├── settings.js                 # Pengaturan profil + daftar blokir
│   ├── chat/
│   │   ├── [id].js                 # Chat 1-on-1
│   │   └── group/[id].js           # Chat group
│   └── api/                        # API Routes (proxy ke Backend)
│       ├── auth/
│       │   ├── login.js
│       │   ├── register.js
│       │   ├── me.js
│       │   └── logout.js
│       ├── messages/
│       │   ├── users.js
│       │   ├── [userId].js
│       │   ├── search.js
│       │   ├── unread.js
│       │   └── group/[groupId].js
│       ├── groups/
│       │   ├── index.js
│       │   ├── [groupId].js
│       │   └── [groupId]/members/
│       │       ├── index.js
│       │       └── [userId].js
│       └── chats/
│           └── index.js            # Single entry: ?action=pin|unpin|pinned|block|unblock|blocked
│
└── src/
    ├── contexts/
    │   ├── AuthContext.js           # Auth state + avatar upload
    │   ├── ChatContext.js           # Chat state global (messages, groups, pin, block)
    │   └── ThemeContext.js          # Dark/light mode
    ├── controllers/                 # Server-side proxy (dipanggil oleh API Routes)
    │   ├── security/
    │   │   └── authorization.js     # getUserDataFromCookie()
    │   ├── auth/
    │   │   ├── login.js
    │   │   ├── register.js
    │   │   ├── me.js
    │   │   └── logout.js
    │   ├── messages/
    │   │   ├── get-users.js
    │   │   ├── get-messages.js
    │   │   ├── search-messages.js
    │   │   ├── unread-counts.js
    │   │   └── get-group-messages.js
    │   ├── groups/
    │   │   ├── create.js
    │   │   ├── get-groups.js
    │   │   ├── get-members.js
    │   │   ├── add-member.js
    │   │   ├── remove-member.js
    │   │   └── update-group.js
    │   └── chats/
    │       ├── pin.js
    │       ├── unpin.js
    │       ├── get-pinned.js
    │       ├── block.js
    │       ├── unblock.js
    │       └── get-blocked.js
    ├── hooks/
    │   └── useVoiceRecorder.js     # MediaRecorder: start/stop recording → File
    ├── components/
    │   ├── commons/layouts/
    │   │   └── MainLayout.js
    │   └── chat/
    │       └── VoiceBubble.js       # Audio player (play/pause, progress, duration)
    ├── lib/
    │   ├── api.js                   # Axios instance (baseURL = backend, bearer token interceptor)
    │   └── socket.js                # Socket.IO client (auth token handshake)
    ├── configurations/
    │   └── index.js                 # env config object
    ├── styles/
    │   ├── antd.less
    │   └── globals.css
    └── next.config.js
```

### Backend (`chattingan-api/`)

```
chattingan-api/
├── src/
│   ├── chattingan.js               # Entry point: Express + Socket.IO server
│   ├── app.js                      # Express app: cors, parser, routes, static
│   ├── configurations/
│   │   ├── logger.js               # Winston logger
│   │   └── .env (development/test)
│   ├── databases/
│   │   ├── connections/
│   │   │   └── sequelize.js        # Sequelize connection config
│   │   └── models/
│   │       ├── users.js            # Model users
│   │       ├── messages.js         # Model messages (dengan semua kolom fitur)
│   │       ├── groups.js           # Model groups
│   │       ├── group_members.js    # Model group_members
│   │       ├── pinned_chats.js     # Model pinned_chats
│   │       └── blocked_users.js    # Model blocked_users
│   ├── middlewares/
│   │   └── auth.js                 # JWT Express middleware
│   ├── routes/
│   │   └── v1/
│   │       ├── auth.js             # /api/auth
│   │       ├── messages.js         # /api/messages
│   │       ├── groups.js           # /api/groups
│   │       └── chats.js            # /api/chats
│   ├── controllers/
│   │   ├── v1/
│   │   │   ├── auth/               # register, login, me, logout, avatar
│   │   │   ├── messages/           # get-users, get-messages, get-group-messages, search, unread, delete, upload-media
│   │   │   ├── groups/             # create, get-groups, get-members, add-member, remove-member, update-group
│   │   │   └── chats/              # pin, unpin, get-pinned, block, unblock, get-blocked
│   │   └── functions/
│   │       └── error-handlers.js   # Centralized error handler
│   └── views/                      # (template engine jika ada)
├── migrations/                     # Sequelize migrations (6 file)
├── uploads/                        # Uploaded files (avatar, media, voice)
├── docs/
│   └── system-flow.md
├── config/
├── seeders/
├── Dockerfile
├── package.json
└── .env
```

---

## 4. Proxy Layer Pattern

### Alur Request Lengkap

```
Browser                  Next.js API Route              Server Controller              Backend API
--------                -----------------              ----------------              ------------
   |                           |                              |                           |
   |  1. GET /api/messages     |                              |                           |
   |-------------------------->|                              |                           |
   |                           |                              |                           |
   |                           |  2. Baca cookie "token"      |                           |
   |                           |  3. verify(token, secret)    |                           |
   |                           |     -> { id, name, phone }   |                           |
   |                           |                              |                           |
   |                           |  4. Panggil controller       |                           |
   |                           |  (dengan currentUser)        |                           |
   |                           |----------------------------->|                           |
   |                           |                              |                           |
   |                           |                              |  5. Axios request         |
   |                           |                              |     (method, url,         |
   |                           |                              |      headers, params,     |
   |                           |                              |      data)                |
   |                           |                              |-------------------------->|
   |                           |                              |                           |
   |                           |                              |  6. Backend response      |
   |                           |                              |<--------------------------|
   |                           |                              |                           |
   |                           |  7. Forward response         |                           |
   |                           |     (status code + data)     |                           |
   |                           |<-----------------------------|                           |
   |                           |                              |                           |
   |  8. Response JSON         |                              |                           |
   |<--------------------------|                              |                           |
```

### Kenapa Proxy Pattern?

1. **Keamanan** — Backend API tidak terekspos langsung ke browser. Semua request melewati Next.js yang bisa validasi JWT.
2. **CORS** — Backend hanya perlu menerima dari Next.js (origin `localhost:3000`), tidak perlu CORS kompleks.
3. **Logging** — Semua request tercatat di Next.js API Routes maupun Backend.
4. **Transform** — Bisa transform response sebelum dikirim ke browser.

### Pengecualian: Upload File

File upload (avatar, media, voice) **langsung dari browser ke Backend** (via Axios dengan Bearer token), karena:
- Multer butuh akses langsung ke file stream
- Proxy via Next.js akan memakan memory untuk buffer file
- Backend sudah punya validasi JWT di middleware Express

```
Browser  --- axios POST /api/auth/avatar (multipart) --->  Backend (Express + Multer)
Browser  --- axios POST /api/messages/upload (multipart) ->  Backend (Express + Multer)
```

---

## 5. Authentication & Authorization

### 5.1. Alur Login

```
Browser                          Next.js                       Backend
-------                          -------                       -------
  |                                |                              |
  | POST /api/auth/login          |                              |
  | { phone, password }           |                              |
  |------------------------------>|                              |
  |                                | POST /auth/login            |
  |                                |---------------------------->|
  |                                |                              |
  |                                |  1. Cari user by phone      |
  |                                |  2. bcrypt.compare(password)|
  |                                |  3. Generate JWT            |
  |                                |     payload: { id, name,    |
  |                                |       phone }               |
  |                                |  4. Return { user, token }  |
  |                                |<----------------------------|
  |                                |                              |
  |                                | Set cookie:                  |
  |                                |   name: "token"             |
  |                                |   value: jwt                 |
  |                                |   httpOnly: true             |
  |                                |   sameSite: "lax"            |
  |                                |   path: "/"                  |
  |                                |   maxAge: 7 days             |
  |                                |                              |
  |  Response + redirect ke /      |                              |
  |<-------------------------------|                              |
```

### 5.2. Alur Cek Auth (setiap load halaman)

```
Browser                          Next.js API Route (/api/auth/me)
-------                          --------------------------------
  |                                |
  | GET /api/auth/me              |
  | (cookie: token=xxx)           |
  |------------------------------>|
  |                                |
  |  1. Baca cookie "token"       |
  |  2. jwt.verify(token, secret) |
  |  3. Jika valid -> { id, name, |
  |      phone }                  |
  |  4. GET /auth/me              |
  |     (Authorization: Bearer    |
  |      token)                   |
  |     -> Backend                 |
  |  5. Return { user, avatar }   |
  |                                |
  |  { status_code: 200, user }   |
  |<-------------------------------|
```

### 5.3. Implementasi Kunci

**Next.js API Route Pattern:**
```js
// pages/api/auth/me.js
export default async function handler(req, res) {
    let authServer = require("../../src/controllers/security/authorization");
    const currentUser = await authServer.getUserDataFromCookie(req);
    if(currentUser.status_code === 200){
        // forward to controller
    } else {
        return res.status(401).end("Unauthorized")
    }
}
```

**Authorization Helper:**
```js
// src/controllers/security/authorization.js
export const getUserDataFromCookie = async (req) => {
    const token = req.cookies?.token;
    if (!token) return { status_code: 401 };
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { status_code: 200, id: decoded.id, name: decoded.name };
    } catch {
        return { status_code: 401 };
    }
};
```

---

## 6. Real-time Chat (WebSocket)

### 6.1. Koneksi & Authentication

```
Browser (Socket.IO Client)              Server (Socket.IO)
--------------------------              -------------------
  |                                         |
  | connect({                               |
  |   auth: { token: jwt }                  |
  | })                                      |
  |---------------------------------------->|
  |                                         |
  |  1. io.use() middleware:                |
  |     - jwt.verify(auth.token)            |
  |     - socket.user = decoded             |
  |                                         |
  |  2. onlineUsers.set(userId, socketId)   |
  |                                         |
  |  3. io.emit("users:online",             |
  |     [all online userIds])               |
  |<----------------------------------------|
  |                                         |
  |  4. socket.on("disconnect"):            |
  |     - onlineUsers.delete(userId)        |
  |     - Update last_seen di DB            |
  |     - Broadcast users:online            |
```

### 6.2. Event Catalog

#### Client → Server Events

| Event | Payload | Description | Handler Logic |
|-------|---------|-------------|---------------|
| `message:send` | `{ receiverId, message, messageType, replyToId }` | Kirim pesan 1-on-1 | Cek block (2 arah) → Create message → Set delivered_at jika online → Emit ke pengirim & penerima |
| `message:edit` | `{ messageId, message }` | Edit pesan | Verifikasi kepemilikan → Update message + updated_at → Broadcast ke penerima |
| `message:react` | `{ messageId, emoji }` | React ke pesan | Baca reactions JSON → Toggle emoji per userId → Simpan → Broadcast |
| `message:read` | `{ senderId }` | Mark read | Update is_read=true, read_at=now untuk semua pesan dari senderId → Emit ke sender |
| `message:delete` | `{ messageId, mode }` | Hapus pesan | `mode="self"`: set deleted_by=userId (soft delete) → `mode="all"`: destroy record → Emit message:deleted |
| `typing:start` | `{ receiverId }` | Mulai mengetik | Emit typing:update ke receiver |
| `typing:stop` | `{ receiverId }` | Berhenti mengetik | Emit typing:update (isTyping=false) ke receiver |
| `group:send` | `{ groupId, message, messageType, replyToId }` | Kirim pesan group | Validasi anggota → Create message dengan group_id → Ambil semua anggota → Emit ke masing-masing |
| `group:typing:start` | `{ groupId }` | Mulai mengetik di group | Emit group:typing ke semua anggota |
| `group:typing:stop` | `{ groupId }` | Berhenti mengetik di group | Emit group:typing (isTyping=false) ke semua anggota |
| `group:read` | `{ groupId }` | Mark group read | Update is_read=true untuk semua pesan di groupId |

#### Server → Client Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `users:online` | `[userId, ...]` | Koneksi / disconnect |
| `users:last-seen` | `{ userId, lastSeen }` | Disconnect |
| `message:new` | `{ id, sender_id, sender_name, receiver_id, message, message_type, reply_to_id, created_at, is_read, delivered_at, read_at }` | `message:send` selesai |
| `message:edited` | `{ messageId, message, updated_at }` | `message:edit` selesai |
| `message:reacted` | `{ messageId, reactions }` | `message:react` selesai |
| `message:deleted` | `{ messageId }` | `message:delete` selesai |
| `messages:read` | `{ userId, readAt }` | `message:read` selesai |
| `typing:update` | `{ userId, isTyping }` | `typing:start` / `typing:stop` |
| `group:message` | `{ id, sender_id, sender_name, group_id, message, ... }` | `group:send` selesai |
| `group:typing` | `{ groupId, userId, isTyping }` | `group:typing:start/stop` |

### 6.3. Block Check Flow (message:send)

```
message:send({ receiverId, message })
  │
  ├── Cek 1: Apakah sender (userId) memblokir receiver (receiverId)?
  │     SELECT * FROM blocked_users
  │     WHERE user_id = userId AND blocked_user_id = receiverId
  │     │
  │     ├── FOUND → emit error: "Pesan tidak terkirim. Anda telah memblokir pengguna ini."
  │     │           STOP (return)
  │     │
  │     └── NOT FOUND → lanjut
  │
  ├── Cek 2: Apakah receiver memblokir sender?
  │     SELECT * FROM blocked_users
  │     WHERE user_id = receiverId AND blocked_user_id = userId
  │     │
  │     ├── FOUND → emit error: "Pesan tidak terkirim. Anda telah diblokir oleh pengguna ini."
  │     │           STOP (return)
  │     │
  │     └── NOT FOUND → lanjut
  │
  └── Lolos semua cek → simpan pesan, emit message:new
```

### 6.4. Delivery Status Flow

```
message:send selesai
  │
  ├── receiver sedang online (ada di onlineUsers Map)?
  │     │
  │     ├── YA → set delivered_at = Date.now()
  │     │         Emit "message:new" ke receiver dengan delivered_at terisi
  │     │
  │     └── TIDAK → set delivered_at = null
  │                  (nanti terisi saat receiver online & fetch ulang)
  │
  └── Emit "message:new" ke sender dengan status yang sesuai

Tampilan di UI:
  ✓           = sent (is_read=false, delivered_at=null)
  ✓✓          = delivered (is_read=false, delivered_at !== null)
  ✓✓🔵        = read (is_read=true)
```

---

## 7. Database Schema & Relationships

### 7.1. Table: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(255) | NOT NULL | Nama user |
| `phone` | VARCHAR(20) | UNIQUE, NOT NULL | Nomor telepon (login identifier) |
| `password` | VARCHAR(255) | NOT NULL | bcrypt hash |
| `avatar` | VARCHAR(255) | NULLABLE | Path file avatar |
| `last_seen` | DATETIME | NULLABLE | Terakhir online |
| `created_at` | DATETIME | NOT NULL | Auto-set by Sequelize |
| `updated_at` | DATETIME | NOT NULL | Auto-set by Sequelize |

### 7.2. Table: `messages`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Primary key |
| `sender_id` | INT | FK → users.id, NOT NULL | Pengirim pesan |
| `receiver_id` | INT | FK → users.id, NULLABLE | Penerima (null jika group message) |
| `group_id` | INT | FK → groups.id, NULLABLE | Group (null jika 1-on-1) |
| `message` | TEXT | NOT NULL | Isi pesan (atau URL file) |
| `message_type` | ENUM('text','image','voice','document') | DEFAULT 'text' | Tipe konten |
| `reply_to_id` | INT | NULLABLE | ID pesan yang dibalas |
| `reactions` | JSON | NULLABLE | Map `{ userId: emoji }` |
| `is_read` | BOOLEAN | DEFAULT false | Status read |
| `delivered_at` | DATETIME | NULLABLE | Waktu terkirim ke penerima |
| `read_at` | DATETIME | NULLABLE | Waktu dibaca |
| `deleted_by` | INT | FK → users.id, NULLABLE | Soft delete: user yang menghapus |
| `created_at` | DATETIME | NOT NULL | Auto-set |
| `updated_at` | DATETIME | NOT NULL | Auto-set (juga di-update saat edit) |

### 7.3. Table: `groups`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(100) | NOT NULL | Nama group |
| `description` | TEXT | NULLABLE | Deskripsi |
| `avatar` | VARCHAR(255) | NULLABLE | Foto group (future use) |
| `created_by` | INT | FK → users.id, NOT NULL | Pembuat group |
| `created_at` | DATETIME | NOT NULL | Auto-set |
| `updated_at` | DATETIME | NOT NULL | Auto-set |

### 7.4. Table: `group_members`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Primary key |
| `group_id` | INT | FK → groups.id, NOT NULL | Group |
| `user_id` | INT | FK → users.id, NOT NULL | Anggota |
| `role` | ENUM('admin','member') | DEFAULT 'member' | Peran |
| `joined_at` | DATETIME | NOT NULL | Waktu bergabung |
| `created_at` | DATETIME | NOT NULL | Auto-set |
| `updated_at` | DATETIME | NOT NULL | Auto-set |

### 7.5. Table: `pinned_chats`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Primary key |
| `user_id` | INT | FK → users.id, NOT NULL | User yang melakukan pin |
| `contact_id` | INT | FK → users.id, NULLABLE | Kontak yang di-pin |
| `group_id` | INT | FK → groups.id, NULLABLE | Group yang di-pin |
| `created_at` | DATETIME | NOT NULL | Auto-set |
| `updated_at` | DATETIME | NOT NULL | Auto-set |

**Constraint**: `contact_id` dan `group_id` harus salah satu terisi (tidak boleh keduanya null atau keduanya terisi).

### 7.6. Table: `blocked_users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, AUTO_INCREMENT | Primary key |
| `user_id` | INT | FK → users.id, NOT NULL | User yang memblokir |
| `blocked_user_id` | INT | FK → users.id, NOT NULL | User yang diblokir |
| `created_at` | DATETIME | NOT NULL | Auto-set |
| `updated_at` | DATETIME | NOT NULL | Auto-set |

### 7.7. Entity Relationship Diagram

```
  +------------------+          +----------------------+          +------------------+
  |      users       |          |      messages        |          |     groups       |
  +------------------+          +----------------------+          +------------------+
  | id (PK)          |<---------| sender_id (FK)       |          | id (PK)          |
  | name             |          | receiver_id (FK)      |          | name             |
  | phone (UNIQUE)   |          | group_id (FK)    ----|--------->| description      |
  | password (hash)  |          | message               |          | avatar           |
  | avatar           |          | message_type (ENUM)   |          | created_by (FK)  |
  | last_seen        |          | reply_to_id           |          | created_at       |
  | created_at       |          | reactions (JSON)      |          | updated_at       |
  | updated_at       |          | is_read (bool)        |          +------------------+
  +------------------+          | delivered_at          |                   |
         |                      | read_at               |                   |
         |                      | deleted_by (FK)       |                   |
         |                      | created_at            |                   |
         |                      | updated_at            |                   |
         |                      +----------------------+                   |
         |                               |                                 |
         |                               |                                 |
         |     +------------------+      |      +--------------------------+
         |     |  pinned_chats    |      |      |    group_members         |
         |     +------------------+      |      +--------------------------+
         |     | id (PK)          |      |      | id (PK)                  |
         +-----| user_id (FK)     |      |      | group_id (FK)      ------+
         |     | contact_id (FK)  |      |      | user_id (FK)       ------+
         |     | group_id (FK)    |      |      | role (ENUM)             |
         |     | created_at       |      |      | joined_at               |
         |     | updated_at       |      |      | created_at              |
         |     +------------------+      |      | updated_at              |
         |                               |      +--------------------------+
         |     +------------------+      |
         |     | blocked_users    |      |
         |     +------------------+      |
         +-----| user_id (FK)     |      |
         |     | blocked_user_id  |------+
         |     | (FK)             |
         |     | created_at       |
               | updated_at       |
               +------------------+
```

---

## 8. API Endpoints

### 8.1. Backend Endpoints (Express — `chattingan-api`)

#### Auth — `/api/auth`

| Method | Endpoint | Auth | Request | Response | Description |
|--------|----------|------|---------|----------|-------------|
| POST | `/register` | ✗ | `{ name, phone, password }` | `{ status_code: 201, data: { user, token } }` | Registrasi + auto login |
| POST | `/login` | ✗ | `{ phone, password }` | `{ status_code: 200, data: { user, token } }` | Login |
| GET | `/me` | ✓ | — | `{ status_code: 200, data: { user } }` | Data user saat ini |
| POST | `/logout` | ✓ | — | `{ status_code: 200 }` | Logout (clear cookie) |
| POST | `/avatar` | ✓ | `multipart: file` | `{ status_code: 200, data: { avatar } }` | Upload foto profil |

#### Messages — `/api/messages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users` | ✓ | Daftar semua user (kontak) |
| GET | `/:userId` | ✓ | Riwayat chat 1-on-1 (paginated: `?page=1&limit=50`) |
| GET | `/group/:groupId` | ✓ | Riwayat chat group (paginated) |
| GET | `/search` | ✓ | Cari pesan (`?q=keyword&userId=xxx`) |
| GET | `/unread` | ✓ | Total unread count across all chats |
| DELETE | `/:messageId` | ✓ | Hapus pesan (`?mode=self\|all`) |
| POST | `/upload` | ✓ | Upload file (`multipart: file`) |

#### Groups — `/api/groups`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✓ | Buat group baru `{ name, description, memberIds }` |
| GET | `/` | ✓ | Daftar group milik user |
| GET | `/:groupId/members` | ✓ | Daftar anggota group |
| POST | `/:groupId/members` | ✓ | Tambah anggota `{ userId }` |
| DELETE | `/:groupId/members/:userId` | ✓ | Hapus anggota |
| PATCH | `/:groupId` | ✓ | Update group `{ name, description }` |

#### Chats (Pin & Block) — `/api/chats`

| Method | Endpoint | Auth | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/pin` | ✓ | `{ contactId \| groupId }` | `{ status_code: 201, data: { ... } }` |
| POST | `/unpin` | ✓ | `{ contactId \| groupId }` | `{ status_code: 200, message: "..." }` |
| GET | `/pinned` | ✓ | — | `{ status_code: 200, data: [{ ... }] }` |
| POST | `/block` | ✓ | `{ blockedUserId }` | `{ status_code: 201, data: { ... } }` |
| POST | `/unblock` | ✓ | `{ blockedUserId }` | `{ status_code: 200, message: "..." }` |
| GET | `/blocked` | ✓ | — | `{ status_code: 200, data: [blockedUserId, ...] }` |

### 8.2. Frontend API Routes (Next.js Proxy — `chattingan`)

Semua endpoint berikut memanggil controller di `src/controllers/` yang melakukan Axios ke backend.

| Route Pattern | Methods | Auth | Description |
|---------------|---------|------|-------------|
| `/api/auth/login` | POST | ✗ | Proxy login |
| `/api/auth/register` | POST | ✗ | Proxy register |
| `/api/auth/me` | GET | ✓ | Proxy cek auth |
| `/api/auth/logout` | GET | ✓ | Proxy logout |
| `/api/messages/users` | GET | ✓ | Proxy daftar kontak |
| `/api/messages/[userId]` | GET | ✓ | Proxy riwayat chat |
| `/api/messages/search` | GET | ✓ | Proxy search pesan |
| `/api/messages/unread` | GET | ✓ | Proxy unread count |
| `/api/messages/group/[groupId]` | GET | ✓ | Proxy riwayat group |
| `/api/groups` | GET, POST | ✓ | Proxy daftar/buat group |
| `/api/groups/[groupId]` | PATCH | ✓ | Proxy update group |
| `/api/groups/[groupId]/members` | GET, POST | ✓ | Proxy daftar/tambah anggota |
| `/api/groups/[groupId]/members/[userId]` | DELETE | ✓ | Proxy hapus anggota |
| `/api/chats?action=pin\|unpin\|pinned\|block\|unblock\|blocked` | GET/POST | ✓ | Proxy pin/block |

---

## 9. Frontend State Management

### 9.1. Context Structure

#### AuthContext

```js
State: {
  user: { id, name, phone, avatar } | null,
  loading: boolean,
}

Actions:
  - checkAuth()          // GET /api/auth/me → set user atau redirect ke /login
  - login(phone, pass)   // POST /api/auth/login → set cookie + set user
  - register(name, phone, pass)  // POST /api/auth/register
  - logout()             // GET /api/auth/logout → clear cookie + clear user
  - updateAvatar(file)   // POST /api/auth/avatar (multipart) → update user.avatar
```

#### ChatContext

```js
State: {
  users: [{ id, name, phone, avatar, unread_count, last_seen }],
  groups: [{ id, name, description, member_count }],
  messages: [{ id, sender_id, receiver_id, message, message_type, ... }],
  groupMessages: { [groupId]: [messages...] },
  onlineUsers: [userId, ...],
  typingUsers: { [userId]: boolean },
  groupTypingUsers: { [groupId]: { [userId]: boolean } },
  groupMembers: [{ user_id, name, avatar, role }],
  pinnedChats: [{ user_id, contact_id, group_id }],
  blockedUsers: [userId, ...],
  loading: boolean,
  messagesLoading: boolean,
  hasMoreMessages: boolean,
  currentPage: number,
  totalUnread: number,
  activeUserId: number | null,
  activeGroupId: number | null,
}

Socket Event Listeners (initSocket):
  users:online       → setOnlineUsers
  users:last-seen    → UPDATE_LAST_SEEN
  typing:update      → SET_TYPING
  messages:read      → UPDATE_MESSAGE_STATUS
  message:deleted    → REMOVE_MESSAGE
  group:message      → ADD_GROUP_MESSAGE
  group:typing       → SET_GROUP_TYPING
  message:edited     → EDIT_MESSAGE
  message:reacted    → REACT_TO_MESSAGE

Socket Emitters:
  sendMessage(id, text, type, replyToId)
  editMessage(messageId, text)
  reactToMessage(messageId, emoji)
  deleteMessage(messageId, mode)
  sendTyping(receiverId, isTyping)
  markAsRead(senderId)
  sendGroupMessage(groupId, text, type, replyToId)
  sendGroupTyping(groupId, isTyping)
  markGroupAsRead(groupId)

REST Actions:
  fetchUsers / searchUsers
  fetchMessages / loadMoreMessages / searchMessages
  fetchGroups / fetchGroupMembers / fetchGroupMessages / createGroup
  fetchPinnedChats / pinChat / unpinChat
  fetchBlockedUsers / blockUser / unblockUser
  uploadFile(file)
```

#### ThemeContext

```js
State: { dark: boolean }
Actions: { toggleTheme() }
```

### 9.2. State Flow Diagram

```
Halaman Index (/)
  │
  ├── mount → fetchUsers() → GET /api/messages/users
  │           fetchGroups() → GET /api/groups
  │           fetchPinnedChats() → GET /api/chats?action=pinned
  │           fetchBlockedUsers() → GET /api/chats?action=blocked
  │           initSocket() → konek WebSocket
  │
  ├── render users: pinned diurutkan ke atas, blocked di-strikethrough
  │
  ├── right-click kontak → dropdown menu (Pin/Unpin, Block/Unblock)
  │
  └── click kontak → router.push(/chat/[id])

Halaman Chat (/chat/[id])
  │
  ├── mount → fetchMessages(id) → GET /api/messages/[userId]
  │           listenMessages(id, handler)
  │           markAsRead(id) → socket "message:read"
  │
  ├── handle input → text state → Enter → socket "message:send"
  │
  ├── incoming message → callback addMessage → dispatch ADD_MESSAGE
  │
  ├── scroll up → loadMoreMessages(id, page+1) → GET /api/messages/[userId]?page=N
  │
  └── search → searchMessages(id, query) → GET /api/messages/search?q=...&userId=...
```

---

## 10. Fitur Flow Detail

### 10.1. Group Chat

#### Membuat Group

```
User Klik "Buat Group"
  │
  ├── Modal muncul: Nama Group + Deskripsi + Pilih Anggota (multi-select)
  │
  ├── Submit → api.post("/api/groups", { name, desc, memberIds })
  │     │
  │     └── Controller → POST /api/groups
  │           │
  │           ├── TRANSACTION BEGIN
  │           ├── INSERT INTO groups (name, description, created_by)
  │           ├── INSERT INTO group_members (group_id, user_id, role='admin') → creator
  │           ├── FOR EACH memberId:
  │           │     INSERT INTO group_members (group_id, user_id, role='member')
  │           └── TRANSACTION COMMIT
  │
  └── dispatch ADD_GROUP → group masuk ke daftar
```

#### Mengirim Pesan Group

```
User → Input + Enter
  │
  ├── Validasi: user adalah anggota group? (dicek di server)
  ├── Socket emit("group:send", { groupId, message, messageType, replyToId })
  │
  └── Server:
        ├── Cek membership di tabel group_members
        ├── CREATE message dengan group_id (receiver_id = null)
        ├── FOR EACH member di group:
        │     ├── Jika member online → io.to(socketId).emit("group:message", msg)
        │     └── Jika member offline → (nanti di-fetch saat buka chat)
        └── Emit ke sender juga (untuk local echo)
```

### 10.2. Media Sharing (Image, Document)

```
User → Klik 📎 → Pilih file
  │
  ├── Validasi: ukuran max 20MB, tipe: image/*, .pdf, .doc, .docx, .xls, .xlsx, .txt, .zip
  │
  ├── uploadFile(file) → api.post("/api/messages/upload", formData)
  │     │
  │     └── Backend (multer):
  │           ├── Simpan file ke /uploads/{timestamp}-{filename}
  │           └── Return { url: "/uploads/xxx.jpg", message_type: "image"|"document" }
  │
  └── sendMessage(id, uploaded.url, uploaded.message_type)
        → Socket emit("message:send", { receiverId, message: url, messageType })
```

### 10.3. Voice Notes

```
User → Tahan 🎤
  │
  ├── useVoiceRecorder.startRecording()
  │     ├── navigator.mediaDevices.getUserMedia({ audio: true })
  │     ├── new MediaRecorder(stream, { mimeType: 'audio/webm' })
  │     ├── data chunks dikumpulkan
  │     └── state: recording=true, timer start
  │
  ├── UI: ● REC (red dot) + timer (0:00 → ...)
  │
  User → Lepas 🎤
  │
  ├── useVoiceRecorder.stopRecording()
  │     ├── MediaRecorder.stop()
  │     ├── Gabung chunks → Blob (audio/webm)
  │     └── Return File object dari Blob
  │
  ├── uploadFile(file) → server simpan sebagai file audio
  │     └── Return { url: "/uploads/xxx.webm", message_type: "voice" }
  │
  └── sendMessage(id, uploaded.url, "voice")

[Playback]
  VoiceBubble component:
  ├── new Audio(msg.message) — gunakan URL backend
  ├── Play/Pause toggle
  ├── Progress bar (input range)
  ├── Duration display (format: m:ss)
  └── styling: hijau (milik sendiri) / abu-abu (dari lawan)
```

### 10.4. Reply & Edit

#### Reply

```
User → Right-click pesan → "Balas"
  │
  ├── setReplyTo(msg) → state replyTo terisi
  ├── UI: Reply bar muncul di atas input (⬅ Membalas "nama")
  │
  ├── User ketik pesan → Enter
  │     └── sendMessage(id, text, "text", replyTo.id)
  │
  └── Server simpan reply_to_id → UI tampilkan ReplyPreview di bubble
      (border-left biru untuk balasan, nama "Membalas" di atasnya)
```

#### Edit

```
User → Right-click pesan sendiri → "Edit"
  │
  ├── setEditingMsg(msg) → setText(msg.message)
  ├── UI: Edit bar muncul ("Mengedit pesan")
  │
  ├── User edit teks → Enter
  │     └── editMessage(editingMsg.id, text)
  │           └── Socket emit("message:edit", { messageId, message })
  │
  └── Server: update content + updated_at → broadcast "message:edited"
      UI: tampilkan "diedit" di bawah pesan
```

### 10.5. Reactions

```
User → Hover pesan → Popover 6 emoji
  │
  ├── Klik emoji → reactToMessage(messageId, emoji)
  │     └── Socket emit("message:react", { messageId, emoji })
  │
  └── Server:
        ├── Baca reactions (JSON: { "userId1": "❤️", "userId2": "😂" })
        ├── Jika userId sudah ada dengan emoji sama → hapus (toggle off)
        ├── Jika userId sudah ada dengan emoji beda → ganti
        ├── Jika userId belum ada → tambah
        ├── Simpan ke DB
        └── Broadcast "message:reacted" → UI update <ReactionsRow>
```

### 10.6. Pin / Unpin

```
User → Right-click kontak → "Pin" (atau "Unpin" jika sudah di-pin)
  │
  ├── pinChat(contactId) → api.post("/api/chats?action=pin", { contactId })
  │     └── Backend: INSERT INTO pinned_chats (user_id, contact_id)
  │
  ├── dispatch ADD_PINNED_CHAT
  │
  └── UI: kontak naik ke urutan teratas, icon pin di samping nama

  [Sorting Logic di index.js]
  const pinnedIds = pinnedChats.filter(p => p.contact_id).map(p => p.contact_id);
  const sorted = [...users].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id);
    const bPinned = pinnedIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });
```

### 10.7. Block / Unblock

#### Block dari Daftar Kontak

```
User → Right-click kontak → "Block"
  │
  ├── blockUser(userId) → api.post("/api/chats?action=block", { blockedUserId })
  │     └── Backend: INSERT INTO blocked_users (user_id, blocked_user_id)
  │
  ├── dispatch ADD_BLOCKED_USER
  │
  └── UI: kontak jadi 50% opacity + strikethrough + label "Diblokir"
```

#### Block dari Header Chat

```
User → Buka chat/[id] → klik ⋮ (three dots) → "Block"
  │
  ├── blockUser(Number(id))
  │
  └── UI: muncul red banner "Anda telah memblokir pengguna ini"
          Input area berubah jadi "Anda tidak dapat mengirim pesan"
```

#### Unblock dari Settings

```
User → Settings ⚙️ → Kontak Diblokir (expand) → Lihat daftar → Klik "Unblock"
  │
  ├── unblockUser(userId) → api.post("/api/chats?action=unblock", { blockedUserId })
  │     └── Backend: DELETE FROM blocked_users WHERE ...
  │
  ├── dispatch REMOVE_BLOCKED_USER
  │
  └── UI: kontak kembali normal
```

### 10.8. Settings & Avatar

```
User → Klik ⚙️ → /settings
  │
  ├── Profile card: avatar + name + phone
  ├── Klik avatar / "Ubah Foto Profil" → file picker (image/*)
  │
  ├── updateAvatar(file) → api.post() langsung ke Backend
  │     (karena multipart, tidak via proxy)
  │     └── Backend (multer, max 2MB, image only):
  │           ├── Hapus avatar lama jika ada
  │           ├── Simpan file ke /uploads/avatar-{userId}-{timestamp}.ext
  │           └── Update users.avatar di DB
  │
  └── UI: avatar langsung berganti
```

---

## 11. File Upload Strategy

### 11.1. Upload Endpoints

| Endpoint | Penggunaan | Max Size | Accepted Types | Multer Config |
|----------|------------|----------|----------------|---------------|
| `POST /api/auth/avatar` | Foto profil | 2 MB | image/* | `single('file')` |
| `POST /api/messages/upload` | Media/voice | 20 MB | image/*, .pdf, .doc, .docx, .xls, .xlsx, .txt, .zip, audio/* | `single('file')` |

### 11.2. Alur Upload

```
Browser (axios)
  │
  ├── FormData.append("file", fileObj)
  ├── api.post(url, formData, { headers: { "Content-Type": "multipart/form-data" } })
  │     │
  │     └── Axios interceptor menambahkan:
  │           Authorization: Bearer {token}
  │
  └── Backend:
        ├── auth middleware → verify JWT → set req.user
        ├── multer middleware → parse file, simpan ke /uploads/
        ├── Controller:
        │     ├── Avatar: update users.avatar di DB
        │     └── Media: return { url, message_type }
        └── Response JSON
```

### 11.3. File Naming

```
Avatar:  /uploads/avatar-{userId}-{timestamp}.{ext}
Media:   /uploads/{timestamp}-{originalFilename}
```

### 11.4. Serving Files

Backend Express menyajikan static files dari folder `uploads/`:

```js
app.use("/uploads", express.static("uploads"));
```

Frontend menggabungkan base URL:

```js
const fullUrl = avatar.startsWith("http")
  ? avatar
  : config.REACT_APP_API_BASE_URL + "/uploads/" + avatar;
```

---

## 12. Error Handling

### 12.1. Backend Error Handler

```js
// src/controllers/functions/error-handlers.js
export default function errorHandlers(error, path) {
    if (error.code === "ECONNREFUSED") {
        return {
            status_code: 503,
            timestamp: format(utcToZonedTime(Date.now(), process.env.TIMEZONE), ...),
            error_title: "Service Tidak Tersedia",
            error_message: "Koneksi ke service gagal",
            path
        };
    }
    if (error.response) {
        return {
            status_code: error.response.status,
            timestamp: ...,
            error_title: error.response.data?.error_title || "Internal Service Error",
            error_message: error.response.data?.error_message || error.message,
            path
        };
    }
    // Default
    return {
        status_code: 500,
        timestamp: ...,
        error_title: "Internal Server Error",
        error_message: error.message,
        path
    };
}
```

### 12.2. Frontend Proxy Error Handler

```js
// Setiap controller di src/controllers/
try {
    const result = await axios.request(axiosConfig);
    return response.status(200).send(result.data);
} catch (error) {
    if (error.code === "ECONNREFUSED") {
        return response.status(503).json({ error: "Service tidak tersedia" });
    } else if (error.response) {
        return response.status(error.response.status).send(error.response.data);
    }
    return response.status(500).json({ error: "Terjadi kesalahan pada server" });
}
```

### 12.3. Error Response Format

```json
{
  "status_code": 400,
  "timestamp": "2024-07-04 15:30:00.000",
  "error_title": "Validation Error",
  "error_message": "Phone number already registered",
  "path": "http://localhost:3001/api/auth/register"
}
```

---

## 13. Environment Variables

### 13.1. Frontend (`chattingan/.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

Diakses via `src/configurations/index.js`:
```js
const config = {
  REACT_APP_NAME: "Chattingan",
  REACT_APP_API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  REACT_APP_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
  TIMEZONE: "Asia/Jakarta",
};
export default config;
```

### 13.2. Backend (`chattingan-api/.env`)

```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=chattingan
JWT_SECRET=chattingan_secret_key_2024
APP_BASE_URL=http://localhost:3001
TIMEZONE=Asia/Jakarta
```

### 13.3. Port Mapping

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (Express) | 3001 |
| Database (MariaDB) | 3306 |

---

## 14. Migration History

| # | Migration File | Perubahan |
|---|----------------|-----------|
| 1 | `20260704070156-add-avatar-to-users.js` | Tambah kolom `avatar` (VARCHAR) ke tabel `users` |
| 2 | `20260704070541-add-message-type-to-messages.js` | Tambah kolom `message_type` (ENUM) ke `messages` |
| 3 | `20260704080000-create-groups-and-members.js` | Buat tabel `groups` + `group_members` |
| 4 | `20260704081000-add-group-id-to-messages.js` | Tambah kolom `group_id` (FK) ke `messages` |
| 5 | `20260704090000-add-message-features.js` | Tambah `reply_to_id`, `reactions` (JSON), `is_read`, `delivered_at`, `read_at`, `deleted_by` |
| 6 | `20260704100000-add-pin-and-block.js` | Buat tabel `pinned_chats` + `blocked_users` |

---

## Appendix: Key Code Snippets

### Axios Instance (Frontend)

```js
// src/lib/api.js
import axios from "axios";
import config from "../configurations";
import { getCookie } from "../utils/cookie"; // helper baca cookie

const api = axios.create({
  baseURL: config.REACT_APP_API_BASE_URL,
  timeout: 40000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getCookie("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### Socket.IO Client

```js
// src/lib/socket.js
import { io } from "socket.io-client";
import config from "../configurations";
import { getCookie } from "../utils/cookie";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(config.REACT_APP_SOCKET_URL, {
      auth: { token: getCookie("token") },
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};
```

### Avatar Upload (langsung ke Backend)

```js
// src/contexts/AuthContext.js — updateAvatar
const updateAvatar = useCallback(async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const token = getCookie("token");
    const { data } = await axios.post(
      `${config.REACT_APP_API_BASE_URL}/api/auth/avatar`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );
    if (data.status_code === 200) {
      dispatch({ type: "SET_USER", payload: { ...state.user, avatar: data.data.avatar } });
      return true;
    }
  } catch {}
  return false;
}, []);
```

### Voice Recorder Hook

```js
// src/hooks/useVoiceRecorder.js
import { useState, useRef, useCallback } from "react";

export default function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      return true;
    } catch {
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) return resolve(null);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        setRecording(false);
        resolve(file);
      };
      mediaRecorder.stop();
    });
  }, []);

  return { recording, duration, startRecording, stopRecording };
}
```

---

*Dokumen ini mencakup seluruh fitur hingga Fase 6 (Chat Management: Pin & Block).*
*Last updated: July 2026*
