'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await queryInterface.bulkDelete("promos", null, {});
    await queryInterface.sequelize.query("TRUNCATE TABLE promos");
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Adds one day to the current date

    const data = [
      { 
        name: "WELCOME_BONUS_PROMO", 
        label: "Welcome Bonus Promo",
        type: "promo",
        amount: 20,
        turnOverMultiplyier: 10,
        promoStartedDate: null,
        promoEndedDate: null,
      },
      { 
        name: "REFER_EARN_PROMO", 
        label: "Refer and Earn Promo",
        type: "promo",
        amount: 20,
        turnOverMultiplyier: 10,
        promoStartedDate: null,
        promoEndedDate: null,
      },
      { 
        name: "BITHRDAY_BENTE_PROMO", 
        label: "Welcome Bonus Promo",
        type: "promo",
        amount: 20,
        turnOverMultiplyier: 10,
        promoStartedDate: null,
        promoEndedDate: null,
      },
      { 
        name: "KRLFDRV01", 
        label: "KRLFDRV01",
        type: "voucher",
        amount: 300,
        turnOverMultiplyier: 0,
        promoStartedDate: today,
        promoEndedDate: tomorrow,
      },
    ];

    await queryInterface.bulkInsert("promos", data, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("promos", null, {});
  }
};
