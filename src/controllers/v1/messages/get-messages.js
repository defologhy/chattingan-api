import {Op} from "sequelize";
import Messages from "../../../databases/models/messages.js";
import errorHandlers from "../../functions/error-handlers.js";

const getMessages = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {userId} = request.params;
    const messages = await Messages.findAll({
      where: {
        [Op.or]: [
          {sender_id: request.user.id, receiver_id: userId},
          {sender_id: userId, receiver_id: request.user.id},
        ],
      },
      order: [["created_at", "ASC"]],
    });
    await Messages.update(
      {read_at: new Date()},
      {
        where: {sender_id: userId, receiver_id: request.user.id, read_at: null},
      }
    );
    response.json({messages});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default getMessages;
