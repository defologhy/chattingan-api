import {Op} from "sequelize";
import Messages from "../../../databases/models/messages.js";
import GroupMembers from "../../../databases/models/group_members.js";
import errorHandlers from "../../functions/error-handlers.js";

const getGroupMessages = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {groupId} = request.params;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Validasi user adalah anggota group
    const membership = await GroupMembers.findOne({
      where: {group_id: groupId, user_id: request.user.id},
    });
    if (!membership) {
      return response.status(403).json({status_code: 403, error: "Anda bukan anggota group ini"});
    }

    const whereClause = {
      group_id: groupId,
      [Op.and]: [
        {[Op.or]: [
          {deleted_by: null},
          {deleted_by: {[Op.notIn]: [String(request.user.id), `${request.user.id}`]}},
        ]},
      ],
    };

    const {rows: messages, count: total} = await Messages.findAndCountAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

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

export default getGroupMessages;
