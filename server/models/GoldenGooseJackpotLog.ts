"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class GoldenGooseJackpotLog extends Model {
  public id!: number;
  public userId!: number;
  public amount!: number;
  public type!: 'mini' | 'minor' | 'major' | 'grand';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GoldenGooseJackpotLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('mini', 'minor', 'major', 'grand'),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    modelName: "GoldenGooseJackpotLog",
    tableName: "golden_goose_jackpot_logs",
    timestamps: true,
    underscored: true,
  }
);

export default GoldenGooseJackpotLog;