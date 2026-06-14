import {Op} from "sequelize";
import Users from "../../../databases/models/users.js";
import Messages from "../../../databases/models/messages.js";
import errorHandlers from "../../functions/error-handlers.js";

const getUsers = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const search = request.query.search || "";
    const whereClause = {id: {[Op.ne]: request.user.id}};
    if (search) {
      whereClause[Op.or] = [
        {name: {[Op.like]: `%${search}%`}},
        {phone: {[Op.like]: `%${search}%`}},
      ];
    }
    const users = await Users.findAll({
      where: whereClause,
      attributes: ["id", "phone", "name", "last_seen"],
      order: [["name", "ASC"]],
    });

    // Ambil unread count per user
    const unreadCounts = {};
    const unreadData = await Messages.findAll({
      attributes: ["sender_id", [Messages.sequelize.fn("COUNT", Messages.sequelize.col("id")), "count"]],
      where: {receiver_id: request.user.id, is_read: false, deleted_by: null},
      group: ["sender_id"],
      raw: true,
    });
    unreadData.forEach((row) => {
      unreadCounts[row.sender_id] = row.count;
    });

    const result = users.map((u) => ({
      id: u.id,
      phone: u.phone,
      name: u.name,
      last_seen: u.last_seen,
      unread_count: unreadCounts[u.id] || 0,
    }));

    response.json({users: result});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default getUsers;
