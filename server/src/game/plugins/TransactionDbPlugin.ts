import { arrayToMap, GameState, hasValue, ZODIAC_LABELS } from "../../../../common/gameutils";
import Game from "../../../models/Game";
import Transaction from "../../../models/Transaction";
import Wallet from "../../../models/Wallet";
import { Odds } from "../Bet/Odds";
import { Prize } from "../Bet/Prize";
import { Game as GameWorld, GameData, Plugin, Output } from "../Code";
import { Player } from "../Player";
import { UserData } from "../UserData";
import { GameDb } from "./GameDbPlugin";
import Bet from "../../../models/Bet";
import WinningBall from "../../../models/WinningBall";
import Games from "../../../models/Game";
import user from "../../../schema/user";
import RepresentativePlayerTransactions from "../../../models/RepresentativePlayerTransactions";
import User from "../../../models/User";
import WinningBets from "../../../models/WinningBets";
import LosingBets from "../../../models/LosingBets";
import { Sequelize } from "sequelize";
import Config from "../../../models/Config";
import Referral from "../../../models/Referral";
import CommissionTransaction from "../../../models/CommissionTransaction";
import { contructMoney, displayMoney, displayNumber, toFixedTrunc } from "../../../utils/logic";

export class TransactionDbPlugin implements Plugin {
	build(game: GameWorld): void {
		game.system(update);
	}
}

function convertLoseOrders(loseOrders) {
  const resultMap = {};

  loseOrders.forEach(order => {
      const { userId, name, prize, loseOnGame, representative_id = false } = order;

      if (!resultMap[userId]) {
          resultMap[userId] = { userId, name, prize: 0, loseOnGame, representative_id };
      }
      
      resultMap[userId].prize += prize;
  });

  return Object.values(resultMap);
}

async function getWallet(userId){
  const wallet = await Wallet.findByUserId(userId);
  return wallet;
}

async function update(game: GameWorld) {
    game.view(GameData, GameDb).each((entity, gameData, gameDb) => {
      
      gameData.games.forEach(async (gameName) => {
        if (gameData.state[gameName] === GameState.WinnerDeclared) {
          console.log("ASDASDAJSDAJTEAHSDAH", gameData)
          // Use a for...of loop inside an async function
          for (const { userId, prize, key, bet, winOnGame, representative_id = false, odds, uuid } of gameData.winners[gameName]) {
            try {
              if (!representative_id) {
                const wallet = await getWallet(userId);
  
                const prizeFloat = parseFloat(prize).toFixed(2);
                let finalWinPrize = Number(wallet.balance) + Number(prizeFloat);
                const existingBalanceEntry = gameData.playerCurrentBalance[gameName].find(entry => entry.playerUUID === uuid);
  
                
                const transaction = await Transaction.new(wallet.id, gameData.gamesTableId[gameName], prize, "wonprize", odds, gameData.gameId[gameName], existingBalanceEntry.currentBalance);
                await processBet(userId, bet, odds, gameName, gameData, key, transaction);
  
                // Update totalWins in Games
                await Games.update(
                  { totalWins: Sequelize.literal(`totalWins + ${prize}`) },
                  { where: { id: gameData.gamesTableId[gameName] } }
                );
  
                await WinningBets.new(transaction.id, key, bet, prize);
                await Wallet.update(
                  { balance: finalWinPrize - bet },
                  { where: { user_id: userId } }
                );
              }
            } catch (e) {
              console.error(e);
            }
          }
  
          // Process lose orders for all users
          for (const { userId, prize, key, loseOnGame, representative_id = false, odds } of gameData.loseOrders[gameName]) {
            try {
              if (!representative_id) {
                const wallet = await getWallet(userId);
  
                // Insert transaction for losing user
                const transaction = await Transaction.new(wallet.id, gameData.gamesTableId[gameName], prize, "losebet", odds, gameData.gameId[gameName], wallet.balance);
                // Calculate the new totalWins value
                await processBet(userId, prize, odds, gameName, gameData, key, transaction);
  
                // Update the Games table with the new totalWins value
                await Games.update(
                  { totalLose: Sequelize.literal(`totalLose + ${prize}`) },
                  { where: { id: gameData.gamesTableId[gameName] } }
                );
                await LosingBets.new(transaction.id, gameName === 'dos' ? key : ZODIAC_LABELS[parseInt(key)], prize, 0);

              }
            } catch (e) {
              console.error(e);
            }
          }
  
          // Handle final lose orders
          const finalLoseOrders:any = convertLoseOrders(gameData.loseOrders[gameName]);
          for (const order of finalLoseOrders) {
            if (!order.representative_id) {
              try {
                const wallet = await getWallet(order.userId);
  
                wallet.balance -= order.prize;
                await Wallet.update(
                  { balance: wallet.balance },
                  { where: { user_id: order.userId } }
                );
              } catch (e) {
                console.error(e);
              }
            }
          }
  
          // Insert the winning ball record (ensure it's async)
          await insertWinningBall(gameData, gameName);
  
          // Mark this game as processed
          // gameData.processedGames.add(gameName);
        }
      });
    });
}


async function processWalkinBet(userId, bet, odds, gameName, gameData, betModel, type) {
    const w = await Wallet.findOne({ where:{ id:userId } });
    const models = { User, Referral };
    // @ts-ignore
    User.associate && User.associate(models);
    // @ts-ignore
    Referral.associate && Referral.associate(models);
  
    const referralModel = await Referral.findOne({
        where: { playerId: userId },
        attributes: ["inviterId", "playerId", "commission"],
    });

    let totalCommissionMasteragentPlayer = 0;
    let totalBets = [];

    const newBal = w?.balance - bet;
    if (!isNaN(newBal) && hasValue(newBal) && newBal >= 0) {
        totalBets.push(bet);

        // Check if player has agents
        if (referralModel) {
            const userInviter = await User.findOne({
                where: { id: referralModel.inviterId },
                attributes: ["role"],
                include:[{
                  model: Wallet,
                }]
            });

            const playerOrAgentId = w.id;

            if (userInviter.role === "masteragent") {
                if (referralModel.commission !== '0.00') {
                    const commissionAmount = bet * (Number(referralModel.commission) / 100);
                    //const commissionAmount = parseFloat((bet * (Number(referralModel.commission) / 100)).toFixed(4));  // Ensure commission is a number
                    const betId = betModel.id;
                    await CommissionTransaction.new(referralModel.inviterId, playerOrAgentId, null, betId, gameData.gamesTableId[gameName], commissionAmount, 0, referralModel.commission, "PAID", userInviter?.Wallet?.balance);

                    /* Commission of Masteragent based on his players */
                    totalCommissionMasteragentPlayer += commissionAmount;

                     // DO NOT DELETE THIS COMMENT, USE TO VIEW ALL DETIALS OF BETS IN THE TERMINAL
                    //console.log({ type:"MASTERAGENT WALKIN", id:referralModel.inviterId, bet, commission:referralModel.commission, commissionAmount, totalCommissionMasteragentPlayer, typeBet:type })
                }
            }
        }
    }

      // Check if player has bet and balance wallet
    if (totalBets.length > 0) {
        if (referralModel) {
            const userInviter = await User.findOne({
                where: { id: referralModel.inviterId },
                attributes: ["role"],
            });
            

            if (userInviter.role === "masteragent") {
                const wMasteragentPlayer = await Wallet.findByUserId(referralModel.inviterId);
                // const updatedBalanceMasteragentPlayer = parseFloat((Number(wMasteragentPlayer.balance) + Number(totalCommissionMasteragentPlayer)).toFixed(4));

                const updatedBalanceMasteragentPlayer = parseFloat(`${Number(wMasteragentPlayer.balance) + totalCommissionMasteragentPlayer}`).toFixed(4);

                 // DO NOT DELETE THIS COMMENT, USE TO VIEW ALL DETIALS OF BETS IN THE TERMINAL
                 //console.log({ type:"MASTERAGENT WALKIN TOTAL", balance: wMasteragentPlayer.balance, totalCommissionMasteragentPlayer, updatedBalanceMasteragentPlayer })

                await Wallet.update(
                    { balance: updatedBalanceMasteragentPlayer },
                    { where: { user_id: referralModel.inviterId } }
                );
            }
        }
    }
}

async function processBet(userId, bet, odds, gameName, gameData, ball, winLossTransaction) {
  const w = await Wallet.findByUserId(userId);
  const models = { User, Referral };
  // @ts-ignore
  User.associate && User.associate(models);
  // @ts-ignore
  Referral.associate && Referral.associate(models);

  const referralModel = await Referral.findOne({
      where: { playerId: userId },
      attributes: ["inviterId", "playerId", "commission"],
  });

  let totalCommissionAgent = 0;
  let totalCommissionMasteragent = 0;
  let totalCommissionMasteragentPlayer = 0;
  let totalCommission = 0;
  let totalBets = [];


      const newBal = w.balance - bet;
      if (!isNaN(newBal) && hasValue(newBal) && newBal >= 0) {
          totalBets.push(bet);

            // Check if player has agents
            if (referralModel) {
                
                const companyCommission = Number(bet * (gameName === 'bbp' && gameData.bbpCommission));
                const transaction = await Transaction.new(w.id, gameData.gamesTableId[gameName], bet, "bet", odds, gameData.gameId[gameName], w.balance);
                const config = await Config.findOne({ where: { id: gameName === 'bbp' && 3} });
                const overAllCommission = Number(bet * config.fee);

                const betModel = await Bet.new(gameData.gamesTableId[gameName], winLossTransaction.id, gameName === 'bbp' && ball, gameData.gameId[gameName], companyCommission, overAllCommission);
                
                const playerOrAgentId = w.id;

                const userInviter = await User.findOne({
                    where: { id: referralModel.inviterId },
                    attributes: ["role"],
                    include:[{
                      model: Wallet,
                    }]
                });

                /* Commission of Agent and MasterAgent */
                if (userInviter.role === "agent") {
                    const betId = betModel.id;

                    if (referralModel.commission !== '0.00') {
                        const commissionAmount:any = bet * (Number(referralModel.commission) / 100)

                        const franchiseTaxAgent:any = commissionAmount * 0.05
                        const netCommissionAgent = (commissionAmount - franchiseTaxAgent);

                        await CommissionTransaction.new(referralModel.inviterId, playerOrAgentId, null, betId, gameData.gamesTableId[gameName], commissionAmount, franchiseTaxAgent, referralModel.commission, "PAID", userInviter?.Wallet?.balance);

                        /* Commission of Agent based on his players */
                        totalCommissionAgent += netCommissionAgent; // Accumulate commissions

                         // DO NOT DELETE THIS COMMENT, USE TO VIEW ALL DETIALS OF BETS IN THE TERMINAL
                         //console.log({ type:"AGENT", id:referralModel.inviterId, bet, commission: referralModel.commission, commissionAmount, franchiseTaxAgent, netCommissionAgent, totalCommissionAgent })
                    }

                    const referralMasterAgentModel = await Referral.findOne({
                        where: { playerId: referralModel.inviterId },
                        attributes: ["commission", "inviterId"],
                        include:[{
                          model: User,
                          include:[{
                            model: Wallet,
                          }]
                        }]
                    });

                    const userMA = await User.findOne({ 
                      where: {id :referralMasterAgentModel.inviterId},
                      include:[{
                        model: Wallet,
                      }]
                    })

                    if (referralMasterAgentModel) {
                        if (referralMasterAgentModel.commission !== '0.00') {
                            const commissionMasterAgentAmount:any = bet * (Number(referralMasterAgentModel.commission) / 100)
                            const franchiseTaxMasterAgent:any = commissionMasterAgentAmount * 0.05
                            const netCommissionAgent = (commissionMasterAgentAmount - franchiseTaxMasterAgent);

                      
                            await CommissionTransaction.new(referralMasterAgentModel.inviterId, referralModel.inviterId, playerOrAgentId, betId, gameData.gamesTableId[gameName], commissionMasterAgentAmount, franchiseTaxMasterAgent, referralMasterAgentModel.commission, "PAID", userMA?.Wallet?.balance);

                            /* Commission of Masteragent based on agent's player */
                            totalCommissionMasteragent += netCommissionAgent;

                             // DO NOT DELETE THIS COMMENT, USE TO VIEW ALL DETIALS OF BETS IN THE TERMINAL
                             //console.log({ type:"MASTERAGENT", id: referralMasterAgentModel.inviterId, bet, commission:referralMasterAgentModel.commission, commissionMasterAgentAmount, franchiseTaxMasterAgent, netCommissionAgent, totalCommissionMasteragent })
                        }
                    }
                } else if (userInviter.role === "masteragent") {
                    if (referralModel.commission !== '0.00') {
                        const commissionAmount:any = (bet * (Number(referralModel.commission) / 100))
                        const franchiseTaxMasterAgent = (commissionAmount * 0.05)
                        const netCommissionAgent = (commissionAmount - franchiseTaxMasterAgent);

                        
                    
                        const betId = betModel.id;
                        await CommissionTransaction.new(referralModel.inviterId, playerOrAgentId, null, betId, gameData.gamesTableId[gameName], commissionAmount, franchiseTaxMasterAgent, referralModel.commission, "PAID", userInviter?.Wallet?.balance);

                        /* Commission of Masteragent based on his players */
                        totalCommissionMasteragentPlayer += netCommissionAgent;

                         // DO NOT DELETE THIS COMMENT, USE TO VIEW ALL DETIALS OF BETS IN THE TERMINAL
                         //console.log({ type:"DIRECT MASTERAGENT", id:referralModel.inviterId, bet, commission:referralModel.commission, commissionAmount, franchiseTaxMasterAgent, netCommissionAgent, totalCommissionMasteragentPlayer })

                    }
                }
            } else {
                /* If no referrals or agent, company commission will apply that will save on Bet table companyCommission */
                
                const companyCommission = Number(bet * (gameName === 'bbp' && gameData.bbpCommission));
                const transaction = await Transaction.new(w.id, gameData.gamesTableId[gameName], bet, "bet", odds, gameData.gameId[gameName], w.balance);
                const config = await Config.findOne({ where: { id: gameName === 'bbp' && 3} });

                const overAllCommission = Number(bet * config.fee);
                await Bet.new(gameData.gamesTableId[gameName], winLossTransaction.id, gameName === 'bbp' && ball, gameData.gameId[gameName], companyCommission, overAllCommission);

                totalCommission  += overAllCommission;
            }
      } 
  

      // Check if player has bet and balance wallet
      if (totalBets.length > 0) {
          if (referralModel) {
              const userInviter = await User.findOne({
                  where: { id: referralModel.inviterId },
                  attributes: ["role"],
              });

              if (userInviter.role === "agent") {
                  const w = await Wallet.findByUserId(referralModel.inviterId);
                  //const updatedBalanceAgent = toFixedTrunc((Number(w.balance) + totalCommissionAgent), 4);
                  const updatedBalanceAgent = (Number(w.balance) + totalCommissionAgent);

                  // DO NOT DELETE THIS COMMENT, USE TO VIEW ALL DETIALS OF BETS IN THE TERMINAL
                  //console.log({ type:"AGENT TOTAL", balance:w.balance, total:updatedBalanceAgent })

                  await Wallet.update(
                      { balance: updatedBalanceAgent },
                      { where: { user_id: referralModel.inviterId } }
                  );

                  const referralMasterAgentModel = await Referral.findOne({
                      where: { playerId: referralModel.inviterId },
                      attributes: ["commission", "inviterId"],
                  });

                  if (referralMasterAgentModel) {
                      const wAgent = await Wallet.findByUserId(referralMasterAgentModel.inviterId);
                      //const updatedBalanceMasteragent = toFixedTrunc((Number(wAgent.balance) + totalCommissionMasteragent),4);
                      const updatedBalanceMasteragent = (Number(wAgent.balance) + totalCommissionMasteragent);

                       // DO NOT DELETE THIS COMMENT, USE TO VIEW ALL DETIALS OF BETS IN THE TERMINAL
                       //console.log({ type:"MASTERAGENT TOTAL", balance:wAgent.balance, total:updatedBalanceMasteragent })

                      await Wallet.update(
                          { balance: updatedBalanceMasteragent },
                          { where: { user_id: referralMasterAgentModel.inviterId } }
                      );
                  }
              } else if (userInviter.role === "masteragent") {
                  const wMasteragentPlayer = await Wallet.findByUserId(referralModel.inviterId);
                  // const updatedBalanceMasteragentPlayer = toFixedTrunc((Number(wMasteragentPlayer.balance) + totalCommissionMasteragentPlayer), 4);
                  const updatedBalanceMasteragentPlayer = (Number(wMasteragentPlayer.balance) + totalCommissionMasteragentPlayer);

                   // DO NOT DELETE THIS COMMENT, USE TO VIEW ALL DETIALS OF BETS IN THE TERMINAL
                   //console.log({ type:"MASTERAGENT DIRECT TOTAL", balance:wMasteragentPlayer.balance, total:updatedBalanceMasteragentPlayer })

                  await Wallet.update(
                      { balance: updatedBalanceMasteragentPlayer },
                      { where: { user_id: referralModel.inviterId } }
                  );
              }
          }else{
            // const config = await Config.findOne({ where: { id: gameName === 'dos' ? 2 : 1 } });
            // config.update({ companyShare: totalCommission })
          }
      }
}

const insertWinningBall = async (gameData: GameData, gameName) => {
	await WinningBall.new(gameData.gamesTableId[gameName], gameName === 'bbp' && gameData.winnerOrders[gameName], gameName);
}




export class TransactionDb { }

