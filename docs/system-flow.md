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
- **Database**: MySQL

### 1.2. Struktur Folder Frontend

```
chattingan/
  pages/
    _app.js                     # App wrapper (AuthProvider, ChatProvider)
    index.js                    # Halaman daftar chat (home)
    login.js                    # Halaman login
    register.js                 # Halaman registrasi
    chat/[id].js                # Halaman chat room
    api/                        # API Routes (proxy ke BE)
      auth/login.js
      auth/register.js
      auth/me.js
      messages/users.js
      messages/[userId].js
  src/
    contexts/
      AuthContext.js             # Auth state (useReducer)
      ChatContext.js             # Chat state (useReducer)
    controllers/                 # Server-side logic (dipanggil API Routes)
      auth/login.js
      auth/register.js
      auth/me.js
      messages/get-users.js
      messages/get-messages.js
    lib/
      api.js                    # Axios instance
      socket.js                 # Socket.IO client
    components/
      commons/layouts/MainLayout.js
    configurations/index.js
```

### 1.3. Struktur Folder Backend

```
chattingan-api/
  src/
    chattingan.js               # Entry point + WebSocket server
    app.js                      # Express app setup
    configurations/
      logger.js                 # Winston logger
    databases/
      connections/
        sequelize.js            # Koneksi Sequelize
      models/
        users.js                # Model User
        messages.js             # Model Message
    middlewares/
      auth.js                   # JWT authentication middleware
    routes/
      v1/
        auth.js                 # Route auth (register, login, me, logout)
        messages.js             # Route messages (get users, get messages)
    controllers/
      v1/
        auth/
          register.js           # Registrasi user
          login.js              # Login user
          me.js                 # Get current user
          logout.js             # Logout user
        messages/
          get-users.js          # Get daftar user
          get-messages.js       # Get riwayat chat
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
  |                         |                                | { user }            |
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
  | 3. join room "user:{userId}"           |
  |                                        |
  | 4. broadcast onlineUsers               |
  |<---------------------------------------|
```

### 3.2. Kirim & Terima Pesan

```
User A (Browser)         API Route              Controller           Backend API           User B (Browser)
  |                        |                      |                     |                      |
  | 1. Send message        |                      |                     |                      |
  | (via API)              |                      |                     |                      |
  |----------------------->|                      |                     |                      |
  |                        |                      |                     |                      |
  | 2. POST /api/messages  |                      |                     |                      |
  |                        |--------------------->|                     |                      |
  |                        |                      | 3. POST /messages   |                      |
  |                        |                      |-------------------->|                      |
  |                        |                      |                     |                      |
  |                        |                      | 4. Save to DB       |                      |
  |                        |                      |                     |                      |
  |                        | 5. Response          |                     |                      |
  |                        |<---------------------|                     |                      |
  |                        |                      |                     |                      |
  | 6. Response            |                      |                     |                      |
  |<-----------------------|                      |                     |                      |
  |                        |                      |                     |                      |
  |                        |                      | 7. Emit Socket.IO   |                      |
  |                        |                      |  "new_message"      |                      |
  |                        |                      |---------------------------------------->|
  |                        |                      |                     |                      |
  |                        |                      |                     | 8. Receive message   |
  |                        |                      |                     | (real-time)          |
  |                        |                      |                     |                      |
```

**Penjelasan:**
1. User A mengetik pesan dan klik send
2. FE memanggil API Route `/api/messages/[userId]`
3. API Route memanggil controller yang melakukan POST ke Backend
4. Backend menyimpan pesan ke database
5. Response dikembalikan ke FE User A
6. Backend mengirim event Socket.IO `new_message` ke room User B
7. User B menerima pesan secara real-time

### 3.3. Event Socket.IO

| Event | Arah | Deskripsi |
|-------|------|-----------|
| `connect` | Client -> Server | Koneksi WebSocket dengan JWT |
| `new_message` | Server -> Client | Pesan baru diterima |
| `online_users` | Server -> Client | Daftar user online diperbarui |
| `disconnect` | Client -> Server | User keluar |

---

## 4. Database Schema

### 4.1. Table: users

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| name | VARCHAR(255) | Nama user |
| phone | VARCHAR(20) (UNIQUE) | Nomor telepon |
| password | VARCHAR(255) | Password (bcrypt hash) |
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu diupdate |

### 4.2. Table: messages

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK, AUTO_INCREMENT) | Primary key |
| sender_id | INT (FK -> users.id) | Pengirim |
| receiver_id | INT (FK -> users.id) | Penerima |
| message | TEXT | Isi pesan |
| created_at | DATETIME | Waktu dikirim |
| updated_at | DATETIME | Waktu diupdate |

### 4.3. Entity Relationship

```
+----------+       +----------+
|   users  |       | messages |
+----------+       +----------+
| id (PK)  |<------| sender_id|
| name     |       | receiver_id|
| phone    |       | message  |
| password |       | created_at|
| created_at|      +----------+
| updated_at|
+----------+
```

---

## 5. Detail Teknis

### 5.1. Authentication Strategy
- **JWT (JSON Web Token)** disimpan di cookie HTTP
- Cookie di-set oleh API Route setelah login/register sukses
- Setiap API Route wajib memvalidasi cookie via `authorization.js`
- Jika token invalid/expired, return `401 Unauthorized`
- Logout: cookie dihapus

### 5.2. Error Handling Flow

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

### 5.3. Environment Variables

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

### 5.4. Port yang Digunakan

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (Express) | 3001 |
| Database (MySQL) | 3306 |

---

## 6. Alur Navigasi Halaman

```
/register              /login               / (Home/Chat List)         /chat/[id]
   |                      |                       |                        |
   |--- Register form --->|                       |                        |
   |                      |--- Login form ------->|                        |
   |                      |                       |                        |
   |                      |                       |--- Click contact ----->|
   |                      |                       |                        |
   |                      |                       |                        |--- Send message
   |                      |                       |                        |--- Receive message (realtime)
   |                      |                       |                        |
   |                      |                       |<--- Back (ArrowLeft) --|
   |                      |                       |                        |
   |                      |                       |--- Logout -------------> /login
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
   |-- state: { users, messages, onlineUsers, loading }
   |-- on mount: initSocket() -> konek WebSocket
   |-- listen: online_users event

3. ConfigProvider (Ant Design)
   |-- theme: colorPrimary, borderRadius

4. MainLayout
   |-- wrapper div untuk styling global
```

### 7.2. Backend (chattingan.js)

```
1. Inisialisasi Express app (app.js)
   |-- CORS (origin: http://localhost:3000)
   |-- JSON parser
   |-- Cookie parser
   |-- Morgan logger
   |-- Routes:
        /api/v1/auth
        /api/v1/messages

2. Koneksi Database (Sequelize)
   |-- MySQL connection
   |-- Sync models (users, messages)

3. WebSocket Server (Socket.IO)
   |-- JWT authentication middleware
   |-- On connect:
        - Join room "user:{userId}"
        - Broadcast online users
   |-- On disconnect:
        - Broadcast online users

4. Start server on port 3001
```

---

## 8. Format Response API

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
  "path": "http://localhost:3001/api/v1/..."
}
```

---

## 9. Flow Diagram (Textual)

```
[REGISTRASI]
Browser -> POST /api/auth/register (name, phone, password)
       -> [BE] Validasi input
       -> [BE] Hash password (bcrypt)
       -> [BE] Simpan user ke database
       -> [BE] Generate JWT token
       -> [FE] Set cookie + redirect ke /

[LOGIN]
Browser -> POST /api/auth/login (phone, password)
       -> [BE] Cari user by phone
       -> [BE] Verifikasi password (bcrypt.compare)
       -> [BE] Generate JWT token
       -> [FE] Set cookie + redirect ke /

[CHAT]
User A -> Klik User B di daftar chat
       -> GET /api/messages/[userId] (ambil riwayat)
       -> Tampilkan pesan-pesan sebelumnya
       -> Ketik pesan + Enter
       -> POST /api/messages/[userId] (message)
       -> [BE] Simpan ke database
       -> [BE] Emit event "new_message" ke User B via Socket.IO
       -> User B langsung lihat pesan (real-time)

[LOGOUT]
User -> Klik tombol Keluar
    -> GET /api/auth/logout
    -> [BE] Hapus cookie
    -> Redirect ke /login
```
