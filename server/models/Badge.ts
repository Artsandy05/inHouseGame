"use strict";

import { DataTypes, Model } from "sequelize"; // Import Sequelize
import sequelize from "../config/database"; // Import your Sequelize instance

class Badge extends Model {
  public id: number;
  public description: string;
  public rank: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Badge.init(
  {
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    rank: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "",
    },
  },
  {
    sequelize,
    modelName: "Badge",
    tableName: "badges", // Name of the table in the database
    timestamps: true, // Includes createdAt and updatedAt
  }
);

export default Badge;
