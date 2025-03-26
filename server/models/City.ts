import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Province from "../models/Province";
import Address from "./Address";

class City extends Model {}

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
    modelName: "City",
    tableName: "cities",
    timestamps: true,
    // Other options can be added here as needed
  }
);

City.belongsTo(Province, { foreignKey: "provinceId", as: "provinces" });

export default City;
