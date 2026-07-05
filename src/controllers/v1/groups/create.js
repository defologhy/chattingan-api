import sequelize from "../../../databases/connections/sequelize.js";
import Groups from "../../../databases/models/groups.js";
import GroupMembers from "../../../databases/models/group_members.js";
import errorHandlers from "../../functions/error-handlers.js";

const create = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    //1. Ambil data dari body
    const {name, description, memberIds} = request.body;
    if (!name || !name.trim()) {
      return response.status(400).json({status_code: 400, error: "Nama group wajib diisi"});
    }
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return response.status(400).json({status_code: 400, error: "Pilih minimal 1 anggota group"});
    }

    //2. Buat group + anggota dalam 1 transaksi
    const result = await sequelize.transaction(async (t) => {
      const group = await Groups.create({
        name: name.trim(),
        description: description || null,
        created_by: request.user.id,
      }, {transaction: t});

      // Gabung creator + memberIds, pastikan unique
      const allMemberIds = [...new Set([request.user.id, ...memberIds.map(Number)])];
      const memberRows = allMemberIds.map((uid) => ({
        group_id: group.id,
        user_id: uid,
        role: uid === request.user.id ? "admin" : "member",
      }));
      await GroupMembers.bulkCreate(memberRows, {transaction: t});
      return group;
    });

    //3. Ambil data lengkap group
    const groupData = await Groups.findByPk(result.id);

    return response.status(201).json({status_code: 201, data: groupData});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default create;
