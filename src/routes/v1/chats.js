import express from "express";
import pinChat from "../../controllers/v1/chats/pin.js";
import unpinChat from "../../controllers/v1/chats/unpin.js";
import getPinned from "../../controllers/v1/chats/get-pinned.js";
import blockUser from "../../controllers/v1/chats/block.js";
import unblockUser from "../../controllers/v1/chats/unblock.js";
import getBlocked from "../../controllers/v1/chats/get-blocked.js";
import auth from "../../middlewares/auth.js";

const router = new express.Router();

router.post("/pin", auth, async (request, response) => {
  return pinChat(request, response);
});

router.post("/unpin", auth, async (request, response) => {
  return unpinChat(request, response);
});

router.get("/pinned", auth, async (request, response) => {
  return getPinned(request, response);
});

router.post("/block", auth, async (request, response) => {
  return blockUser(request, response);
});

router.post("/unblock", auth, async (request, response) => {
  return unblockUser(request, response);
});

router.get("/blocked", auth, async (request, response) => {
  return getBlocked(request, response);
});

export {router as default};
