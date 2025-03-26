"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; 

class GameRoundPlayerData extends Model {
  public id: number;
  public gameName: string;
  public gameId: number;
  public slots: string;
  public uuid: string;
  public isComplete: boolean;
}

GameRoundPlayerData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gameName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    gameId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    slots: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    uuid: {
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
    modelName: "GameRoundPlayerData",
    tableName: "game_round_player_data",
    timestamps: true,
  }
);

export default GameRoundPlayerData;
