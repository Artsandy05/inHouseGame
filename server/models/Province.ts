"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM
import City from "../models/City";
import Address from "./Address";

class Province extends Model {}

Province.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Each province name should be unique
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null, // Set default value to null
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null, // Set default value to null
    },
  },
  {
    sequelize,
    modelName: "Province",
    tableName: "provinces",
    timestamps: true,
  }
);

export default Province;
