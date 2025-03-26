import { DataTypes, Model, Sequelize } from "sequelize";
import sequelize from "../config/database";
import Transaction from "./Transaction";
import MerchantTransaction from "./MerchantTransaction";

// Define Transaction model
class TemporaryTransaction extends Model {
  public id: number;
  public wallet_id: number;
  public amount!: string;
  public status!: string;
  public callbackId!: string;
  public merchantId!: string;
  public type!:  "deposit" | "withdrawal";
  public createdAt!: Date;
  public updatedAt!: Date;
}

TemporaryTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    wallet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
      type: DataTypes.ENUM("deposit","withdrawal"),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    callbackId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    merchantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "merchants",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null, 
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null, 
    },
  },
  {
    sequelize,
    modelName: "TemporaryTransaction",
    tableName: "temporary_transaction",
    timestamps: true,
  }
);

TemporaryTransaction.hasOne(MerchantTransaction, { foreignKey: 'temporaryId' });
TemporaryTransaction.hasMany(MerchantTransaction, { foreignKey: 'temporaryId' });
MerchantTransaction.belongsTo(TemporaryTransaction, { foreignKey: 'temporaryId' });

export default TemporaryTransaction;
