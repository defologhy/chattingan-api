import express from "express";
import getUsers from "../../controllers/v1/messages/get-users.js";
import getMessages from "../../controllers/v1/messages/get-messages.js";
import auth from "../../middlewares/auth.js";

const router = new express.Router();

router.get("/users", auth, async (request, response) => {
  return getUsers(request, response);
});

router.get("/:userId", auth, async (request, response) => {
  return getMessages(request, response);
});

export {router as default};
