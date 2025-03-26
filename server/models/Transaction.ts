import { DataTypes, Model, Sequelize } from "sequelize";
import sequelize from "../config/database";
import Game from "./Game";
import Bet from './Bet';
import Wallet from "./Wallet";
import Merchant from "./Merchant";
import TemporaryTransaction from "./TemporaryTransaction";
import WinningBets from "./WinningBets";
import WinningBall from "./WinningBall";
import LosingBets from "./LosingBets";

// Define Transaction model
class Transaction extends Model {
  public id: number;
  public uuid: string;
  public wallet_id: number;
  public odds: number;
  public game_id!: number;
  public gameRoundCode!: string;
  public amount!: number;
  public status!: string;
  public callbackId!: string;
  public ticket_number!: string;
  public merchantId!: number;
  public type!: "bet" | "wonprize" | "losebet" | "deposit" | "load" | "withdrawal" | "sendGift" | "promo" | "deduct";
  public bet?: Bet; 
  public temporaryId!: number;
  public loadTransactionId!: number;
  public Wallet?: Wallet; 
  public createdAt!: Date;
  public updatedAt!: Date;
  public WinningBet: any;
  public LosingBet: any;
  

  public static async new(wallet_id, game_id, amt, type, odds, gameRoundCode = null, previousBalance = null,ticket_number = null, status = "SUCCESS") {
    // console.log(`transaction ${amt}: ${type}`);
    const amount = Math.abs(amt);
    try {
      const r = await Transaction.create({
        wallet_id,
        game_id,
        ticket_number,
        amount,
        previousBalance,
        type,
        odds,
        gameRoundCode,
        status,
        callbackId: 0,
        merchantId: null,
        temporaryId: null
      });
      r.save();
      return r;
    } catch (error) {
      console.log(error);
    }
  }
}
Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    uuid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    ticket_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    wallet_id: {
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
    odds: {
      type: DataTypes.DECIMAL(32, 2),
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
    type: {
      type: DataTypes.ENUM("bet", "wonprize", "losebet", "deposit", "load", "deduct", "withdrawal", "sendGift","promo","refund","settlement"),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gameRoundCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    callbackId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 0
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
    loadTransactionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "load-transactions",
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
    modelName: "Transaction",
    tableName: "transactions",
    timestamps: true,
  }
);

Transaction.belongsTo(Game, { foreignKey: 'game_id' });
Game.hasOne(Transaction, { foreignKey: 'game_id' });
Transaction.belongsTo(Merchant, { foreignKey: 'merchantId' });
Transaction.belongsTo(TemporaryTransaction, { foreignKey: 'temporaryId' });
Transaction.hasOne(WinningBets, { foreignKey: 'transactionId' });
TemporaryTransaction.hasOne(Transaction, { foreignKey: 'temporaryId' });
Transaction.hasOne(LosingBets, { foreignKey: 'transactionId' });
// Transaction.hasOne(WinningBall, { foreignKey: 'game_id' });

export default Transaction;
