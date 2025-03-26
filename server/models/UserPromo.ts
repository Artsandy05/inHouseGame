import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import GameAsset from "./GameAsset";
import Promo from "./Promo";

// Define Transaction model
class UserPromo extends Model {
  public id: number;
  public userId: number | null;
  public promoId: number | null;
  public transactionId : number | null;
  public isDeposited: number;
  public User:User
  public Promo?: Promo
}

UserPromo.init(
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
        onDelete: 'CASCADE',
    },
    promoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "promos",
            key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    transactionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "transactions",
          key: "id",
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    isDeposited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "UserPromo",
    tableName: "user-promos",
    timestamps: true,
  }
);

UserPromo.belongsTo(User, { foreignKey: "userId" });
User.hasMany(UserPromo, { foreignKey: "userId" });

UserPromo.belongsTo(Promo, { foreignKey: 'promoId' });
Promo.hasOne(UserPromo, { foreignKey: 'promoId' });

export default UserPromo;
