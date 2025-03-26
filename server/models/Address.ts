"use strict";

import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // assuming you have a database configuration module using ESM
import Province from "../models/Province";
import City from "../models/City";
import Barangay from "../models/Barangay";

class Address extends Model {}

Address.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provinceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "provinces",
        key: "id",
      },
    },
    barangayId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "barangays",
        key: "id",
      },
    },
    cityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "cities",
        key: "id",
      },
    },
    zipCode: {
      type: DataTypes.STRING(4), // Assuming 4-digit ZIP code for the Philippines
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Address",
    tableName: "addresses",
    timestamps: true,
  }
);
// //  @ts-ignore
// Address.associate = (models) => {
//   Address.belongsTo(models.Province, {
//     as: "province",
//     foreignKey: "provinceId",
//   });
//   Address.belongsTo(models.City, {
//     as: "city",
//     foreignKey: "cityId",
//   });
//   Address.belongsTo(models.Barangay, {
//     as: "barangay",
//     foreignKey: "barangayId",
//   });
// };

Address.belongsTo(Province, {
  foreignKey: "provinceId", // Assuming your Address model has a foreign key named "userId"
  as: "province",
});
Address.belongsTo(City, {
  foreignKey: "cityId", // Assuming your Address model has a foreign key named "userId"
  as: "city",
});
Address.belongsTo(Barangay, {
  foreignKey: "barangayId", // Assuming your Address model has a foreign key named "userId"
  as: "barangay",
});

export default Address;
