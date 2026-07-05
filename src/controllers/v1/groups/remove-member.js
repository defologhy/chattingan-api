import GroupMembers from "../../../databases/models/group_members.js";
import Groups from "../../../databases/models/groups.js";
import errorHandlers from "../../functions/error-handlers.js";

const removeMember = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {groupId, userId} = request.params;

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
      return response.status(403).json({status_code: 403, error: "Hanya admin yang bisa menghapus anggota"});
    }

    //3. Cari anggota yang akan dihapus
    const member = await GroupMembers.findOne({
      where: {group_id: groupId, user_id: userId},
    });
    if (!member) {
      return response.status(404).json({status_code: 404, error: "Anggota tidak ditemukan"});
    }

    //4. Cegah admin menghapus diri sendiri (harus via leave/delete group)
    if (member.role === "admin" && Number(userId) === request.user.id) {
      return response.status(400).json({status_code: 400, error: "Admin tidak bisa menghapus diri sendiri. Gunakan fitur leave group"});
    }

    //5. Hapus anggota
    await member.destroy();

    return response.json({status_code: 200, message: "Anggota berhasil dihapus"});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default removeMember;
