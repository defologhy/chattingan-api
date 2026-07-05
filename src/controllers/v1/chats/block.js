import BlockedUsers from "../../../databases/models/blocked_users.js";
import errorHandlers from "../../functions/error-handlers.js";

const blockUser = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {blockedUserId} = request.body;
    if (!blockedUserId) {
      return response.status(400).json({status_code: 400, error: "blockedUserId wajib diisi"});
    }
    const existing = await BlockedUsers.findOne({
      where: {user_id: request.user.id, blocked_user_id: blockedUserId},
    });
    if (existing) {
      return response.json({status_code: 200, data: existing});
    }
    const block = await BlockedUsers.create({
      user_id: request.user.id,
      blocked_user_id: blockedUserId,
    });
    return response.status(201).json({status_code: 201, data: block});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default blockUser;
