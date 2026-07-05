import {DataTypes} from "sequelize";
import sequelize from "../connections/sequelize.js";

const PinnedChats = sequelize.define("PinnedChats", {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  user_id: {type: DataTypes.INTEGER, allowNull: false},
  contact_id: {type: DataTypes.INTEGER, allowNull: true},
  group_id: {type: DataTypes.INTEGER, allowNull: true},
}, {
  tableName: "pinned_chats",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default PinnedChats;
