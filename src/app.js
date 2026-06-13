import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import logger from "./configurations/logger.js";
import authRoutes from "./routes/v1/auth.js";
import messageRoutes from "./routes/v1/messages.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("short"));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.json({message: "Chattingan API"});
});

export default app;
