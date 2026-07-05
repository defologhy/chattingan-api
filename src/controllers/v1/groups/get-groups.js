import {Op} from "sequelize";
import Groups from "../../../databases/models/groups.js";
import GroupMembers from "../../../databases/models/group_members.js";
import errorHandlers from "../../functions/error-handlers.js";

const getGroups = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    //1. Cari semua group di mana user adalah anggota
    const memberships = await GroupMembers.findAll({
      where: {user_id: request.user.id},
      raw: true,
    });
    const groupIds = memberships.map((m) => m.group_id);
    if (groupIds.length === 0) {
      return response.json({status_code: 200, data: []});
    }

    //2. Ambil data groups
    const groups = await Groups.findAll({
      where: {id: {[Op.in]: groupIds}},
      order: [["updated_at", "DESC"]],
    });

    //3. Ambil jumlah anggota per group
    const memberCounts = {};
    const counts = await GroupMembers.findAll({
      attributes: ["group_id", [GroupMembers.sequelize.fn("COUNT", GroupMembers.sequelize.col("id")), "count"]],
      where: {group_id: {[Op.in]: groupIds}},
      group: ["group_id"],
      raw: true,
    });
    counts.forEach((row) => {
      memberCounts[row.group_id] = row.count;
    });

    const result = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      avatar: g.avatar,
      created_by: g.created_by,
      member_count: memberCounts[g.id] || 0,
      created_at: g.created_at,
      updated_at: g.updated_at,
    }));

    return response.json({status_code: 200, data: result});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default getGroups;
