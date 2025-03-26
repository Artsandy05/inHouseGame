import { DataTypes, Model, Op } from "sequelize";
import sequelize from "../config/database"; // Assuming your Sequelize instance is in a separate file
import User from "../models/User";

class Session extends Model {
  public id: number;
  public userId!: string;
  public ipAddress!: string;
  public userAgent!: string;
  public token!: Date;
  public updatedAt?: Date | null;
  public createdAt!: Date;
}

Session.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.JSON, // Use JSON type for storing object data
      allowNull: true,
      get() {
        const userAgent = this.getDataValue("userAgent");
        return userAgent ? JSON.parse(userAgent) : null;
      },
      set(userAgent) {
        this.setDataValue("userAgent", JSON.stringify(userAgent));
      },
    },
    token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null, // Set default value to null
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "Session",
    tableName: "sessions", // Optional: Define the table name explicitly
    timestamps: true,
  }
);

Session.belongsTo(User, { foreignKey: "userId", as: "user" });

export default Session;
