// Message.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';

class Message extends Model {
  public id!: number;
  public conversation_id!: number;
  public sender_id!: number;
  public message_text!: string;
  public createdAt!: Date;
  public isRead!: boolean;
  public isImage!: boolean;
  public isReadByCSR!: boolean;
}

Message.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  isImage: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  isReadByCSR: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Message',
  tableName: 'messages',
  timestamps: false,
});


export default Message;
