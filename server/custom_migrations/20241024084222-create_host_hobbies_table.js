'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("host-hobbies", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hostProfileId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "host-profile", // Ensure the table name is correct
          },
          key: "id",
        },
      },
      hobbyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "hobbies", // Ensure the table name is correct
          },
          key: "id",
        },
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("host-hobbies");
  }
};
