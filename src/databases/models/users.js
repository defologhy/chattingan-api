import {DataTypes} from "sequelize";
import sequelize from "../connections/sequelize.js";

const Users = sequelize.define("Users", {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  phone: {type: DataTypes.STRING(20), unique: true, allowNull: false},
  name: {type: DataTypes.STRING(100), allowNull: false},
  password: {type: DataTypes.STRING(255), allowNull: false},
  last_seen: {type: DataTypes.DATE, allowNull: true},
}, {
  tableName: "users",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default Users;
