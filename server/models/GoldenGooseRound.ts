// 3. Fix for GoldenGooseRound model - correct association naming
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";

class GoldenGooseRound extends Model {
  public id!: number;
  public user_id!: number;
  public result!: string;
  public winning_amount!: number;
  public jackpot_amount!: number;
  public jackpot_type!: string | null;
  public transaction_number!: string;
  public game_id!: string;
  public round_id!: string;
  public crack_count!: number;
  public eggs!: number[];
  public createdAt!: Date;
  public updatedAt!: Date;
  
  // Define user association with consistent naming
  public user?: User;
}

GoldenGooseRound.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    result: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    transaction_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    game_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    round_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    winning_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    jackpot_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    jackpot_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    crack_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    eggs: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    }
  },
  {
    sequelize,
    modelName: "GoldenGooseRound",
    tableName: "golden_goose_rounds",
    timestamps: true,
  }
);

// Use consistent association naming
GoldenGooseRound.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

export default GoldenGooseRound;