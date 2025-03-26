'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("bets", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      game_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "games",
          key: "id",
        },
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "transactions",
          key: "id",
        },
      },
      zodiac: {
        type: Sequelize.STRING,
        // type: DataTypes.ENUM('Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'),
        allowNull: false,
      },
      gameRoundCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      companyCommission: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      overAllCommission: {
        type: Sequelize.DECIMAL(32, 8),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("bets");
  }
};
