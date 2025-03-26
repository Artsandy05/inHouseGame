"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class GoldenGooseRound extends Model {
  public id: number;
  public user_id: number;
  public result: string;
  public winning_amount: number;
  public jackpot_amount: number;
  public jackpot_type: string | null;
  public crack_count: number;
  public eggs: number[];
  public createdAt!: Date;
  public updatedAt!: Date;
}

GoldenGooseRound.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    result: {
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

export default GoldenGooseRound;