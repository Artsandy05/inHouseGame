'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
      await queryInterface.bulkDelete("hobbies", null, {});
      await queryInterface.sequelize.query("TRUNCATE TABLE hobbies");
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const data = [
      { name: "Traveling" }, // 1
      { name: "Reading Books" },  // 2
      { name: "Baking" },  // 3
      { name: "Watching Movies" },  // 4
      { name: "Singing" },  // 5
      { name: "Camping" },  // 6
      { name: "Dancing" },  // 7
      { name: "Cooking" },  // 8
      { name: "Playing Gaming Consoles" },  // 9
      { name: "Hosting" },  // 10
      { name: "Treasure Hunting" },  // 11
      { name: "Basketball" },  // 12
      { name: "Playing Guitar" },  // 13
      { name: "Reading Manga" },  // 14
      { name: "Listening to Music" }, // 15
      { name: "Playing Volleyball" },  // 16
    ];

    await queryInterface.bulkInsert("hobbies", data, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("hobbies", null, {});
  }
};
