import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class WinningBets extends Model {
  public id!: number;
  public transactionId: number;
  public ball: string;
  public betAmount: number;
  public prize: number;
  
  public static async new(
    transactionId: number,
    ball: string,
    betAmount: number,
    prize: number
  ): Promise<WinningBets> {
        try {
            const winningBets = await WinningBets.create({
                transactionId,
                ball,
                betAmount,
                prize
            });
            return winningBets;
        } catch (error) {
            throw new Error(`Error inserting winning bets: ${error}`);
        }
    }
}

WinningBets.init(
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    transactionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "transactions",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
    },
    ball: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    betAmount: {
      type: DataTypes.DECIMAL(32, 8),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    prize: {
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
    modelName: "WinningBet",
    tableName: "winning-bets",
    timestamps: true,
  }
);


export default WinningBets;
