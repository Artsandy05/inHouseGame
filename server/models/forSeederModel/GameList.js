"use strict";

const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../config/forSeeder/database"); // Assuming you have a database configuration module

class GameList extends Model {}

GameList.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Each province name should be unique
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
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
    modelName: "GameList",
    tableName: "games-list",
    timestamps: true,
  }
);

module.exports = GameList;
