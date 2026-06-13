import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Users from "../../../databases/models/users.js";
import errorHandlers from "../../functions/error-handlers.js";

const login = async (request, response) => {
  const url = process.env.APP_BASE_URL + request.originalUrl;
  try {
    const {phone, password} = request.body;
    if (!phone || !password) {
      return response.status(400).json({error: "Semua field harus diisi"});
    }
    const user = await Users.findOne({where: {phone}});
    if (!user) {
      return response.status(400).json({error: "Nomor HP tidak terdaftar"});
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return response.status(400).json({error: "Password salah"});
    }
    const token = jwt.sign(
      {id: user.id, phone: user.phone, name: user.name},
      process.env.JWT_SECRET,
      {expiresIn: "7d"}
    );
    response.cookie("token", token, {httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000});
    response.json({token, user: {id: user.id, phone: user.phone, name: user.name}});
  } catch (error) {
    return response.status(400).json(errorHandlers(error, url));
  }
};

export default login;
