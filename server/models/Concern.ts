import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Concern extends Model {
  public id!: number;
  public concern_type!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Concern.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  concern_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
  }
}, {
  sequelize,
  modelName: 'Concern',
  tableName: 'concerns',
  timestamps: false,
});

export default Concern;
