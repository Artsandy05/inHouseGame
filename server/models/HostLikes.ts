"use strict";

import { DataTypes, Model } from "sequelize"; // Import Sequelize
import sequelize from "../config/database"; // Import your Sequelize instance
import User from "./User"; // Import the User model

class HostLikes extends Model {
  public id!: number;
  public host_id!: number; // Foreign key referencing User
  public liker_id!: number; // Foreign key referencing User
  public createdAt!: Date; // Timestamp for when the like was created
  public updatedAt!: Date; // Timestamp for when the like was updated
}

// Initialize the HostLikes model
HostLikes.init(
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
    liker_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
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
    modelName: "HostLikes",
    tableName: "host_likes",
    timestamps: false, // Disable automatic timestamps to use custom fields
  }
);

// Define associations
HostLikes.belongsTo(User, {
  foreignKey: "host_id",
  as: "host", // Alias for the host
});

HostLikes.belongsTo(User, {
  foreignKey: "liker_id",
  as: "liker", // Alias for the liker
});

export default HostLikes;
