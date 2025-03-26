
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import UserPromo from "./UserPromo";

// Define Transaction model
class Promo extends Model {
  public id: number;
  public name: string;
  public label: string;
  public type: string | null;
  public amount: number | string | null;
  public turnOverMultiplyier: number;
  public promoStartedDate!: number | string | null;
  public createdAt: Date;
  public updatedAt: Date;
}

Promo.init(
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
    label: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    amount: {
        type: DataTypes.DECIMAL(32, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
    },
    type: {
      type: DataTypes.ENUM("promo", "voucher"),
      allowNull: true,
    },
    turnOverMultiplyier: {
        type: DataTypes.INTEGER,
        allowNull: false, // Allow null
        defaultValue: 0,
    },
    promoStartedDate: {
        type: DataTypes.DATE,
        defaultValue: null,
        allowNull: true,
    },
    promoEndedDate: {
        type: DataTypes.DATE,
        defaultValue: null,
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP') 
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    },
  },
  {
    sequelize,
    modelName: "Promo",
    tableName: "promos",
    timestamps: true,
  }
);


export default Promo;