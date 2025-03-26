"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM
import GameList from "../models/GameList";

class GameAsset extends Model {
  public id: number;
  public gameId!: number;
  public name!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
}

GameAsset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
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
    modelName: "GameAsset",
    tableName: "game-assets",
    timestamps: true,
  }
);

GameAsset.belongsTo(GameList, { foreignKey: "gameId" });

export default GameAsset;
