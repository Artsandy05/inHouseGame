'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("badges", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE badges");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const data = [
      { 
        description: "vip", 
        rank: 1,
      },
      { 
        description: "frontRunner", 
        rank: 2,
      },
      { 
        description: "loyalty", 
        rank: 3,
      },
      { 
        description: "masterGiver", 
        rank: 4,
      },
    ];

    await queryInterface.bulkInsert("badges", data, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("badges", null, {});
  }
};
