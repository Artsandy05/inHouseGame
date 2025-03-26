const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../config/forSeeder/database"); // Assuming you have a database configuration module

// Define the City model
class City extends Model {}

// Initialize the City model with attributes and options
City.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provinceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize, // Pass the Sequelize instance
    modelName: "City", // Model name
    tableName: "cities", // Table name in the database
    timestamps: true, // Include timestamps (createdAt, updatedAt)
    // Other options can be added here as needed
  }
);

// Export the City model
module.exports = City;
