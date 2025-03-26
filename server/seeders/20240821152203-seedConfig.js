'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
      await queryInterface.bulkDelete("configs", null, {});
      await queryInterface.sequelize.query("TRUNCATE TABLE configs");
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  
      const configData = [
        {
          fee: 0.15,
          companyFee: 0.10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          fee: 0.08,
          companyFee: 0.05,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
  
      await queryInterface.bulkInsert("configs", configData, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("configs", null, {});
  }
};
