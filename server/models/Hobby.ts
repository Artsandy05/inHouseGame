import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

// Define Transaction model
class Hobby extends Model {
  public id: number;
  public name: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Hobby.init(
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: "",
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
    modelName: "Hobby",
    tableName: "hobbies",
    timestamps: true,
  }
);


export default Hobby;
