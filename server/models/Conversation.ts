import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Concern from './Concern';
import User from './User';
import Message from './Message';
import ConversationStatusUpdate from './ConversationStatusUpdate';

class Conversation extends Model {
  public id!: number;
  public player_id!: number;
  public csr_id!: number;
  public concern_id!: number;
  public ticket!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    csr_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    concern_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'concerns',
        key: 'id',
      },
    },
    ticket: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'conversation',
    tableName: 'conversations',
    timestamps: true,
  }
);

Conversation.belongsTo(Concern, {
  foreignKey: 'concern_id',
  as: 'concern'
});

Conversation.hasMany(ConversationStatusUpdate, {
  foreignKey: 'conversation_id',
  as: 'statusUpdates'
});

Conversation.hasMany(Message, {
  foreignKey: 'conversation_id',
  as: 'messages'
});


export default Conversation;
