import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Cashier from './Cashier';

class RepresentativePlayerTransactions extends Model {
  public id!: number;
  public game_id!: number;
  public representative_id!: number;
  public type!: string;
  public status!: string;
  public ball!: string;
  public game_name!: string;
  public winning_amount!: number;
  public bet_amount!: number;
  public ticket_number!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public odds: number;
}

RepresentativePlayerTransactions.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ticket_number: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  representative_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  winning_amount: {
    type: DataTypes.DECIMAL(32, 8),
    allowNull: false,
  },
  bet_amount: {
    type: DataTypes.DECIMAL(32, 8),
    allowNull: false,
  },
  odds: {
    type: DataTypes.DECIMAL(32, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  type: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  ball: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  game_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  status: {
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
  modelName: 'representativePlayerTransactions',
  tableName: 'representative_player_transactions',
  timestamps: false,  // Set this to true if you want Sequelize to manage `createdAt` and `updatedAt`
});

RepresentativePlayerTransactions.hasMany(Cashier, {
  foreignKey: 'transactionId',
  as: 'cashiers', // Alias to access associated cashiers
});

export default RepresentativePlayerTransactions;
