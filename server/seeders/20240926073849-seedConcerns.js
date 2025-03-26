'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
      await queryInterface.bulkDelete("concerns", null, {});
      await queryInterface.sequelize.query("TRUNCATE TABLE concerns");
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  
      const data = [
        { concern_type: "Withdrawal Concern" },
        { concern_type: "Deposit Concern" },
        { concern_type: "Account Verification" },
        { concern_type: "Game Inquiry" },
        { concern_type: "Others" },
      ];
  
      await queryInterface.bulkInsert("concerns", data, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("concerns", null, {});
  }
};
