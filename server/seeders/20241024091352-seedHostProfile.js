'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("`host-profile`", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE `host-profile`");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const { generatingRecordsHostProfile, generatingRecordsHostProfileViaUser, generatingRecordsHostProfilePicture } = require("../utils/seederLogic")
    try {
      const usersHost = await generatingRecordsHostProfileViaUser();
      console.log("Host Records to be inserted:", usersHost);
      await queryInterface.bulkInsert("users", usersHost);

      const host = await generatingRecordsHostProfile();
      await queryInterface.bulkInsert("`host-profile`", host);

      await generatingRecordsHostProfilePicture();

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
    await queryInterface.bulkDelete("`host-profile`", null, {});
  }
};
