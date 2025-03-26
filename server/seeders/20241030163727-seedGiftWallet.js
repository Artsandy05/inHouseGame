'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("gift_wallet", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE gift_wallet");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const data = [
      { amount: 0 },
    ];

    await queryInterface.bulkInsert("gift_wallet", data, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("gift_wallet", null, {});
  }
};
