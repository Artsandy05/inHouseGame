import { DataTypes, Model, Sequelize } from "sequelize";
import sequelize from "../config/database";
import Transaction from "./Transaction";
import User from "./User";

// Define Transaction model
class ZolozTransaction extends Model {
  public id: number;
  public uuid?: string;
  public userId: number;
  public isInitialize!: boolean;
  public isCheckResult!: boolean;
  public transactionId!: string;
  public result!: string;
  public clientCfg!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

ZolozTransaction.init(
  {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    uuid: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "users",
            key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    isInitialize: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    isCheckResult: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    result: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
    },
    clientCfg: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
    },
    ekycResult: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    extBasicInfo: {
      type:  DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    extCancelInfo: {
      type:  DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    extCustomInfo: {
      type:  DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    extFaceInfo: {
      type:  DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    extIdInfo: {
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
    modelName: "ZolozTransaction",
    tableName: "zoloz_transactions",
    timestamps: true,
  }
);

ZolozTransaction.belongsTo(User, { foreignKey: 'userId' });

export default ZolozTransaction;
