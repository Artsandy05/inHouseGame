"use strict";

const GameList = require("../models/forSeederModel/GameList");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("`game-assets`", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE `game-assets`");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const zodiacGame = await GameList.findOne({
      attributes: ["id", "name"],
      where: { name: "zodiac" },
    });

    let gameAssets = [];
    if (zodiacGame) {
      const id = zodiacGame.get("id");
      const ZODIACS = [
        "aries",
        "cancer",
        "libra",
        "capricorn",
        "taurus",
        "leo",
        "scorpio",
        "aquarius",
        "gemini",
        "virgo",
        "sagittarius",
        "pisces",
      ];

      for (const zodiac of ZODIACS) {
        gameAssets.push({ gameId: id, name: zodiac });
      }
    }
    return queryInterface.bulkInsert("`game-assets`", gameAssets);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("`game-assets`", null, {});
  },
};
