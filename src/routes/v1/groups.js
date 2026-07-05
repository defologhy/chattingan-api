import express from "express";
import create from "../../controllers/v1/groups/create.js";
import getGroups from "../../controllers/v1/groups/get-groups.js";
import getMembers from "../../controllers/v1/groups/get-members.js";
import addMember from "../../controllers/v1/groups/add-member.js";
import removeMember from "../../controllers/v1/groups/remove-member.js";
import updateGroup from "../../controllers/v1/groups/update-group.js";
import auth from "../../middlewares/auth.js";

const router = new express.Router();

router.post("/", auth, async (request, response) => {
  return create(request, response);
});

router.get("/", auth, async (request, response) => {
  return getGroups(request, response);
});

router.get("/:groupId/members", auth, async (request, response) => {
  return getMembers(request, response);
});

router.post("/:groupId/members", auth, async (request, response) => {
  return addMember(request, response);
});

router.delete("/:groupId/members/:userId", auth, async (request, response) => {
  return removeMember(request, response);
});

router.patch("/:groupId", auth, async (request, response) => {
  return updateGroup(request, response);
});

export {router as default};
