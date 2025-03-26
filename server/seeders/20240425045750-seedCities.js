"use strict";

const Province = require("../models/forSeederModel/Province");
const { CITIES_DATA } = require("../constants/forSeeder/index");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("cities", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE cities");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const provinces = await Province.findAll({ attributes: ["id", "name"] });
    let citiesRecord = [];

    for (const province of provinces) {
      const provinceName = province.name;
      const cities = CITIES_DATA[provinceName] || [];

      const provinceId = province.id;

      const cityObjects = cities.map((cityName) => ({
        name: cityName,
        provinceId,
      }));

      citiesRecord = citiesRecord.concat(cityObjects);
    }

    try {
      if (!Array.isArray(citiesRecord)) {
        throw new Error("City records must be an array.");
      }

      return queryInterface.bulkInsert("cities", citiesRecord);
    } catch (error) {
      console.error("Error in seedCities migration:", error);
      throw error;
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("cities", null, {});
  },
};
