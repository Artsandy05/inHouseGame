"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM

enum TransactionType {
  LOAD = "load",
  DEDUCT = "deduct",
}

enum PersonType {
  ADMIN = "admin",
  USER = "user",
}

class LoadTransaction extends Model {
  public id: number;
  public transactionType: TransactionType;
  public personType: PersonType;
  
  public targetUserId: number;
  public sourceUserId: number;
  public reason: string;
  public attachmentImg: string;

  public createdAt!: Date;
  public updatedAt!: Date;
}

LoadTransaction.init(
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    transactionType: {
      type: DataTypes.ENUM(
        "load",
        "deduct",
      ),
      allowNull: false,
      defaultValue: "load",
    },
    personType: {
        type: DataTypes.ENUM(
          "admin",
          "user",
        ),
        allowNull: false,
        defaultValue: "admin",
    },
    targetUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: {
            tableName: "users", // Ensure the table name is correct
        },
        key: "id",
        },
    },
    sourceUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "users", // Ensure the table name is correct
        },
        key: "id",
        },
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
    },
    attachmentImg: DataTypes.STRING,
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "LoadTransaction",
    tableName: "load-transactions",
    timestamps: true,
  }
);

export default LoadTransaction;
