import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import RepresentativeBetInfo from './RepresentativeBetInfo';  // Import the associated model

class RepresentativePlayerBets extends Model {
  public id!: number;
  public representative_bet_info_id!: number;
  public zodiac_ball_name!: string;
  public quantity!: number;
  public total_bet!: number;
  public bet_type!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

RepresentativePlayerBets.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  representative_bet_info_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  zodiac_ball_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total_bet: {
    type: DataTypes.DECIMAL(32, 8),
    allowNull: false,
  },
  bet_type: {
    type: DataTypes.STRING(200),
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
  modelName: 'representativePlayerBets',
  tableName: 'representative_player_bets',
  timestamps: false,
});



export default RepresentativePlayerBets;
