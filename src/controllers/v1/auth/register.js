import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Users from "../../../databases/models/users.js";
import errorHandlers from "../../functions/error-handlers.js";

const register = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {phone, name, password} = request.body;
    if (!phone || !name || !password) {
      return response.status(400).json({error: "Semua field harus diisi"});
    }
    const existing = await Users.findOne({where: {phone}});
    if (existing) {
      return response.status(400).json({error: "Nomor HP sudah terdaftar"});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await Users.create({phone, name, password: hashedPassword});
    const token = jwt.sign(
      {id: user.id, phone, name},
      process.env.JWT_SECRET,
      {expiresIn: "7d"}
    );
    response.cookie("token", token, {httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000});
    response.json({token, user: {id: user.id, phone, name, avatar: user.avatar}});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default register;
