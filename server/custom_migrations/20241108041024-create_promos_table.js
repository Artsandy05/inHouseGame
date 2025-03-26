'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("promos", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: {
          name: "name",
          msg: "This promo name is already taken",
          ignoreEmpty: true,
        },
        defaultValue: "",
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ""
      },
      type: {
        type: Sequelize.ENUM("promo", "voucher"),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(32, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      turnOverMultiplyier: {
        type: Sequelize.INTEGER,
        allowNull: false, // Allow null
        defaultValue: 0,
      },
      promoStartedDate: {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      },
      promoEndedDate: {
        type: Sequelize.DATE,
        defaultValue: null,
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
    await queryInterface.dropTable("promos");
  }
};
