"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class GoldenGooseTransaction extends Model {
  public id!: number;
  public game_id!: string;
  public round_id!: string;
  public transaction_number!: string;
  public amount!: number;
  public type!: 'bet' | 'payout';
  public createdAt!: Date;
  public updatedAt!: Date;
}

GoldenGooseTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    game_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    round_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    transaction_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('bet', 'payout'),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: "GoldenGooseTransaction",
    tableName: "golden_goose_transactions",
    timestamps: true,
  }
);

export default GoldenGooseTransaction;