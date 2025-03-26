import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import RepresentativePlayerBets from './RepresentativePlayerBets';  // Import the associated model

class RepresentativeBetInfo extends Model {
  public id!: number;
  public representative_id!: number;
  public game_name!: string;
  public ticket_number!: string;
  public total_number_of_bets!: number;
  public total_amount!: number;
  public payment_amount!: number;
  public change_amount!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

RepresentativeBetInfo.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  representative_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  game_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  ticket_number: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  total_number_of_bets: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_amount: {
    type: DataTypes.DECIMAL(32, 8),
    allowNull: false,
  },
  payment_amount: {
    type: DataTypes.DECIMAL(32, 8),
    allowNull: false,
  },
  change_amount: {
    type: DataTypes.DECIMAL(32, 8),
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
  modelName: 'representativeBetInfo',
  tableName: 'representative_bet_info',
  timestamps: false,
});



export default RepresentativeBetInfo;
