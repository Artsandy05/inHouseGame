// Import necessary modules
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // Assuming you have a database configuration

// Define your Sequelize model for user groups
class UserGroup extends Model {}

UserGroup.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    childId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize, // Pass the sequelize instance
    modelName: "UserGroup", // Set the model name
    tableName: "user-groups",
    timestamps: true,
  }
);

// Define associations if needed
// @ts-ignore
UserGroup.associate = (models) => {
  UserGroup.belongsTo(models.User, {
    foreignKey: "parentId",
    onDelete: "CASCADE",
  });
  UserGroup.belongsTo(models.User, {
    foreignKey: "childId",
    onDelete: "CASCADE",
  });
};

export default UserGroup;
