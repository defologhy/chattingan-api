import {Sequelize} from "sequelize";
import logger from "../../configurations/logger.js";

const sequelize = new Sequelize(
  process.env.DB_NAME || "chattingan",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: (msg) => logger.info(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export default sequelize;
