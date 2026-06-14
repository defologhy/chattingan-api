import Messages from "../../../databases/models/messages.js";
import errorHandlers from "../../functions/error-handlers.js";

const unreadCounts = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const unreadTotal = await Messages.count({
      where: {receiver_id: request.user.id, is_read: false, deleted_by: null},
    });
    response.json({unread_total: unreadTotal});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default unreadCounts;