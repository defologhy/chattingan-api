import PinnedChats from "../../../databases/models/pinned_chats.js";
import errorHandlers from "../../functions/error-handlers.js";

const getPinned = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const pins = await PinnedChats.findAll({
      where: {user_id: request.user.id},
      raw: true,
    });
    return response.json({status_code: 200, data: pins});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default getPinned;
