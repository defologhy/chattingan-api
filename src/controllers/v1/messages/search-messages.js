import {Op} from "sequelize";
import Messages from "../../../databases/models/messages.js";
import errorHandlers from "../../functions/error-handlers.js";

const searchMessages = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {q, userId} = request.query;
    if (!q) {
      return response.status(400).json({error: "Parameter q wajib diisi"});
    }
    const whereClause = {
      message: {[Op.like]: `%${q}%`},
      [Op.or]: [
        {sender_id: request.user.id, receiver_id: userId || {[Op.ne]: null}},
        {receiver_id: request.user.id, sender_id: userId || {[Op.ne]: null}},
      ],
      [Op.and]: [
        {[Op.or]: [
          {deleted_by: null},
          {deleted_by: {[Op.notIn]: [String(request.user.id), `${request.user.id}`]}},
        ]},
      ],
    };
    const messages = await Messages.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: 50,
    });
    response.json({messages});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default searchMessages;