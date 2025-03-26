// Import necessary modules
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database"; // Assuming you have a database configuration

// Define your Sequelize model for user groups
class ReferralPlayer extends Model {
  public playerId: number;
  public inviterId!:any;  
  public User:any
}

ReferralPlayer.init(
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
    modelName: "ReferralPlayer",
    tableName: "referral_players",
    timestamps: true,
  }
);

export default ReferralPlayer;
