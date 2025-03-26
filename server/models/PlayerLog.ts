
import { DataTypes, Model, Op } from "sequelize";
import sequelize from "../config/database"; // Assuming your Sequelize instance is in a separate file
import User from "./User";

class PlayerLog extends Model {
  public id: number;
  public userId: number;
  public type: string;
  public mode: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

PlayerLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "users",
      key: "id",
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  type: {
    type: DataTypes.ENUM('in', 'out'),
    allowNull: false,
  },
  mode: {
    type: DataTypes.ENUM("game", "admin", "operator"),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null, // Set default value to null
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  sequelize,
  modelName: 'PlayerLog',
  tableName: "player-logs",
});

PlayerLog.belongsTo(User, { foreignKey: "userId"});

export default PlayerLog;