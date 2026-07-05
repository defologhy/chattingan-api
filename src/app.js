import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import logger from "./configurations/logger.js";
import authRoutes from "./routes/v1/auth.js";
import messageRoutes from "./routes/v1/messages.js";
import groupRoutes from "./routes/v1/groups.js";
import chatRoutes from "./routes/v1/chats.js";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("short"));

// Sajikan folder uploads secara statis
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/chats", chatRoutes);

app.get("/", (req, res) => {
  res.json({message: "Chattingan API"});
});

export default app;
