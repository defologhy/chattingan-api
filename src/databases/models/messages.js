import {DataTypes} from "sequelize";
import sequelize from "../connections/sequelize.js";

const Messages = sequelize.define("Messages", {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  sender_id: {type: DataTypes.INTEGER, allowNull: false},
  receiver_id: {type: DataTypes.INTEGER, allowNull: false},
  message: {type: DataTypes.TEXT, allowNull: false},
  is_read: {type: DataTypes.BOOLEAN, defaultValue: false},
  read_at: {type: DataTypes.DATE, allowNull: true},
  deleted_by: {type: DataTypes.STRING(50), allowNull: true},
}, {
  tableName: "messages",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default Messages;
