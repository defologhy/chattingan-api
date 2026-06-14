import express from "express";
import getUsers from "../../controllers/v1/messages/get-users.js";
import getMessages from "../../controllers/v1/messages/get-messages.js";
import deleteMessage from "../../controllers/v1/messages/delete-message.js";
import unreadCounts from "../../controllers/v1/messages/unread-counts.js";
import searchMessages from "../../controllers/v1/messages/search-messages.js";
import auth from "../../middlewares/auth.js";

const router = new express.Router();

router.get("/users", auth, async (request, response) => {
  return getUsers(request, response);
});

router.get("/search", auth, async (request, response) => {
  return searchMessages(request, response);
});

router.get("/unread", auth, async (request, response) => {
  return unreadCounts(request, response);
});

router.get("/:userId", auth, async (request, response) => {
  return getMessages(request, response);
});

router.delete("/:messageId", auth, async (request, response) => {
  return deleteMessage(request, response);
});

export {router as default};
