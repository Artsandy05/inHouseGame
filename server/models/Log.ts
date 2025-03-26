"use strict";

import { DataTypes, Model, Sequelize } from "sequelize"; // Import Sequelize
import sequelize from "../config/database"; // Import your Sequelize instance
import User from "../models/User";

class Log extends Model {
  public id: number;
  public functionality: string;
  public message: string;
  public description: string;
  public level: string;
  public associatedId: number;
  public associatedType: string;
  public createdAt?: Date; 
  public updatedAt!: Date;
  public deletedAt!: Date;
}
Log.init(
  {
    functionality: {
      // Add associatedType column for polymorphic association
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue:""
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue:""
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue:""
    },
    level: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue:""
    },
    associatedId: {
      // Add associatedId column for polymorphic association
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue:0
    },
    associatedType: {
      // Add associatedType column for polymorphic association
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue:""
    },
  },
  {
    sequelize,
    modelName: "Log",
    tableName: "logs",
    timestamps: true,
    // paranoid: true,  // Makes moderator to refresh throw sequelize error
  }
);

Log.belongsTo(User, { foreignKey: "associatedId", as: "user" });

export default Log;
