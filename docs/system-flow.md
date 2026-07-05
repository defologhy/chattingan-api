# Dokumentasi Sistem Chattingan

## 1. Arsitektur Sistem

### 1.1. High-Level Architecture

```
+----------+       +-----------+       +----------------+       +----------+
| Browser  | ----> | Next.js   | ----> | Server-Side    | ----> | Express  |
| (React)  |       | Pages     |       | Controllers    |       | API      |
+----------+       +-----------+       +----------------+       +----------+
      |                                                               |
      |  WebSocket (Socket.IO)                                        |
      +---------------------------------------------------------------+
```

Komponen utama:
- **Frontend (FE)**: Next.js Pages Router + React + Ant Design
- **Backend (BE)**: Node.js + Express + Socket.IO + Sequelize ORM
- **Database**: MariaDB

### 1.2. Struktur Folder Frontend

```
chattingan/
  pages/
    _app.js                     # App wrapper (AuthProvider, ChatProvider, ThemeProvider)
    _document.js                # Custom Document (fonts, meta)
    index.js                    # Halaman daftar chat (home) — kontak + group + pin/block menu
    login.js                    # Halaman login
    register.js                 # Halaman registrasi
    settings.js                 # Pengaturan profil + daftar blokir
    chat/
      [id].js                   # Halaman 1-on-1 chat room
      group/[id].js             # Halaman group chat room
    api/                        # API Routes (proxy ke BE)
      auth/
        login.js
        register.js
        me.js
        logout.js
      messages/
        users.js
        [userId].js
        search.js
        unread.js
        group/[groupId].js
      groups/
        index.js
        [groupId].js
        [groupId]/members/index.js
        [groupId]/members/[userId].js
      chats/
        index.js                # Pin, unpin, block, unblock via ?action=
  src/
    contexts/
      AuthContext.js             # Auth state (useReducer) + avatar upload
      ChatContext.js             # Chat state (useReducer) — messages, groups, pin, block
      ThemeContext.js            # Dark/light theme toggle
    controllers/                 # Server-side logic (dipanggil API Routes)
      security/
        authorization.js        # getUserDataFromCookie()
      auth/
        login.js
        register.js
        me.js
        logout.js
      messages/
        get-users.js
        get-messages.js
        search-messages.js
        unread-counts.js
        get-group-messages.js
      groups/
        create.js
        get-groups.js
        get-members.js
        add-member.js
        remove-member.js
        update-group.js
      chats/
        pin.js
        unpin.js
        get-pinned.js
        block.js
        unblock.js
        get-blocked.js
    hooks/
      useVoiceRecorder.js        # MediaRecorder hook (voice notes)
    components/
      commons/layouts/MainLayout.js
      chat/
        VoiceBubble.js           # Audio player component
    lib/
      api.js                     # Axios instance (baseURL = backend)
      socket.js                  # Socket.IO client
    configurations/
      index.js                   # Environment config
```

### 1.3. Struktur Folder Backend

```
chattingan-api/
  src/
    chattingan.js               # Entry point + WebSocket server (Socket.IO)
    app.js                      # Express app setup + route mounting
    configurations/
      logger.js                 # Winston logger
    databases/
      connections/
        sequelize.js            # Koneksi Sequelize
      models/
        users.js                # Model User
        messages.js             # Model Message (message_type, reply_to_id, reactions, etc.)
        groups.js               # Model Group
        group_members.js        # Model Group Member
        pinned_chats.js         # Model Pinned Chat
        blocked_users.js        # Model Blocked User
    middlewares/
      auth.js                   # JWT authentication middleware (Express)
    routes/
      v1/
        auth.js                 # Route auth (register, login, me, logout, avatar)
        messages.js             # Route messages (get users, get messages, search, upload, group)
        groups.js               # Route groups (CRUD group + members)
        chats.js                # Route chats (pin, unpin, block, unblock)
    controllers/
      v1/
        auth/
          register.js           # Registrasi user
          login.js              # Login user
          me.js                 # Get current user
          logout.js             # Logout user
          avatar.js             # Upload avatar
        messages/
          get-users.js          # Get daftar user
          get-messages.js       # Get riwayat chat 1-on-1
          get-group-messages.js # Get riwayat chat group
          delete-message.js     # Hapus pesan
          unread-counts.js      # Hitung unread
          search-messages.js    # Cari pesan
          upload-media.js       # Upload file/images/voice
        groups/
          create.js
          get-groups.js
          get-members.js
          add-member.js
          remove-member.js
          update-group.js
        chats/
          pin.js
          unpin.js
          get-pinned.js
          block.js
          unblock.js
          get-blocked.js
      functions/
        error-handlers.js       # Error handler
```

---

## 2. Alur Data

### 2.1. Alur Request (Proxy Pattern)

```
Browser                  Next.js API Route              Server Controller              Backend API
--------                -----------------              ----------------              ------------
   |                           |                              |                           |
   |  1. GET /api/messages     |                              |                           |
   |-------------------------->|                              |                           |
   |                           |                              |                           |
   |                           |  2. validasi cookie JWT      |                           |
   |                           |  (authorization.js)          |                           |
   |                           |------------------------------|                           |
   |                           |                              |                           |
   |                           |  3. panggil controller       |                           |
   |                           |----------------------------->|                           |
   |                           |                              |                           |
   |                           |                              |  4. Axios GET             |
   |                           |                              |-------------------------->|
   |                           |                              |                           |
   |                           |                              |  5. Response JSON         |
   |                           |                              |<--------------------------|
   |                           |                              |                           |
   |                           |  6. Forward response         |                           |
   |                           |<-----------------------------|                           |
   |                           |                              |                           |
   |  7. Response JSON         |                              |                           |
   |<--------------------------|                              |                           |
```

**Penjelasan:**
1. Browser mengirim request ke Next.js API Route
2. API Route memvalidasi JWT dari cookie via `authorization.js`
3. Jika valid, API Route memanggil server-side controller
4. Controller melakukan Axios request ke Backend API
5. Backend API merespon dengan JSON
6. Controller meneruskan response ke API Route
7. API Route mengembalikan response ke browser

### 2.2. Alur Autentikasi

#### Registrasi
```
Browser              API Route (/api/auth/register)        Controller           Backend API
-------              --------------------------------     ----------           -----------
  |                         |                                |                     |
  | POST name, phone,       |                                |                     |
  | password                |                                |                     |
  |------------------------>|                                |                     |
  |                         | validasi cookie (skip)         |                     |
  |                         | panggil controller             |                     |
  |                         |------------------------------->|                     |
  |                         |                                | POST /auth/register |
  |                         |                                |-------------------->|
  |                         |                                |                     |
  |                         |                                |<--------------------|
  |                         |                                | { user, token }     |
  |                         | set cookie token               |                     |
  |                         |<-------------------------------|                     |
  |                         | set cookie + redirect          |                     |
  |<------------------------|                                |                     |
```

#### Login
```
Browser              API Route (/api/auth/login)             Controller           Backend API
-------              -----------------------------          ----------           -----------
  |                         |                                |                     |
  | POST phone, password    |                                |                     |
  |------------------------>|                                |                     |
  |                         | panggil controller             |                     |
  |                         |------------------------------->|                     |
  |                         |                                | POST /auth/login    |
  |                         |                                |-------------------->|
  |                         |                                |                     |
  |                         |                                |<--------------------|
  |                         |                                | { user, token }     |
  |                         | set cookie token               |                     |
  |                         |<-------------------------------|                     |
  |                         | set cookie + redirect          |                     |
  |<------------------------|                                |                     |
```

#### Cek Auth (setiap load halaman)
```
Browser              API Route (/api/auth/me)               Controller           Backend API
-------              ------------------------               ----------           -----------
  |                         |                                |                     |
  | GET /api/auth/me        |                                |                     |
  |------------------------>|                                |                     |
  |                         | validasi cookie JWT            |                     |
  |                         | panggil controller             |                     |
  |                         |------------------------------->|                     |
  |                         |                                | GET /auth/me        |
  |                         |                                | (dengan token)      |
  |                         |                                |-------------------->|
  |                         |                                |                     |
  |                         |                                |<--------------------|
  |                         |                                | { user, avatar }    |
  |                         |<-------------------------------|                     |
  |<------------------------|                                |                     |
```

---

## 3. Real-time Chat Flow (WebSocket)

### 3.1. Koneksi WebSocket

```
Browser                              Socket.IO Server
-------                              -----------------
  |                                        |
  | 1. connect (dengan auth token)         |
  |--------------------------------------->|
  |                                        |
  | 2. Verifikasi JWT token                |
  |                                        |
  | 3. Catat online user                   |
  |                                        |
  | 4. broadcast "users:online"            |
  |<---------------------------------------|
```

### 3.2. Event Socket.IO

#### Client -> Server Events

| Event | Payload | Deskripsi |
|-------|---------|-----------|
| `message:send` | `{ receiverId, message, messageType, replyToId }` | Kirim pesan 1-on-1 (cek block dua arah) |
| `message:edit` | `{ messageId, message }` | Edit pesan |
| `message:react` | `{ messageId, emoji }` | React ke pesan |
| `message:read` | `{ senderId }` | Mark sebagai sudah dibaca |
| `message:delete` | `{ messageId, mode }` | Hapus pesan (self/all) |
| `typing:start` | `{ receiverId }` | Mulai mengetik |
| `typing:stop` | `{ receiverId }` | Berhenti mengetik |
| `group:send` | `{ groupId, message, messageType, replyToId }` | Kirim pesan group |
| `group:typing:start` | `{ groupId }` | Mulai mengetik di group |
| `group:typing:stop` | `{ groupId }` | Berhenti mengetik di group |
| `group:read` | `{ groupId }` | Mark group sebagai sudah dibaca |

#### Server -> Client Events

| Event | Payload | Deskripsi |
|-------|---------|-----------|
| `users:online` | `[userId, ...]` | Daftar user online |
| `users:last-seen` | `{ userId, lastSeen }` | Update last seen |
| `message:new` | `{ id, sender_id, message, ... }` | Pesan baru diterima |
| `message:edited` | `{ messageId, message, updated_at }` | Pesan diedit |
| `message:reacted` | `{ messageId, reactions }` | Reaksi pesan berubah |
| `message:deleted` | `{ messageId }` | Pesan dihapus |
| `messages:read` | `{ userId, readAt }` | Pesan dibaca |
| `typing:update` | `{ userId, isTyping }` | Status mengetik |
| `group:message` | `{ id, sender_id, message, ... }` | Pesan group baru |
| `group:typing` | `{ groupId, userId, isTyping }` | Status mengetik di group |

### 3.3. Block Check Flow (message:send)

```
User A mengirim pesan ke User B:

1. Cek: Apakah User A memblokir User B?
   -> Jika YA => error "Anda telah memblokir pengguna ini"
2. Cek: Apakah User B memblokir User A?
   -> Jika YA => error "Anda telah diblokir oleh pengguna ini"
3. Jika lolos semua => simpan pesan + emit
```

---

## 4. Database Schema

### 4.1. Table: users

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| name | VARCHAR(255) | Nama user |
| phone | VARCHAR(20) (UNIQUE) | Nomor telepon |
| password | VARCHAR(255) | Password (bcrypt hash) |
| avatar | VARCHAR(255) (nullable) | Path foto profil |
| last_seen | DATETIME (nullable) | Terakhir online |
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu diupdate |

### 4.2. Table: messages

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| sender_id | INT (FK -> users.id) | Pengirim |
| receiver_id | INT (FK -> users.id, nullable) | Penerima (null untuk group) |
| group_id | INT (FK -> groups.id, nullable) | Group (null untuk 1-on-1) |
| message | TEXT | Isi pesan |
| message_type | ENUM('text','image','voice','document') | Tipe pesan |
| reply_to_id | INT (nullable) | ID pesan yang dibalas |
| reactions | JSON (nullable) | Reaksi per user {userId: emoji} |
| is_read | BOOLEAN (default false) | Status dibaca |
| delivered_at | DATETIME (nullable) | Waktu terkirim |
| read_at | DATETIME (nullable) | Waktu dibaca |
| deleted_by | INT (nullable) | User yang menghapus (self mode) |
| created_at | DATETIME | Waktu dikirim |
| updated_at | DATETIME | Waktu diupdate |

### 4.3. Table: groups

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| name | VARCHAR(255) | Nama group |
| description | TEXT (nullable) | Deskripsi group |
| avatar | VARCHAR(255) (nullable) | Foto group |
| created_by | INT (FK -> users.id) | Pembuat group |
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu diupdate |

### 4.4. Table: group_members

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| group_id | INT (FK -> groups.id) | Group |
| user_id | INT (FK -> users.id) | Anggota |
| role | ENUM('admin','member') (default 'member') | Peran |
| joined_at | DATETIME | Waktu bergabung |
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu diupdate |

### 4.5. Table: pinned_chats

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| user_id | INT (FK -> users.id) | User yang pin |
| contact_id | INT (FK -> users.id, nullable) | Kontak yang di-pin |
| group_id | INT (FK -> groups.id, nullable) | Group yang di-pin |
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu diupdate |

*Constraint: contact_id dan group_id tidak boleh keduanya terisi atau keduanya null.*

### 4.6. Table: blocked_users

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| user_id | INT (FK -> users.id) | User yang memblokir |
| blocked_user_id | INT (FK -> users.id) | User yang diblokir |
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu diupdate |

### 4.7. Entity Relationship

```
+----------+       +----------+         +-----------+
|   users  |       | messages |         |  groups   |
+----------+       +----------+         +-----------+
| id (PK)  |<------| sender_id|         | id (PK)   |
| name     |       | receiver_id|        | name      |
| phone    |       | group_id  |-------->| group_id  |
| password |       | message   |         | created_by|------> users.id
| avatar   |       | message_type|       +-----------+
| last_seen|       | reply_to_id|              |
+----------+       | reactions |               |
     |             | is_read   |               |
     |             | delivered_at|             |
     |             | read_at   |               |
     |             | deleted_by|               |
     |             +----------+                |
     |                                         |
     |  +---------------+       +---------------------+
     |  | pinned_chats  |       |   group_members    |
     |  +---------------+       +---------------------+
     |  | user_id ------|       | group_id ---------->|
      -->| contact_id   |       | user_id ------------|
     |  | group_id -----|       | role               |
     |  +---------------+       +---------------------+
     |
     |  +---------------+
     |  | blocked_users |
     |  +---------------+
      -->| user_id       |
         | blocked_user_id -------> users.id
         +---------------+
```

---

## 5. Detail Teknis

### 5.1. Fitur-fitur

| Fitur | Fase | Status |
|-------|------|--------|
| Register / Login / Logout | 0 | Selesai |
| Profile Picture (avatar) | 0 | Selesai |
| Daftar kontak + online status | 0 | Selesai |
| Chat 1-on-1 (kirim/terima) | 0 | Selesai |
| Emoji picker | 0 | Selesai |
| Upload avatar | 0 | Selesai |
| Group Chat (CRUD + anggota) | 1 | Selesai |
| Group Chat (kirim/terima pesan) | 1 | Selesai |
| Group typing indicator | 1 | Selesai |
| Media Sharing (image, doc, zip) | 2 | Selesai |
| Voice Notes (record + play) | 3 | Selesai |
| Profile Picture UI (real avatar) | 4 | Selesai |
| Reply pesan | 5 | Selesai |
| Edit pesan | 5 | Selesai |
| Reaksi (emoji) | 5 | Selesai |
| Status pengiriman (✓ ✓✓ ✓✓🔵) | 5 | Selesai |
| Pin/unpin chat | 6 | Selesai |
| Block/unblock user | 6 | Selesai |
| Pinned chats di urutan atas | 6 | Selesai |
| Blocked users list di settings | 6 | Selesai |
| Socket block check (dua arah) | 6 | Selesai |

### 5.2. Authentication Strategy
- **JWT (JSON Web Token)** disimpan di cookie HTTP (httpOnly, sameSite lax)
- Cookie di-set oleh API Route setelah login/register sukses
- Setiap API Route wajib memvalidasi cookie via `authorization.js`
- Jika token invalid/expired, return `401 Unauthorized`
- Logout: cookie dihapus

### 5.3. File Upload Strategy
- Upload langsung ke Backend (axios dengan Bearer token + multipart/form-data)
- Avatar: `POST /api/auth/avatar` (multer, max 2MB, image only)
- Media/voice: `POST /api/messages/upload` (multer, max 20MB, image/pdf/doc/xls/txt/zip/audio)
- File disimpan di `uploads/` folder backend
- Backend mengembalikan URL path, frontend menggabungkan dengan `REACT_APP_API_BASE_URL`

### 5.4. Error Handling Flow

```
Controller
  |
  |--- try block: logic AXIOS
  |      |
  |      |--- success: return response 200
  |      |
  |      |--- error: lempar ke error handler
  |             |
  |             |--- ECONNREFUSED: Service down
  |             |--- error.response: Error dari internal service
  |
  |--- return error response
```

### 5.5. Environment Variables

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

#### Backend (.env)
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

### 5.6. Port yang Digunakan

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (Express) | 3001 |
| Database (MariaDB) | 3306 |

---

## 6. Alur Navigasi Halaman

```
/register              /login               / (Home/Chat List)         /chat/[id]           /chat/group/[id]
   |                      |                       |                        |                      |
   |--- Register form --->|                       |                        |                      |
   |                      |--- Login form ------->|                        |                      |
   |                      |                       |                        |                      |
   |                      |                       |--- Click contact ----->|                      |
   |                      |                       |                        |--- Send message      |
   |                      |                       |                        |--- Voice note        |
   |                      |                       |                        |--- File/Image        |
   |                      |                       |                        |--- Reply/Edit        |
   |                      |                       |                        |--- Reactions         |
   |                      |                       |                        |--- Block user (menu) |
   |                      |                       |                        |                      |
   |                      |                       |--- Click group ------->|-----> /chat/group/id |
   |                      |                       |                        |                      |
   |                      |                       |                        |--- Send message      |
   |                      |                       |                        |--- Voice/File        |
   |                      |                       |                        |                      |
   |                      |                       |--- Right-click kontak  |                      |
   |                      |                       |    Pin / Unpin         |                      |
   |                      |                       |    Block / Unblock     |                      |
   |                      |                       |                        |                      |
   |                      |                       |--- Settings (⚙️) ----->| settings.js          |
   |                      |                       |                        |--- Avatar upload     |
   |                      |                       |                        |--- Blocked list      |
   |                      |                       |                        |                      |
   |                      |                       |--- Logout -------------> /login                |
```

---

## 7. Alur Inisialisasi Aplikasi

### 7.1. Frontend (_app.js)

```
1. AuthProvider (context)
   |-- state: { user, loading }
   |-- on mount: checkAuth() -> GET /api/auth/me
   |-- jika valid: set user
   |-- jika tidak: redirect ke /login

2. ChatProvider (context)
   |-- state: { users, messages, groups, pinnedChats, blockedUsers, ... }
   |-- actions: fetchUsers, fetchMessages, sendMessage, sendGroupMessage,
   |            pinChat, unpinChat, blockUser, unblockUser, uploadFile, ...
   |-- on mount: initSocket() -> connect WebSocket

3. ThemeProvider (context)
   |-- state: { dark }
   |-- toggleTheme()
```

### 7.2. Backend (chattingan.js)

```
1. Inisialisasi Express app (app.js)
   |-- CORS (origin: http://localhost:3000, http://127.0.0.1:3000)
   |-- JSON parser
   |-- Cookie parser
   |-- Morgan logger
   |-- Routes:
        /api/auth
        /api/messages
        /api/groups
        /api/chats

2. Koneksi Database (Sequelize)
   |-- MariaDB connection
   |-- Models: Users, Messages, Groups, GroupMembers, PinnedChats, BlockedUsers

3. WebSocket Server (Socket.IO)
   |-- JWT authentication middleware (handshake auth token)
   |-- On connect:
        - Catat ke onlineUsers Map
        - Broadcast "users:online"
   |-- Event handlers:
        message:send (dengan bidirectional block check)
        message:edit
        message:react
        message:read
        message:delete
        typing:start/stop
        group:send
        group:typing:start/stop
        group:read
   |-- On disconnect:
        - Hapus dari onlineUsers Map
        - Update last_seen
        - Broadcast "users:online"

4. Start server on port 3001
```

---

## 8. API Endpoints

### 8.1. Auth

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registrasi user baru | Tidak |
| POST | `/api/auth/login` | Login user | Tidak |
| GET | `/api/auth/me` | Get data user saat ini | Ya |
| POST | `/api/auth/logout` | Logout (hapus cookie) | Ya |
| POST | `/api/auth/avatar` | Upload foto profil | Ya |

### 8.2. Messages

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/messages/users` | Daftar kontak | Ya |
| GET | `/api/messages/:userId` | Riwayat chat 1-on-1 | Ya |
| GET | `/api/messages/group/:groupId` | Riwayat chat group | Ya |
| GET | `/api/messages/search` | Cari pesan | Ya |
| GET | `/api/messages/unread` | Hitung unread total | Ya |
| DELETE | `/api/messages/:messageId` | Hapus pesan | Ya |
| POST | `/api/messages/upload` | Upload file/media/voice | Ya |

### 8.3. Groups

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/groups` | Buat group baru | Ya |
| GET | `/api/groups` | Daftar group user | Ya |
| GET | `/api/groups/:groupId/members` | Daftar anggota group | Ya |
| POST | `/api/groups/:groupId/members` | Tambah anggota | Ya |
| DELETE | `/api/groups/:groupId/members/:userId` | Hapus anggota | Ya |
| PATCH | `/api/groups/:groupId` | Update group | Ya |

### 8.4. Chats (Pin & Block)

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/chats/pin` | Pin chat (contactId atau groupId) | Ya |
| POST | `/api/chats/unpin` | Unpin chat | Ya |
| GET | `/api/chats/pinned` | Daftar chat yang di-pin | Ya |
| POST | `/api/chats/block` | Blokir user | Ya |
| POST | `/api/chats/unblock` | Unblock user | Ya |
| GET | `/api/chats/blocked` | Daftar ID user yang diblokir | Ya |

---

## 9. Format Response API

### Sukses
```json
{
  "status_code": 200,
  "data": { ... }
}
```

### Error
```json
{
  "status_code": 400,
  "error_title": "Judul Error",
  "error_message": "Deskripsi error",
  "path": "http://localhost:3001/api/..."
}
```

---

## 10. Flow Diagram (Textual)

### Fitur Lengkap

```
[REGISTRASI]
Browser -> POST /api/auth/register (name, phone, password)
       -> [BE] Validasi input
       -> [BE] Hash password (bcrypt)
       -> [BE] Simpan user
       -> [BE] Generate JWT + set cookie
       -> Redirect ke /

[LOGIN]
Browser -> POST /api/auth/login (phone, password)
       -> [BE] Cari user by phone
       -> [BE] Verifikasi password (bcrypt.compare)
       -> [BE] Generate JWT + set cookie
       -> Redirect ke /

[KIRIM PESAN 1-ON-1]
User A -> Input pesan + Enter
       -> Socket.emit("message:send", { receiverId, message, messageType, replyToId })
       -> [BE] Cek block (dua arah)
       -> [BE] Simpan ke DB (set delivered_at jika online)
       -> [BE] Emit "message:new" ke User A & User B

[KIRIM PESAN GROUP]
User A -> Input pesan + Enter
       -> Socket.emit("group:send", { groupId, message, messageType, replyToId })
       -> [BE] Validasi anggota group
       -> [BE] Simpan ke DB dengan group_id
       -> [BE] Emit "group:message" ke semua anggota

[PIN / UNPIN]
User -> Right-click kontak -> Pin
     -> POST /api/chats?action=pin { contactId }
     -> [BE] Simpan ke tabel pinned_chats
     -> UI: kontak naik ke urutan atas

[BLOCK / UNBLOCK]
User -> Right-click kontak -> Block
     -> POST /api/chats?action=block { blockedUserId }
     -> [BE] Simpan ke tabel blocked_users
     -> UI: kontak strikethrough + opacity 50%
     -> Chat: red banner + input disabled

[UPLOAD FILE / VOICE]
User -> Klik 📎 atau 🎤
     -> POST /api/messages/upload (multipart)
     -> [BE] Multer: simpan file ke uploads/
     -> [BE] Return { url, message_type }
     -> [FE] Kirim via socket dengan messageType

[REPLY / EDIT]
User -> Right-click pesan -> Balas/Edit
     -> Reply: set replyToId -> kirim dengan reply_to_id
     -> Edit: emit "message:edit" { messageId, message }
     -> [BE] Update content + updated_at
     -> Broadcast "message:edited" ke semua pihak

[REAKSI]
User -> Hover pesan -> Pilih emoji
     -> emit "message:react" { messageId, emoji }
     -> [BE] Toggle emoji di JSON reactions per userId
     -> Broadcast "message:reacted"

[DELIVERY STATUS]
     -> Setelah simpan: delivered_at = null (offline) / Date.now() (online)
     -> Saat penerima buka chat: emit "messages:read"
     -> UI: ✓ sent / ✓✓ delivered / ✓✓🔵 read
```

---

## 11. Migration History

| Migration | Isi |
|-----------|-----|
| `20260704070156-add-avatar-to-users.js` | Kolom `avatar` di tabel users |
| `20260704070541-add-message-type-to-messages.js` | Kolom `message_type` di messages |
| `20260704080000-create-groups-and-members.js` | Tabel `groups` + `group_members` |
| `20260704081000-add-group-id-to-messages.js` | Kolom `group_id` di messages |
| `20260704090000-add-message-features.js` | Kolom `reply_to_id`, `reactions`, `is_read`, `delivered_at`, `read_at`, `deleted_by` |
| `20260704100000-add-pin-and-block.js` | Tabel `pinned_chats` + `blocked_users` |
