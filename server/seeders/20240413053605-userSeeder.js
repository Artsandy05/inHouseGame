"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { generatingRecords } = require("../utils/seederLogic")
    try {
      const records = await generatingRecords();
      console.log("Records to be inserted:", records);
      await queryInterface.bulkInsert("users", records);
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

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
