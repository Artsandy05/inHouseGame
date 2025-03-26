"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; 

class GameRoundData extends Model {
  public id: number;
  public gameId: string;
  public state: string;
  public gamesTableId: string;
  public walkinPlayers: string;
  public gameName: string;
  public playerCurrentBalance: string;
  public isComplete: boolean;
}

GameRoundData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    gamesTableId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    walkinPlayers: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    playerCurrentBalance: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    gameName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    isComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
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
    modelName: "GameRoundData",
    tableName: "game_round_data",
    timestamps: true,
  }
);

export default GameRoundData;
