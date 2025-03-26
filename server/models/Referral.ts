// Import necessary modules
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // Assuming you have a database configuration

// Define your Sequelize model for user groups
class Referral extends Model {
  public playerId: number;
  public commission!: string;
  public commissionAgent!: string;
  public inviterId!:any;  
  public inviter:any;
  public userType:any;
  public suggestedCommisionStatus:string;
  public suggestedCommission:string;
  public suggestedCommissionAgent:string;
  public suggestedCommissionUpdatedAt:Date;
  public User:any;
  public Wallet:any;
}


Referral.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    inviterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userType: {
      type: DataTypes.ENUM(
        "site",
        "online",
      ),
      allowNull: false,
      defaultValue: "online",
    },
    commission: {
      type: DataTypes.DECIMAL(5, 2), // Example: 999.99
      allowNull: false,
      defaultValue: 0,
    },
    commissionAgent: {
      type: DataTypes.DECIMAL(5, 2), // Example: 999.99
      allowNull: false,
      defaultValue: 0,
    },
    suggestedCommission: {
      type: DataTypes.DECIMAL(5, 2), // Example: 999.99
      allowNull: false,
      defaultValue: 0,
    },
    suggestedCommissionAgent: {
      type: DataTypes.DECIMAL(5, 2), // Example: 999.99
      allowNull: false,
      defaultValue: 0,
    },
    suggestedCommisionStatus: {
      type: DataTypes.ENUM(
        "idle",
        "forapproval",
      ),
      allowNull: false,
      defaultValue: "idle",
    },
    suggestedCommissionUpdatedAt: {
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
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  },
  {
    sequelize,
    modelName: "Referral",
    tableName: "referrals",
    timestamps: true,
  }
);

// Define associations if needed
// @ts-ignore
Referral.associate = (models) => {
  Referral.belongsTo(models.User, {
    foreignKey: "inviterId",
    onDelete: "CASCADE",
  });
  Referral.belongsTo(models.User, {
    foreignKey: "playerId",
    onDelete: "CASCADE",
  });
};

export default Referral;
