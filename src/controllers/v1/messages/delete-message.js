import {Op} from "sequelize";
import Messages from "../../../databases/models/messages.js";
import errorHandlers from "../../functions/error-handlers.js";

const deleteMessage = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {messageId} = request.params;
    const message = await Messages.findByPk(messageId);
    if (!message) {
      return response.status(404).json({error: "Pesan tidak ditemukan"});
    }
    if (message.sender_id !== request.user.id && message.receiver_id !== request.user.id) {
      return response.status(403).json({error: "Tidak diizinkan"});
    }
    const mode = request.body?.mode || "self";
    if (mode === "self") {
      if (message.deleted_by) {
        const existing = message.deleted_by.split(",");
        if (!existing.includes(String(request.user.id))) {
          existing.push(String(request.user.id));
          await message.update({deleted_by: existing.join(",")});
        }
      } else {
        await message.update({deleted_by: String(request.user.id)});
      }
    } else {
      await message.update({deleted_by: `${message.sender_id},${message.receiver_id}`});
    }
    response.json({success: true});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default deleteMessage;