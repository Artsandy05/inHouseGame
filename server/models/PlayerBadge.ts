"use strict";

import { DataTypes, Model } from "sequelize"; // Import Sequelize
import sequelize from "../config/database"; 
import Badge from "./Badge";
import User from "./User";

class PlayerBadge extends Model {
  public id: number;
  public badgeId: number;
  public userId: number;
  public expirationDate: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
}

PlayerBadge.init(
  {
    badgeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Badge, // Reference the Badge model
        key: "id", // Reference the id field in the Badge model
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User, // Reference the User model
        key: "id", // Reference the id field in the User model
      },
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null, // Expiration date can be null if the badge doesn't expire
    },
  },
  {
    sequelize,
    modelName: "PlayerBadge",
    tableName: "player_badges", // The name of the table in the database
    timestamps: true, // Includes createdAt and updatedAt
  }
);

// Associations
PlayerBadge.belongsTo(Badge, { foreignKey: "badgeId", as: "badge" });
PlayerBadge.belongsTo(User, { foreignKey: "userId", as: "user" });

export default PlayerBadge;
