"use strict";

import { DataTypes, Model } from "sequelize"; // Import Sequelize
import sequelize from "../config/database"; // Import your Sequelize instance
import User from "./User"; // Import the User model

class Gifting extends Model {
  public id!: number;
  public host_id!: number; // Foreign key referencing User
  public gifter_id!: number; // Foreign key referencing User
  public amount!: number; // Amount of the gift
  public createdAt!: Date; // Timestamp for when the gift was created
  public updatedAt!: Date; // Timestamp for when the gift was updated
}

// Initialize the Gifting model
Gifting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    host_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    gifter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(32, 2), // Adjust precision and scale as necessary
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
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
    modelName: "Gifting",
    tableName: "giftings",
    timestamps: false, // Disable automatic timestamps to use custom fields
  }
);

// Define associations
Gifting.belongsTo(User, {
  foreignKey: "host_id"
});

Gifting.belongsTo(User, {
  foreignKey: "gifter_id"
});

export default Gifting;
