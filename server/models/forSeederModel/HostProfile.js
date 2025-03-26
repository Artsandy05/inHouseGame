const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../config/forSeeder/database"); // assuming you have a database configuration module using CommonJS

// Define Transaction model
class HostProfile extends Model {}

HostProfile.init(
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    hostName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    birthday: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    assetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    facebookLink: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
  {
    sequelize,
    modelName: "HostProfile",
    tableName: "host-profile",
    timestamps: true,
  }
);


module.exports = HostProfile;
