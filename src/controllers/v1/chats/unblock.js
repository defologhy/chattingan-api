import BlockedUsers from "../../../databases/models/blocked_users.js";
import errorHandlers from "../../functions/error-handlers.js";

const unblockUser = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {blockedUserId} = request.body;
    await BlockedUsers.destroy({
      where: {user_id: request.user.id, blocked_user_id: blockedUserId},
    });
    return response.json({status_code: 200, message: "User berhasil di-unblock"});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default unblockUser;
