import {DataTypes} from "sequelize";
import sequelize from "../connections/sequelize.js";

const Groups = sequelize.define("Groups", {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  name: {type: DataTypes.STRING(100), allowNull: false},
  description: {type: DataTypes.TEXT, allowNull: true},
  avatar: {type: DataTypes.STRING, allowNull: true},
  created_by: {type: DataTypes.INTEGER, allowNull: false},
}, {
  tableName: "groups",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export default Groups;
