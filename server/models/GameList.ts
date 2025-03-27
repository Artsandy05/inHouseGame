"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM

class GameList extends Model {
  public id: number;
  public firstName!: string | null;
  public label!: string;
  public isActive!: boolean;
  public isStreaming!: boolean;
  public banner!: string;
  public gameRoute!: string;
  public name!: string;
  public moderatorRoute!: string;
  public jackpot_level!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

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
      defaultValue: ""
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    isStreaming: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    moderatorRoute: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    gameRoute: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    banner: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
    },
    jackpot_level: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ""
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

export default GameList;
