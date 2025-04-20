import { DataTypes, Model, Sequelize } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import Transaction from "./Transaction";

class Wallet extends Model {
  public id!: number; // Use id as the primary key
  public user_id!: number;
  public balance!: number;
  public User?: User; 
  public Transaction?: Transaction;

  static async findByUserId(user_id) {
    try {
      const wallet = await Wallet.findOne({ where: { user_id } });
      if (wallet) {
        return wallet;
      } else {
        console.error("Error retrieving wallet for userId " + user_id);
        return undefined;
      }
    } catch (error) {
      console.error("Error retrieving wallet:", error.message);
    }
  }

  static async findOrCreateByUserId(user_id: number, balance:number) {
    try {
      const [wallet, created] = await Wallet.findOrCreate({ 
        where: { user_id },
        defaults: {
          user_id,
          balance: balance
        }
      });
      
      if (created) {
        console.log(`Created new wallet for user ${user_id}`);
      }
      
      return wallet;
    } catch (error) {
      console.error("Error retrieving wallet:", error.message);
      throw error; // It's better to throw the error so the caller can handle it
    }
  }

  static async findByUUID(uuid) {
    try {
      const user = await User.findOne({ where: { uuid: uuid } });
      const wallet = await Wallet.findOne({ where: { user_id: user.id } });
      if (wallet) {
        return wallet;
      } else {
        console.error("Error retrieving wallet for UUID ");
        return undefined;
      }
    } catch (error) {
      console.error("Error retrieving wallet:", error.message);
    }
  }

  static async updateBalance(user_id: number, amount: number, type: string) {
    let t;

    try {
      const wallet = await Wallet.findByUserId(user_id);

      let newBal = parseFloat(
        (Number(wallet.balance) + Number(amount)).toFixed(2)
      );
      if (isNaN(newBal)) {
        throw new Error(`newBal is NaN. amount: ${amount}`);
      }
      wallet.balance = newBal;

      t = await sequelize.transaction();
      await wallet.save({ transaction: t });
      await t.commit();
      return wallet;
    } catch (error) {
      console.log(error);
      await t.rollback();
      throw error;
    }
    return null;
  }
}

Wallet.init(
  {
    id: {
      // Define id as the primary key
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Assuming it's auto-incrementing
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Assuming each user has only one wallet
    },
    balance: {
      type: DataTypes.DECIMAL(32, 8),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
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
    modelName: "Wallet",
    tableName: "wallets",
    timestamps: true,
  }
);

// Transaction.belongsTo(Wallet, { foreignKey: "wallet_id" });
Wallet.hasMany(Transaction, { foreignKey: "wallet_id" });
Transaction.belongsTo(Wallet, { foreignKey: 'wallet_id' });
User.hasOne(Wallet, { foreignKey: "user_id" });
Wallet.belongsTo(User, { foreignKey: "user_id" });

export default Wallet;
