'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("sites", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE sites");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  
      const gamesData = [
        {
          name: "BINGO_BEE_RIZAL",
          label: "Bingo Bee, Rizal",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
  
      await queryInterface.bulkInsert("sites", gamesData, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("sites", null, {});
  }
};
