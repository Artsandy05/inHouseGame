import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import GameAsset from "./GameAsset";

// Define Transaction model
class HostProfile extends Model {
  public id: number;
  public userId: number;
  public hostName: string;
  public location: string;
  public birthday: string;
  public assetId: number;
  public facebookLink: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

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

User.hasOne(HostProfile, { foreignKey: "userId" });
HostProfile.belongsTo(User, { foreignKey: 'userId' });

HostProfile.belongsTo(GameAsset, { foreignKey: 'assetId' });

export default HostProfile;
