"use strict";

const City = require("../models/forSeederModel/City");
const { BARANGAY_DATA } = require("../constants/forSeeder/index");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const environment = process.env.NODE_ENV || "local";

    if(environment === "local"){
       // Query global settings before execution
        const [settings] = await queryInterface.sequelize.query(`
          SELECT 
            @@net_buffer_length AS net_buffer_length,
            @@max_allowed_packet AS max_allowed_packet,
            @@wait_timeout AS wait_timeout,
            @@interactive_timeout AS interactive_timeout
        `);
        console.log("Global Settings Before Execution:", settings);
    }

    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("barangays", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE barangays");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const cities = await City.findAll({ attributes: ["id", "name"] });
    let barangaysRecord = [];
    // console.log(cities);
    for (const city of cities) {
      const cityName = city.name;
      const barangays = BARANGAY_DATA[cityName] || [];

      const cityId = city.id;

      const barangayObjects = barangays.map((barangayName) => ({
        name: barangayName,
        cityId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      barangaysRecord = barangaysRecord.concat(barangayObjects);
    }

    try {
      if (!Array.isArray(barangaysRecord)) {
        throw new Error("City records must be an array.");
      }

      return queryInterface.bulkInsert("barangays", barangaysRecord);
    } catch (error) {
      console.error("Error in seedCities migration:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("barangays", null, {});
  },
};
