import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

// Define Transaction model
class MerchantTransaction extends Model {
  public id: number;
  public temporaryId: number;
  public status: string;
  public amount: number;
  public operationId: string;
  public transId: number;
  public externalId: string;
  public qrContent: string;
  public redirectURL: string;
  public providerId: string;
  public providerName: string;
  public providerMethod: string;
  public currency: string;
  public fee_amount: string;
  public signature: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

MerchantTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    temporaryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "temporary_transaction",
        key: "id",
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    operationId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: "",
    },
    transId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    externalId: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    providerId: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    providerName: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    providerMethod: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    currency: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    fee_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    qrContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    redirectURL: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    signature: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    operation: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    request: {
      type:  DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
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
    modelName: "MerchantTransaction",
    tableName: "merchant_transactions",
    timestamps: true,
  }
);

export default MerchantTransaction;
