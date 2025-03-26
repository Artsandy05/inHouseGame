'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("settings", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE settings");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const data = [
      { 
        isMaintenance: false, 
      },
    ];

    await queryInterface.bulkInsert("settings", data, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("settings", null, {});
  }
};
