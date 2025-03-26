import cron from 'node-cron';
import { Sequelize } from 'sequelize'; // Assuming you are using Sequelize ORM
import moment from 'moment';
import User from '../models/User';
import { Op } from "sequelize";
import { BITHRDAY_BENTE_PROMO, DEPOSIT } from '../constants';
import { activatePromo } from './logic';
import Transaction from '../models/Transaction';
import PlayerLog from '../models/PlayerLog';
import GameList from '../models/GameList';
const { ROLES } = require("../constants/permission");

// This function checks if it's the user's birthday and activates the promo
const checkBirthdaysAndActivatePromo = async () => {
  const today = moment();
  const todayMonth = today.month(); // Zero-indexed month (0 = January)
  const todayDay = today.date();  // Day of the month
  
  try {
    // Find all users whose birthday is today
    const users = await User.findAll({
      where: Sequelize.and(
        Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('birthdate')), todayMonth + 1), // Compare month (Sequelize uses 1-indexed month)
        Sequelize.where(Sequelize.fn('DAY', Sequelize.col('birthdate')), todayDay),         // Compare day
        { role: ROLES.PLAYER.name } // Filter by role = 'player'
      )
    });


    // For each user, activate the promo
    for (const user of users) {
      const transactionModel = await Transaction.findOne({
        attributes:["amount"],
        where: { wallet_id: user?.id, type: DEPOSIT }, 
        order: [['createdAt', 'ASC']] 
      });

      const transFirst = transactionModel?.amount
      if(Number(transFirst) >= 500){
        activatePromo(user?.id, BITHRDAY_BENTE_PROMO)
      }
    }
  } catch (error) {
    console.error('Error while checking birthdays and activating promos:', error);
  }
};

const expireKYC = async () => {
  const threeDaysAgo = moment().subtract(2, 'days');

    try {

      // Fetch users whose kyc expired are within the last 3 days
      const users = await User.findAll({
        where: {
          role: ROLES.PLAYER.name, isKYC:"notstarted", status:"active",
          createdAt: {
            [Op.lte]: threeDaysAgo.toDate(),         // today
          },
        },
      });


    for (const user of users) {
      // Update the user's status to 'deactivate'
      await User.update(
        { status: 'deactivated' },  // Set the new status to 'deactivate'
        { where: { id: user.id } }  // Identify the user by their ID
      );
    }
  } catch (error) {
    console.error('Error while checking 3 days expired kyc:', error);
  }
}


const deactivate90days = async () => {
  const ninetyDaysAgo = moment().subtract(89, 'days');
  try {
    const playerLogs = await PlayerLog.findAll({
      where: {
        createdAt: {
          [Op.lte]: ninetyDaysAgo.toDate(),
        },
      },
    });


  for (const playerLog of playerLogs) {
    await User.update(
      { status: 'deactivated' },  
      { where: { id: playerLog.userId, role: ROLES.PLAYER.name,  status:"active" } }
    );
  }
} catch (error) {
  console.error('Error while deactivate 90 days inactive session:', error);
}
}

const startStreaming = async () => {
  await GameList.update({ isStreaming: 1 }, { where: { id: 2 } });
  console.log("start the streaming...")
};

const stopStreaming = async () => {
  await GameList.update({ isStreaming: 0 }, { where: { id: 2 } });
  console.log("end the streaming...")
};

// This function starts the cron job to run the birthday check daily at midnight
export const startCronJob = () => {
    // cron.schedule('0 0 * * *', () => { // Runs daily at midnight
    // cron.schedule('0 */12 * * *', () => { // Runs every 12 hours

    // cron.schedule('* * * * *', () => { // Runs every min
    //     checkBirthdaysAndActivatePromo();
    //     expireKYC();
    //     // deactivate90days();
    // });

     // Cron job to stop streaming at 9 AM (isStreaming = 0)
  cron.schedule('0 9 * * *', () => { // Runs every day at 9:00 AM
    startStreaming();
  });


  // Cron job to start streaming at 9 PM (isStreaming = 1)
  cron.schedule('5 21 * * *', () => { // Runs every day at 9:00 PM
    stopStreaming();
  });

  cron.schedule('0 0 * * *', () => {
        checkBirthdaysAndActivatePromo();
        expireKYC();
        deactivate90days();
  });
};