import {Op} from "sequelize";
import Messages from "../../../databases/models/messages.js";
import errorHandlers from "../../functions/error-handlers.js";

const getMessages = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {userId} = request.params;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = request.query.search || "";

    const whereClause = {
      [Op.or]: [
        {sender_id: request.user.id, receiver_id: userId},
        {sender_id: userId, receiver_id: request.user.id},
      ],
      [Op.and]: [
        {[Op.or]: [
          {deleted_by: null},
          {deleted_by: {[Op.notIn]: [String(request.user.id), `${request.user.id}`]}},
        ]},
      ],
    };

    if (search) {
      whereClause.message = {[Op.like]: `%${search}%`};
    }

    const {rows: messages, count: total} = await Messages.findAndCountAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    // Mark as read
    await Messages.update(
      {is_read: true, read_at: new Date()},
      {where: {sender_id: userId, receiver_id: request.user.id, is_read: false}}
    );

    response.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default getMessages;
