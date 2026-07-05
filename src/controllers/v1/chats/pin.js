import PinnedChats from "../../../databases/models/pinned_chats.js";
import errorHandlers from "../../functions/error-handlers.js";

const pinChat = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {contactId, groupId} = request.body;
    if (!contactId && !groupId) {
      return response.status(400).json({status_code: 400, error: "contactId atau groupId wajib diisi"});
    }
    const existing = await PinnedChats.findOne({
      where: {user_id: request.user.id, contact_id: contactId || null, group_id: groupId || null},
    });
    if (existing) {
      return response.json({status_code: 200, data: existing});
    }
    const pin = await PinnedChats.create({
      user_id: request.user.id,
      contact_id: contactId || null,
      group_id: groupId || null,
    });
    return response.status(201).json({status_code: 201, data: pin});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default pinChat;
