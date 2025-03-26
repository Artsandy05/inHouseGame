import { DataTypes, Model } from 'sequelize';
import sequelize from "../config/database";
import User from './User';
import Referral from './Referral';

class ChatRate extends Model {
  public id!: number;
  public player_id!: number;
  public csr_id!: number;
  public conversation_id!: number;
  public rate!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

ChatRate.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  player_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  csr_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  conversation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'chatRate',
  tableName: 'chat_rate',
  timestamps: true
});

export default ChatRate;
