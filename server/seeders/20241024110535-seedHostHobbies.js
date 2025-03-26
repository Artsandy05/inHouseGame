'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("`host-hobbies`", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE `host-hobbies`");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const { generatingRecordsHostHobbies } = require("../utils/seederLogic")
    try {
      const hostHobbies = await generatingRecordsHostHobbies();
      console.log("Host hobbies to be inserted:", hostHobbies);
      await queryInterface.bulkInsert("host-hobbies", hostHobbies, {});
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
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
