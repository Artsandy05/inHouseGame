'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const [users, metadata] = await queryInterface.sequelize.query("SELECT * FROM users WHERE role = 'player'");

    // Update wallet balances incrementally
    for (const [index, user] of users.entries()) {
      const balance = (index + 1) * 10000000;  // Increment balance by 10 million per user
  
      // Log the user_id and the calculated balance
      console.log(`Updating wallet for user_id ${user.id} with balance ${balance}`);
  
      // Update the wallet balance corresponding to the user_id
      await queryInterface.sequelize.query(
        'UPDATE wallets SET balance = :balance WHERE user_id = :userId',
        {
          replacements: { balance, userId: user.id },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }
  },

  async down (queryInterface, Sequelize) {
    // Reset all wallet balances to 0
    await queryInterface.sequelize.query(
      `UPDATE wallets SET balance = 0`
    );
    console.log(`Successfully reset all wallet balances to 0`);
  }
};
