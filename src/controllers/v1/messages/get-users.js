import {Op} from "sequelize";
import Users from "../../../databases/models/users.js";
import errorHandlers from "../../functions/error-handlers.js";

const getUsers = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const users = await Users.findAll({
      where: {id: {[Op.ne]: request.user.id}},
      attributes: ["id", "phone", "name"],
      order: [["name", "ASC"]],
    });
    response.json({users});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default getUsers;
