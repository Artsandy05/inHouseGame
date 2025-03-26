import { DataTypes, Model } from 'sequelize';
import sequelize from "../config/database";
import Config from './Config';
import Transaction from './Transaction';
import WinningBall from './WinningBall'
import GameList from './GameList';

class Game extends Model {
  public id: number;
  public user_id: number;
  public config_id: number;
  public game_id: number;
  public name: string;
  public gross: number;
  public totalWins: number;
  public totalLose: number;
  public totalCommission: number;

  public static async new(
    user_id: number,
    config_id: number,
    game_id: number,
    name: string,
  ): Promise<Game> {
    try {
      const game = await Game.create({
        user_id,
        config_id,
        game_id,
        name,
        gross: 0,
        totalWins: 0,
        totalLose: 0,
        totalCommission: 0
      });

      return game;
    } catch (error) {
      throw new Error(`Error inserting game: ${error}`);
    }
  }
}
Game.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    config_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gross: {
      type: DataTypes.DECIMAL(32, 8),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalWins: {
      type: DataTypes.DECIMAL(32, 8),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalLose: {
      type: DataTypes.DECIMAL(32, 8),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    totalCommission: {
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
    modelName: 'game',
    tableName: 'games',
    timestamps: true,
  }
);

Game.hasOne(Config, { foreignKey: 'config_id' });
Game.belongsTo(GameList, { foreignKey: 'game_id' });
Game.hasOne(WinningBall, { foreignKey: 'gamesId' });

export default Game;

