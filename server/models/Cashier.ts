"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM
import User from "./User"; // Assuming Cashier is a User or has a relationship with User
import RepresentativePlayerTransactions from "./RepresentativePlayerTransactions";

class Cashier extends Model {
  public id: number;
  public transactionId: string;
  public cashierId: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Cashier.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Ensuring each transaction_id is unique
    },
    cashierId: {
      type: DataTypes.STRING,
      allowNull: false, // Cashier should always be linked to a user or an ID
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
    modelName: "Cashier",
    tableName: "cashiers",
    timestamps: true,
  }
);

// Example: If the cashier is associated with a user (such as a staff member or admin)
Cashier.belongsTo(User, { foreignKey: "cashierId" });
// Cashier.belongsTo(RepresentativePlayerTransactions, {
//   foreignKey: 'transactionId',
//   as: 'transaction', // Alias to access the associated transaction
// });

export default Cashier;
