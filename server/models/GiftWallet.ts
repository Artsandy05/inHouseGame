// Message.ts
import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';

class GiftWallet extends Model {
  public id!: number;
  public amount!: number;
  public latest_sender_id!: number;
  public latest_host_id!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

GiftWallet.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  latest_sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  latest_host_id: {
    type: DataTypes.INTEGER,
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
  modelName: 'giftWallet',
  tableName: 'gift_wallet',
  timestamps: false,
});


export default GiftWallet;
