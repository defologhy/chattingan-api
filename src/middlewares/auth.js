import jwt from "jsonwebtoken";

const auth = async (request, response, next) => {
  const token = request.cookies?.token || request.headers?.authorization?.split(" ")[1];
  if (!token) {
    return response.status(401).json({error: "Unauthorized"});
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
    next();
  } catch (error) {
    return response.status(401).json({error: "Invalid token"});
  }
};

export default auth;
