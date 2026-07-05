import express from "express";
import register from "../../controllers/v1/auth/register.js";
import login from "../../controllers/v1/auth/login.js";
import me from "../../controllers/v1/auth/me.js";
import logout from "../../controllers/v1/auth/logout.js";
import avatar from "../../controllers/v1/auth/avatar.js";
import auth from "../../middlewares/auth.js";

const router = new express.Router();

router.post("/register", async (request, response) => {
  return register(request, response);
});

router.post("/login", async (request, response) => {
  return login(request, response);
});

router.get("/me", auth, async (request, response) => {
  return me(request, response);
});

router.post("/logout", async (request, response) => {
  return logout(request, response);
});

router.post("/avatar", auth, async (request, response) => {
  return avatar(request, response);
});

export {router as default};
