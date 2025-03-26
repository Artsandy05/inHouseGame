'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
      await queryInterface.bulkDelete("`source-of-income`", null, {});
      await queryInterface.sequelize.query("TRUNCATE TABLE `source-of-income`");
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  
      const gamesData = [
        {
          name: "Business",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Employment",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Inheritance/Trust",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Investments",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Pensions/Annuities",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Rentals/Lease",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: "Others",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
  
      await queryInterface.bulkInsert("`source-of-income`", gamesData, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("`source-of-income`", null, {});
  }
};
