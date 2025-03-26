'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("commission-transactions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      wallet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "wallets",
          key: "id",
        },
      },
      playerOrAgentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        defaultValue: null, // Default value is null
        onUpdate: 'SET NULL', // If the referenced user is updated, set the agentPlayerId to NULL
        onDelete: 'SET NULL', // If the referenced user is deleted, set the agentPlayerId to NULL
      },
      agentPlayerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        defaultValue: null, // Default value is null
        onUpdate: 'SET NULL', // If the referenced user is updated, set the agentPlayerId to NULL
        onDelete: 'SET NULL', // If the referenced user is deleted, set the agentPlayerId to NULL
      },
      bet_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "bets",
          key: "id",
        },
      },
      game_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "games",
          key: "id",
        },
      },
      amount: {
          type: Sequelize.DECIMAL(32, 8), 
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
      },
      previousBalance: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: true,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      franchiseTax: {
        type: Sequelize.DECIMAL(32, 8), // Increase the precision to store more decimals
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      commission: {
        type: Sequelize.DECIMAL(5, 2), // Example: 999.99
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("commission-transactions");
  }
};
