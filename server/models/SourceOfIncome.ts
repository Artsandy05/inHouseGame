"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM


class SourceOfIncome extends Model {}

SourceOfIncome.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, 
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null, 
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null, 
    },
  },
  {
    sequelize,
    modelName: "SourceOfIncome",
    tableName: "source-of-income",
    timestamps: true,
  }
);

export default SourceOfIncome;
