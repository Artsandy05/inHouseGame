const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../config/forSeeder/database"); // Assuming you have a database configuration module

// Define the Barangay model
class Barangay extends Model {}

// Initialize the Barangay model with attributes and options
Barangay.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize, // Pass the Sequelize instance
    modelName: "Barangay", // Model name
    tableName: "barangays", // Table name in the database
    timestamps: true, // Include timestamps (createdAt, updatedAt)
  }
);

// Export the Barangay model
module.exports = Barangay;
