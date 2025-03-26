import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Transaction from "./Transaction";

class WinningBall extends Model {
  public id!: number;
  public gamesId: number;
  public zodiac: string;
  public game: string;

  public static async new(
    gamesId: number,
    zodiac: string,
    game: string,
  ): Promise<WinningBall> {
        try {
            const winningBall = await WinningBall.create({
                gamesId,
                zodiac,
                game
            });
            return winningBall;
        } catch (error) {
            throw new Error(`Error inserting winning ball: ${error}`);
        }
    }
}

WinningBall.init(
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    gamesId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    zodiac: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    game: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    sequelize,
    modelName: "WinningBall",
    tableName: "winning-balls",
    timestamps: true,
  }
);


export default WinningBall;
