'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("`wallets`", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE `wallets`");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    
    const { generatingRecordsWallet } = require("../utils/seederLogic")
    try {
      const records = await generatingRecordsWallet();
      console.log("Wallets to be inserted:", records);
      await queryInterface.bulkInsert("wallets", records, {});
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        console.error("Validation Error:");
        error.errors.forEach((err) => {
          console.error(`Path: ${err.path}`);
          console.error(`Message: ${err.message}`);
          console.error(`Value: ${err.value}`);
        });
      } else {
        console.error("Error during bulk insert:", error);
      }
      throw error; 
    }
  },

  async down (queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete("wallets", null, {});
    } catch (error) {
      console.error("Error during rollback:", error);
      throw error;
    }
  }
};
