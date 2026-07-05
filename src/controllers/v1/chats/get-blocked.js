import BlockedUsers from "../../../databases/models/blocked_users.js";
import errorHandlers from "../../functions/error-handlers.js";

const getBlocked = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const blocked = await BlockedUsers.findAll({
      where: {user_id: request.user.id},
      raw: true,
    });
    return response.json({status_code: 200, data: blocked.map((b) => b.blocked_user_id)});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default getBlocked;
