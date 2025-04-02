"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("`games-list`", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE `games-list`");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const gamesData = [
      {
        name: "ZODIAC",
        label: "Zodiac Race",
        moderatorRoute:"/moderator",
        gameRoute:"/zodiac",
        url:"",
        isActive:0,
        banner:"../assets/images/home-zodiacrace-gamelist-banner.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "DOS_LETRA_KARERA",
        label: "Dos Letra Karera",
        moderatorRoute:"/mod-dos-letra",
        gameRoute:"/dos-letra",
        url:"",
        isActive: 0,
        banner:"../assets/images/home-dos-letra-karera-banner.png",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "TRES_LETRA_KARERA",
        label: "Tres Letra Karera",
        moderatorRoute:"",
        url:"",
        gameRoute:"",
        isActive: 0,
        banner:"../assets/images/home-tres-letra-karera-banner.png",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Golden Goose",
        label: "golden_goose",
        moderatorRoute:"/moderator/golden_goose",
        gameRoute:"/golden_goose",
        url:"http://gg.kingfisher777.com/golden_goose",
        isActive:1,
        banner:"../assets/images/home-zodiacrace-gamelist-banner.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("`games-list`", gamesData, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("`games-list`", null, {});
  },
};
