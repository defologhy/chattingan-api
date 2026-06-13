import logger from "../../configurations/logger.js";

const errorHandlers = (error, url) => {
  logger.error(`${error.message} | ${url}`);
  return {
    status_code: 400,
    timestamp: new Date().toISOString(),
    error_title: "Error",
    error_message: error.message || "Terjadi kesalahan",
    path: url,
  };
};

export default errorHandlers;
