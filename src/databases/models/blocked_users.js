import {DataTypes} from "sequelize";
import sequelize from "../connections/sequelize.js";

const BlockedUsers = sequelize.define("BlockedUsers", {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  user_id: {type: DataTypes.INTEGER, allowNull: false},
  blocked_user_id: {type: DataTypes.INTEGER, allowNull: false},
}, {
  tableName: "blocked_users",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default BlockedUsers;
