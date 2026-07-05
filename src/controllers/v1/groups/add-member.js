import GroupMembers from "../../../databases/models/group_members.js";
import Groups from "../../../databases/models/groups.js";
import Users from "../../../databases/models/users.js";
import errorHandlers from "../../functions/error-handlers.js";

const addMember = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {groupId} = request.params;
    const {userId} = request.body;

    if (!userId) {
      return response.status(400).json({status_code: 400, error: "userId wajib diisi"});
    }

    //1. Validasi group exists
    const group = await Groups.findByPk(groupId);
    if (!group) {
      return response.status(404).json({status_code: 404, error: "Group tidak ditemukan"});
    }

    //2. Cek apakah user yang request adalah admin
    const requester = await GroupMembers.findOne({
      where: {group_id: groupId, user_id: request.user.id},
    });
    if (!requester || requester.role !== "admin") {
      return response.status(403).json({status_code: 403, error: "Hanya admin yang bisa menambah anggota"});
    }

    //3. Validasi user yang ditambahkan ada
    const targetUser = await Users.findByPk(userId);
    if (!targetUser) {
      return response.status(404).json({status_code: 404, error: "User tidak ditemukan"});
    }

    //4. Cek apakah sudah menjadi anggota
    const existing = await GroupMembers.findOne({
      where: {group_id: groupId, user_id: userId},
    });
    if (existing) {
      return response.status(400).json({status_code: 400, error: "User sudah menjadi anggota group"});
    }

    //5. Tambah anggota
    const member = await GroupMembers.create({
      group_id: groupId,
      user_id: userId,
      role: "member",
    });

    return response.status(201).json({status_code: 201, data: member});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default addMember;
