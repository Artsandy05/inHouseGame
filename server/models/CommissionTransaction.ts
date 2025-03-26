import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Game from "./Game";
import Bet from './Bet';
import Wallet from "./Wallet";
import User from "./User";

// Define Transaction model
class CommissionTransaction extends Model {
  public id: number;
  public wallet_id: number;
  public playerOrAgentId: number | null;
  public agentPlayerId!: number | null;;
  public bet_id: number;
  public game_id: number;
  public amount!: number;
  public franchiseTax!: number;
  public commission!: string;
  public bet?: Bet; 
  public Wallet?: Wallet; 
  public status!: string;
  public month: any;
  public sales: any;
  

  public static async new(wallet_id, playerOrAgentId, agentPlayerId, bet_id, game_id, amt, franchiseTax, commission, status = "PAID", previousBalance = 0) {
    // console.log(`transaction ${amt}: ${type}`);
    const amount = Math.abs(amt);
    try {
      const r = await CommissionTransaction.create({
        wallet_id,
        playerOrAgentId,
        agentPlayerId,
        bet_id,
        game_id,
        amount,
        franchiseTax,
        commission,
        status,
        previousBalance
      });
      r.save();
      return r;
    } catch (error) {
      console.log(error);
    }
  }
}
CommissionTransaction.init(
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
    playerOrAgentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    agentPlayerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bet_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(32, 8),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    previousBalance: {
      type: DataTypes.DECIMAL(32, 8),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    franchiseTax: {
      type: DataTypes.DECIMAL(32, 8), // Increase the precision to store more decimals
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    commission: {
      type: DataTypes.DECIMAL(5, 2), // Example: 999, 999, 999, 999.99
      defaultValue: 0,
    },
    status: {
      type: DataTypes.STRING,
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
    modelName: "CommissionTransaction",
    tableName: "commission-transactions",
    timestamps: true,
  }
);

CommissionTransaction.belongsTo(Game, { foreignKey: 'game_id' });

CommissionTransaction.belongsTo(User, { foreignKey: "playerOrAgentId", as: "PlayerOrAgent" });
CommissionTransaction.belongsTo(User, { foreignKey: "agentPlayerId", as: "AgentPlayer" });
CommissionTransaction.belongsTo(User, { foreignKey: "wallet_id", as: "InviterPlayer" });

CommissionTransaction.belongsTo(Bet, { foreignKey: "bet_id", as: "Bet" });

export default CommissionTransaction;
