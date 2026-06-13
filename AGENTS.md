# AGENTS.md - Panduan Coding Proyek

## Tech Stack

| Layer              | Teknologi                           |
|--------------------|-------------------------------------|
| Runtime            | Node.js (Alpine, Docker)            |
| Framework          | Express.js                          |
| Bahasa             | ES6+ JavaScript (Babel transpile)   |
| Database           | MariaDB via Sequelize ORM           |
| Cache              | Redis (ioredis + RediSearch) [*opsional*] |
| Logging            | Winston + Daily Rotate File         |
| HTTP Logging       | Morgan                              |
| Validasi           | validator.js                        |
| Date               | date-fns + date-fns-tz              |
| Excel              | ExcelJS                             |
| API Docs           | Swagger (swagger-jsdoc + swagger-ui-express) |
| HTTP Client        | Axios                               |
| Testing            | Jest                                |
| Container          | Docker multi-stage build            |
| CI/CD              | Jenkins                             |

---

## Struktur Folder

```
proyek/
  src/
    app.js                          # Express app setup, route mounting
    kedaimart.js                    # Entry point
    configurations/
      logger.js                     # Winston logger
      .env.development / .env.test  # Environment variables
    controllers/
      v1/                           # API controllers version 1
        <module>/                   # Per modul fitur
      functions/                    # Shared helper functions
        error-handlers.js
      helpers/
        redis-instance-helper.js    # [*opsional*] Redis instance holder
    databases/
      connections/
        sequelize.js                # Sequelize connection
      models/                       # Sequelize models
      redis/                        # [*opsional*] Redis index definitions
    middlewares/
    routes/
      v1/                           # Express routers
    views/                          # Template engine (jika ada)
```

---

## Aturan Coding

### 1. Bahasa Komentar
Gunakan **Bahasa Indonesia** untuk semua komentar, terutama blok penjelasan logika.

**Contoh:**
```js
//1. Declare all Variables
//2. Check Source "from_cache" condition
//3. Send Response
```

### 2. Module System
Gunakan **ES6 Modules** (`import`/`export`) untuk semua file.
```js
import express from "express";
import {QueryTypes} from "sequelize";
export { router as default }
```
Hindari `require()` kecuali untuk modul yang memang tidak support ES6.

### 3. Database Access
- **WAJIB** menggunakan **Sequelize ORM** (model-based).
- **DILARANG** menggunakan `mysqli` atau PDO.
- Query raw SQL diperbolehkan via `sequelize.query()` dengan `QueryTypes`.
- Gunakan transaction untuk operasi write yang kompleks.

```js
await sequelize.transaction(async transaction => {
    await sequelize.query(query, {
        type: QueryTypes.INSERT,
        transaction,
        raw: true
    });
});
```

### 4. Cache Pattern (Redis) [*opsional*]
> *Hanya terapkan jika diminta. Default: tidak pakai Redis, langsung ke database.*

Jika Redis digunakan:
- Cek Redis dulu (`FT.SEARCH`), fallback ke database jika cache kosong.
- Gunakan Redis instance via helper singleton.

```js
import {getRedisInstance} from '../../helpers/redis-instance-helper';
const redisInstance = getRedisInstance();
const result = await redisInstance.call('ft.search', 'idx:nama-index', filterCondition);
```

### 5. Error Handling
Gunakan centralized `errorHandlers()`.

```js
import errorHandlers from "../../functions/error-handlers";

try {
    // logic
} catch(error) {
    return errorHandlers(error, process.env.APP_BASE_URL + request.originalUrl);
}
```

Format error response:
```json
{
  "status_code": 400,
  "timestamp": "2024-01-01 12:00:00.000",
  "error_title": "Judul Error",
  "error_message": "Deskripsi error",
  "path": "https://api.example.com/endpoint"
}
```

### 6. Naming Convention
- **File & Folder**: `kebab-case` (contoh: `data-get.js`, `error-handlers.js`)
- **Variabel & Fungsi**: `camelCase` (contoh: `filterCondition`, `dataGet`)
- **Konstanta**: `UPPER_SNAKE_CASE` (contoh: `MAXIMUM_RESPONSE_RECORDS`)
- **Class**: `PascalCase` (Sequelize models)

### 7. Controller Pattern
Setiap controller adalah file terpisah yang mengekspor satu default function dengan signature `async (request, response)`.

```js
const functionName = async(request, response) => {
    try {
        // numbered comment blocks
        //1. Declare Variables
        //2. Main Logic
        //3. Send Response
    } catch(error) {
        return errorHandlers(error, url);
    }
}
export { functionName as default }
```

### 8. Route Pattern
Routes menggunakan Express Router, hubungkan controller.

```js
import express from "express";
import dataGet from "../../controllers/v1/module/data-get";
const router = new express.Router()

router.get("/data", async (request, response) => {
    return dataGet(request, response);
})

export { router as default }
```

### 9. Environment Variables
Gunakan `process.env.NAMA_VARIABEL` untuk semua konfigurasi.
Environment file disimpan di direktori `configurations/` dengan prefix `.env.*`.

### 10. Response Format
Semua response mengikuti format standar:

```json
{
  "data_from_cache": true,
  "process_time": {
    "start": "2024-01-01 12:00:00.000",
    "finish": "2024-01-01 12:00:00.100",
    "duration": { "seconds": 0 }
  },
  "filter": [...],
  "sort": [...],
  "pagination": {
    "current_page": 1,
    "page_size": 10,
    "total_records": 100
  },
  "data_fields": ["field1", "field2"],
  "data": [...]
}
```

### 11. Timezone
Selalu gunakan `date-fns-tz` dengan timezone dari environment variable.

```js
import {format, utcToZonedTime} from "date-fns-tz";
format(utcToZonedTime(Date.now(), process.env.TIMEZONE), 'yyyy-MM-dd HH:mm:ss.SSS', {timeZone: process.env.TIMEZONE})
```

### 12. Pagination
- Wajib menggunakan `MAXIMUM_RESPONSE_RECORDS` sebagai batas atas.
- Parameter: `current_page`, `page_size`, `all_data`.

---

## Git Workflow

### Branch Strategy
- `develop` - branch utama pengembangan
- Feature branch: `feature/nama-fitur`
- Hotfix branch: `hotfix/nama-fix`

### Commit Message
Format bebas, deskriptif dalam Bahasa Indonesia atau Inggris sederhana.

**Contoh:**
- `improve search data`
- `fixing handle error`
- `bug fix validate input`
- `add new endpoint`

### Pull Request
- Merge commit ke `develop`
- Judul PR: deskripsi singkat perubahan

---

## Cara Menjalankan

```bash
# Development
npm start

# Production build
npm run build
npm run execute

# Testing
npm test
```

---

## Checklist Sebelum Coding

1. [ ] Pelajari file terkait (controllers, models, routes)
2. [ ] Pahami flow data
3. [ ] Cek environment variables yang dibutuhkan
4. [ ] Jangan merusak endpoint yang sudah ada

## Checklist Setelah Coding

1. [ ] Jalankan `npm test`
2. [ ] Cek backward compatibility dengan existing API
3. [ ] Pastikan response format tidak berubah
