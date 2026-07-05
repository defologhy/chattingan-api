import GroupMembers from "../../../databases/models/group_members.js";
import Users from "../../../databases/models/users.js";
import Groups from "../../../databases/models/groups.js";
import errorHandlers from "../../functions/error-handlers.js";

const getMembers = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {groupId} = request.params;

    //1. Validasi group exists & user adalah anggota
    const group = await Groups.findByPk(groupId);
    if (!group) {
      return response.status(404).json({status_code: 404, error: "Group tidak ditemukan"});
    }
    const membership = await GroupMembers.findOne({
      where: {group_id: groupId, user_id: request.user.id},
    });
    if (!membership) {
      return response.status(403).json({status_code: 403, error: "Anda bukan anggota group ini"});
    }

    //2. Ambil anggota
    const members = await GroupMembers.findAll({
      where: {group_id: groupId},
      include: [{
        model: Users,
        as: "User",
        attributes: ["id", "name", "phone", "avatar", "last_seen"],
      }],
      order: [["role", "ASC"], ["joined_at", "ASC"]],
    });

    const result = members.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      name: m.User?.name,
      phone: m.User?.phone,
      avatar: m.User?.avatar,
      last_seen: m.User?.last_seen,
      role: m.role,
      joined_at: m.joined_at,
    }));

    return response.json({status_code: 200, data: result});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default getMembers;
