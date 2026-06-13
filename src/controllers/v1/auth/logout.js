const logout = async (request, response) => {
  response.clearCookie("token");
  response.json({message: "Logout success"});
};

export default logout;
