import PinnedChats from "../../../databases/models/pinned_chats.js";
import errorHandlers from "../../functions/error-handlers.js";

const unpinChat = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {contactId, groupId} = request.body;
    const where = {user_id: request.user.id};
    if (contactId) where.contact_id = contactId;
    if (groupId) where.group_id = groupId;
    await PinnedChats.destroy({where});
    return response.json({status_code: 200, message: "Chat berhasil di-unpin"});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default unpinChat;
