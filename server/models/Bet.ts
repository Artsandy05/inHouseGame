import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Game from "./Game";
import Transaction from "./Transaction";

class Bet extends Model {
  public id!: number | null;
  public game_id!: number;
  public gameRoundCode!: string;
  public transaction_id!: number;
  public companyCommission!:number;
  // public zodiac!: 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

  public static async new(
    game_id: number,
    transaction_id: number,
    key: string,
    gameRoundCode: string,
    companyCommission?: number,
    overAllCommission?: number,
  ): Promise<Bet> {
    try {
      // console.log(`Bet ${ZODIACS[index]}: ${amount}`)
      const bet = await Bet.create({
        game_id,
        transaction_id: transaction_id,
        zodiac: key,
        gameRoundCode,
        companyCommission,
        overAllCommission
      });

      return bet;
    } catch (error) {
      throw new Error(`Error inserting bet: ${error}`);
    }
  }
}

Bet.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    zodiac: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gameRoundCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyCommission: {
      type: DataTypes.DECIMAL(32, 8),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    overAllCommission: {
      type: DataTypes.DECIMAL(32, 8),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    modelName: "bet",
    tableName: "bets",
    timestamps: true,
  }
);

Bet.belongsTo(Game, { foreignKey: "game_id" });
Bet.belongsTo(Transaction, { foreignKey: "transaction_id" });

export default Bet;
