import multer from "multer";
import path from "path";
import {fileURLToPath} from "url";
import Users from "../../../databases/models/users.js";
import errorHandlers from "../../functions/error-handlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {fileSize: 1024 * 1024 * 5},
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file gambar yang diperbolehkan (jpeg, jpg, png, gif)"));
    }
  },
});

const uploadAvatar = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  const uploadMiddleware = upload.single("avatar");

  uploadMiddleware(request, response, async (err) => {
    try {
      if (err) {
        return response.status(400).json(errorHandlers(err, url));
      }

      if (!request.file) {
        return response.status(400).json(errorHandlers(new Error("File avatar tidak ditemukan"), url));
      }

      const user = await Users.findByPk(request.user.id);
      if (!user) {
        return response.status(404).json(errorHandlers(new Error("User tidak ditemukan"), url));
      }

      await user.update({avatar: request.file.filename});

      response.json({
        status_code: 200,
        data: {avatar: request.file.filename},
      });
    } catch (error) {
      return response.status(400).json(errorHandlers(error, url));
    }
  });
};

export default uploadAvatar;
