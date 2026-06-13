import jwt from "jsonwebtoken";
import Users from "../../../databases/models/users.js";
import errorHandlers from "../../functions/error-handlers.js";

const me = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const token = request.cookies?.token || request.headers?.authorization?.split(" ")[1];
    if (!token) return response.status(401).json({error: "Unauthorized"});
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Users.findByPk(decoded.id, {attributes: ["id", "phone", "name"]});
    if (!user) return response.status(404).json({error: "User not found"});
    response.json({user});
  } catch (error) {
    return response.status(401).json(errorHandlers(error, url));
  }
};

export default me;
