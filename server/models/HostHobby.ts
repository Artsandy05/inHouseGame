import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Hobby from "./Hobby";
import User from "./User";
import HostProfile from "./HostProfile";

// Define Transaction model
class HostHobby extends Model {
  public id: number;
  public userId: number;
  public hobbyId: number;
}

HostHobby.init(
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    hostProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    hobbyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "HostHobby",
    tableName: "host-hobbies",
    timestamps: true,
  }
);

HostHobby.belongsTo(HostProfile, { foreignKey: 'hostProfileId' });
HostHobby.belongsTo(Hobby, { foreignKey: 'hobbyId' });

export default HostHobby;
