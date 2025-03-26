
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

// Define Transaction model
class Setting extends Model {
  public id: number;
  public isMaintenance: boolean;
  public createdAt: Date;
  public updatedAt: Date;
}

Setting.init(
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    isMaintenance: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    },
  },
  {
    sequelize,
    modelName: "Setting",
    tableName: "settings",
    timestamps: true,
  }
);


export default Setting;