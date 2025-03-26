"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM
import User from "../models/User";

class Notification extends Model {
    public id!: number;
    public userId!: number;
    public title!: string;
    public message!: string;
    public module!: string;
    public reference!: string;
    public referenceStatus!: string;
    public isRead!: boolean;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referenceStatus: {
      type: DataTypes.ENUM("forapproval"),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("info", "warning", "error"),
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: true,
  }
);

Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

export default Notification;
