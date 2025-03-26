"use strict";

import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';

class ConversationStatusUpdate extends Model {
  public id!: number;
  public conversation_id!: number;
  public status!: string;
  public updated_by!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

ConversationStatusUpdate.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'ConversationStatusUpdate',
  tableName: 'conversation_status_updates',
  timestamps: false,
});



export default ConversationStatusUpdate;
