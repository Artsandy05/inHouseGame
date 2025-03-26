"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM
import User from "./User";

class Cards extends Model {
  public id: number;
  public userId: number;
  public mobile!: string | null;
  public accountId: number;
  public password!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Cards.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        name: "mobile",
        msg: "This mobile is already taken",
      },
      defaultValue: "",
    },
    accountId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
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
    modelName: "Cards",
    tableName: "cards",
    timestamps: true,
  }
);

Cards.belongsTo(User, { foreignKey: "userId" });

export default Cards;
