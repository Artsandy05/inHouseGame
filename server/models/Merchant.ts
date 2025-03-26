import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

// Define Transaction model
class Merchant extends Model {
  public id: number;
  public name: string;
  public label: string;
  public code: string;
  public description: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Merchant.init(
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: "",
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: "",
    },
    type: {
      type: DataTypes.ENUM(
        "instapay",
        "pesonet",
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue:""
    },
    label: {
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
    modelName: "Merchant",
    tableName: "merchants",
    timestamps: true,
  }
);


export default Merchant;
