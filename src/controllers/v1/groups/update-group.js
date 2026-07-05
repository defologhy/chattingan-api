import Groups from "../../../databases/models/groups.js";
import GroupMembers from "../../../databases/models/group_members.js";
import errorHandlers from "../../functions/error-handlers.js";

const updateGroup = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {groupId} = request.params;
    const {name, description} = request.body;

    //1. Validasi group exists
    const group = await Groups.findByPk(groupId);
    if (!group) {
      return response.status(404).json({status_code: 404, error: "Group tidak ditemukan"});
    }

    //2. Cek apakah user adalah admin
    const requester = await GroupMembers.findOne({
      where: {group_id: groupId, user_id: request.user.id},
    });
    if (!requester || requester.role !== "admin") {
      return response.status(403).json({status_code: 403, error: "Hanya admin yang bisa mengubah group"});
    }

    //3. Update group
    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;

    await group.update(updateData);

    return response.json({status_code: 200, data: group});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default updateGroup;
