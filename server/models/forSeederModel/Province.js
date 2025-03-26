const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../config/forSeeder/database"); // assuming you have a database configuration module using CommonJS

class Province extends Model {}

Province.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Each province name should be unique
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
    modelName: "Province",
    tableName: "provinces",
    timestamps: true,
  }
);

module.exports = Province;
