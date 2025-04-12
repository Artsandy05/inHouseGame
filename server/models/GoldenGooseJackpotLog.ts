import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";

class GoldenGooseJackpotLog extends Model {
  public id!: number;
  public user_id!: number;
  public amount!: number;
  public type!: 'mini' | 'minor' | 'major' | 'grand';
  public game_round_id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  
  // Define user association
  public user?: User;
}

GoldenGooseJackpotLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id' // Map to correct DB column
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('mini', 'minor', 'major', 'grand'),
      allowNull: false,
    },
    game_round_id: {
      type: DataTypes.STRING(50),
      field: 'game_round_id',
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "GoldenGooseJackpotLog",
    tableName: "golden_goose_jackpot_logs",
    timestamps: true,
  }
);

// Ensure consistent association naming
GoldenGooseJackpotLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

export default GoldenGooseJackpotLog;