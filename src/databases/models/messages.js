import {DataTypes} from "sequelize";
import sequelize from "../connections/sequelize.js";

const Messages = sequelize.define("Messages", {
  id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
  sender_id: {type: DataTypes.INTEGER, allowNull: false},
  receiver_id: {type: DataTypes.INTEGER, allowNull: true},
  group_id: {type: DataTypes.INTEGER, allowNull: true},
  message: {type: DataTypes.TEXT, allowNull: false},
  message_type: {type: DataTypes.ENUM('text', 'image', 'voice', 'document'), defaultValue: 'text', allowNull: false},
  reply_to_id: {type: DataTypes.INTEGER, allowNull: true},
  reactions: {type: DataTypes.JSON, allowNull: true},
  is_read: {type: DataTypes.BOOLEAN, defaultValue: false},
  delivered_at: {type: DataTypes.DATE, allowNull: true},
  read_at: {type: DataTypes.DATE, allowNull: true},
  deleted_by: {type: DataTypes.STRING(50), allowNull: true},
}, {
  tableName: "messages",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false,
});

export default Messages;
