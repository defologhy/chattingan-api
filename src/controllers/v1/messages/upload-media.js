import multer from "multer";
import path from "path";
import {fileURLToPath} from "url";
import errorHandlers from "../../functions/error-handlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//1. Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "media-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|gif|webp/;
  const docTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
  const audioTypes = /mp3|wav|ogg|webm|m4a/;
  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  if (imageTypes.test(extname) || docTypes.test(extname) || audioTypes.test(extname)) {
    cb(null, true);
  } else {
    cb(new Error("Tipe file tidak didukung"));
  }
};

const upload = multer({
  storage,
  limits: {fileSize: 1024 * 1024 * 20},
  fileFilter,
});

const uploadMedia = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  const uploadMiddleware = upload.single("file");

  uploadMiddleware(request, response, async (err) => {
    try {
      if (err) {
        return response.status(400).json(errorHandlers(err, url));
      }
      if (!request.file) {
        return response.status(400).json(errorHandlers(new Error("File tidak ditemukan"), url));
      }

      //2. Tentukan message_type berdasarkan ekstensi
      const imageTypes = /jpeg|jpg|png|gif|webp/;
      const audioTypes = /mp3|wav|ogg|webm|m4a/;
      const ext = path.extname(request.file.originalname).toLowerCase().slice(1);
      let messageType = "document";
      if (imageTypes.test(ext)) messageType = "image";
      else if (audioTypes.test(ext)) messageType = "voice";

      response.json({
        status_code: 200,
        data: {
          filename: request.file.filename,
          url: "/uploads/" + request.file.filename,
          message_type: messageType,
          original_name: request.file.originalname,
          size: request.file.size,
        },
      });
    } catch (error) {
      return response.status(400).json(errorHandlers(error, url));
    }
  });
};

export default uploadMedia;
