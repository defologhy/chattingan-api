import {DataTypes} from "sequelize";
import sequelize from "../connections/sequelize.js";
import Users from "./users.js";

const GroupMembers = sequelize.define("GroupMembers", {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  group_id: {type: DataTypes.INTEGER, allowNull: false},
  user_id: {type: DataTypes.INTEGER, allowNull: false},
  role: {type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member', allowNull: false},
  joined_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
}, {
  tableName: "group_members",
  timestamps: false,
});

GroupMembers.belongsTo(Users, {foreignKey: "user_id", as: "User"});

export default GroupMembers;
