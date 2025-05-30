"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM


class Site extends Model {}

Site.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, 
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
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
    modelName: "Site",
    tableName: "sites",
    timestamps: true,
  }
);

export default Site;
