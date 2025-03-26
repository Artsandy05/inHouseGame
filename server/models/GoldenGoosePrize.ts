"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class GoldenGoosePrize extends Model {
  public id: number;
  public type: string;
  public amount: number;
  public count: number; // To track how many times this jackpot level has been awarded
  public createdAt!: Date;
  public updatedAt!: Date;
}

GoldenGoosePrize.init(
  {
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2), // Increased precision for larger amounts
      allowNull: false,
      defaultValue: 0
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: "GoldenGoosePrize",
    tableName: "golden_goose_prizes",
    timestamps: true,
  }
);

export default GoldenGoosePrize;