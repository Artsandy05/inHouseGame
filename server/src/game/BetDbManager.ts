import { GameState, ZODIAC_LABELS, arrayToMap, hasValue, mapToArray } from "../../../common/gameutils";
import Bet from "../../models/Bet";
import CommissionTransaction from "../../models/CommissionTransaction";
import Config from "../../models/Config";
import Referral from "../../models/Referral";
import Transaction from "../../models/Transaction";
import User from "../../models/User";
import Wallet from "../../models/Wallet";
import Games from "../../models/Game";
import { Bet as BetData } from "./Bet";
import { BBPGameStateChanged, Game, GameData, Input, Output, Plugin, ZodiacGameStateChanged } from "./Code";
import { Player } from "./Player";
import { UserData } from "./UserData";
import { Sequelize } from "sequelize";
import GameRoundPlayerData from "../../models/GameRoundPlayerData";


export class BetDbManager implements Plugin {
	build(game: Game): void {
		game
			.system(update);
	}
}


function update(game: Game) {
	let gameData: GameData;
	let gameEntity;
	game.view(GameData).each((entity, g) => {
		gameEntity = entity;
		gameData = g;
	});

  // 3% operator - 1.25% ref 1.75
  // 5%
  
  // gameData.games.forEach(gameName => {
  //   game.view(gameName === 'dos' ? DosGameStateChanged : ZodiacGameStateChanged).each((entity, state) => {
  //     if (gameData.state[gameName] === GameState.WinnerDeclared && !gameData.hasWinnerDeclaredForIncompleteRound[gameName]) {
  //       let onlinePlayers = 0;
  //       game.view(Player, UserData, Output).each((entity, player, userData, output) => {
  //         if(player.slots.size > 0){
  //           onlinePlayers++;
  //         }
  //       })
  //       if(onlinePlayers < 1){
  //         GameRoundPlayerData.findAll({ 
  //           where: { 
  //             isComplete: false, 
  //             gameId: gameData.gamesTableId[gameName], 
  //             gameName 
  //           } 
  //         }).then(players => {
  //           if (players.length > 0) {
  //             players.forEach(player => {
  //               (async () => {
  //                 const user = await User.findByUUID(player.uuid);
  //                 const w = await Wallet.findByUserId(user.id);
  //                 const models = { User, Referral };
  //                 // @ts-ignore
  //                 User.associate && User.associate(models);
  //                 // @ts-ignore
  //                 Referral.associate && Referral.associate(models);

  //                 const referralModel = await Referral.findOne({
  //                     where: { playerId: user.id },
  //                     attributes: ["inviterId", "playerId", "commission"],
  //                 });

  //                 let totalCommissionAgent = 0;
  //                 let totalCommissionMasteragent = 0;
  //                 let totalCommissionMasteragentPlayer = 0;
  //                 let totalCommission = 0;
  //                 let totalBets = [];

  //                 const slots = arrayToMap(JSON.parse(player.slots));

  //                 for (const [index, amount] of slots.entries()) {
  //                   const newBal = w.balance - amount;
  //                   if (!isNaN(newBal) && hasValue(newBal) && newBal >= 0) {
  //                     totalBets.push(amount);

  //                     if (referralModel) {
  //                         const odds = gameData.odds[gameName].get(index);
  //                         const companyCommission = Number(amount * (gameName === 'dos' ? gameData.dosCommission : gameData.companyCommission));
  //                         const transaction = await Transaction.new(w.id, gameData.gamesTableId[gameName], amount, "bet", odds, gameData.gameId[gameName], w.balance);
  //                         const config = await Config.findOne({ where: { id: gameName === 'dos' ? 2 : 1 } });
  //                         const overAllCommission = Number(amount * config.fee);

  //                         const betModel = await Bet.new(gameData.gamesTableId[gameName], transaction.id, gameName === 'dos' ? index : ZODIAC_LABELS[parseInt(index)], gameData.gameId[gameName], companyCommission, overAllCommission);
                          
  //                         const playerOrAgentId = w.id;

  //                         const userInviter = await User.findOne({
  //                             where: { id: referralModel.inviterId },
  //                             attributes: ["role"],
  //                         });

                          

  //                         /* Commission of Agent and MasterAgent */
  //                         if (userInviter.role === "agent") {
  //                             const betId = betModel.id;

  //                             if (referralModel.commission !== '0.00') {
  //                                 const commissionAmount = (amount * (Number(referralModel.commission) / 100))
  //                                 const franchiseTaxAgent = (commissionAmount * 0.05)
  //                                 const netCommissionAgent = commissionAmount - franchiseTaxAgent;
  //                                 await CommissionTransaction.new(referralModel.inviterId, playerOrAgentId, null, betId, gameData.gamesTableId[gameName], commissionAmount, franchiseTaxAgent, referralModel.commission);

  //                                 /* Commission of Agent based on his players */
  //                                 totalCommissionAgent += netCommissionAgent; // Accumulate commissions
  //                             }

  //                             const referralMasterAgentModel = await Referral.findOne({
  //                                 where: { playerId: referralModel.inviterId },
  //                                 attributes: ["commission", "inviterId"],
  //                             });

  //                             if (referralMasterAgentModel) {
  //                                 console.log("---", { isCommissionZero: referralMasterAgentModel.commission !== '0.00', commission: referralMasterAgentModel.commission });

  //                                 if (referralMasterAgentModel.commission !== '0.00') {
  //                                     const commissionMasterAgentAmount = (amount * (Number(referralMasterAgentModel.commission) / 100));
  //                                     const franchiseTaxMasterAgent = (commissionMasterAgentAmount * 0.05)
  //                                     const netCommissionAgent = commissionMasterAgentAmount - franchiseTaxMasterAgent;
  //                                     await CommissionTransaction.new(referralMasterAgentModel.inviterId, referralModel.inviterId, playerOrAgentId, betId, gameData.gamesTableId[gameName], commissionMasterAgentAmount, franchiseTaxMasterAgent, referralMasterAgentModel.commission);

  //                                     /* Commission of Masteragent based on agent's player */
  //                                     totalCommissionMasteragent += netCommissionAgent;
  //                                 }
  //                             }
  //                         } else if (userInviter.role === "masteragent") {
  //                             console.log("^^^", { isCommissionZero: referralModel.commission !== '0.00', commission: referralModel.commission });

  //                             if (referralModel.commission !== '0.00') {
  //                                 const commissionAmount = (amount * (Number(referralModel.commission) / 100));
  //                                 const franchiseTaxMasterAgent = (commissionAmount * 0.05)
  //                                 const netCommissionAgent = commissionAmount - franchiseTaxMasterAgent;
  //                                 const betId = betModel.id;
  //                                 await CommissionTransaction.new(referralModel.inviterId, playerOrAgentId, null, betId, gameData.gamesTableId[gameName], commissionAmount, franchiseTaxMasterAgent, referralModel.commission);

  //                                 /* Commission of Masteragent based on his players */
  //                                 totalCommissionMasteragentPlayer += netCommissionAgent;
  //                             }
  //                         }
  //                     }else {
  //                       /* If no referrals or agent, company commission will apply that will save on Bet table companyCommission */
  //                         const odds = gameData.odds[gameName].get(index);
  //                         const companyCommission = Number(amount * (gameName === 'dos' ? gameData.dosCommission : gameData.companyCommission));
  //                         const transaction = await Transaction.new(w.id, gameData.gamesTableId[gameName], amount, "bet", odds, gameData.gameId[gameName], w.balance);
  //                         const config = await Config.findOne({ where: { id: gameName === 'dos' ? 2 : 1 } });

  //                         const overAllCommission = Number(amount * config.fee);
  //                         await Bet.new(gameData.gamesTableId[gameName], transaction.id, gameName === 'dos' ? index : ZODIAC_LABELS[parseInt(index)], gameData.gameId[gameName], companyCommission, overAllCommission);

  //                         // await Games.update(
  //                         //   { totalCommission: Sequelize.literal(`totalCommission + ${overAllCommission}`) },
  //                         //   { where: { id: gameData.gameId[gameName] } }
  //                         // );
                          
  //                         totalCommission  += overAllCommission;
  //                     }
  //                     game.emplace(gameEntity, new BetDbSuccess);
  //                   }
  //                 }

  //                 if (totalBets.length > 0) {
  //                     if (referralModel) {
  //                         const userInviter = await User.findOne({
  //                             where: { id: referralModel.inviterId },
  //                             attributes: ["role"],
  //                         });

  //                         if (userInviter.role === "agent") {
  //                             const w = await Wallet.findByUserId(referralModel.inviterId);
  //                             const updatedBalanceAgent = parseFloat((Number(w.balance) + Number(totalCommissionAgent)).toFixed(2));

  //                             await Wallet.update(
  //                                 { balance: updatedBalanceAgent },
  //                                 { where: { user_id: referralModel.inviterId } }
  //                             );

  //                             const referralMasterAgentModel = await Referral.findOne({
  //                                 where: { playerId: referralModel.inviterId },
  //                                 attributes: ["commission", "inviterId"],
  //                             });

  //                             if (referralMasterAgentModel) {
  //                                 const wAgent = await Wallet.findByUserId(referralMasterAgentModel.inviterId);
  //                                 const updatedBalanceMasteragent = parseFloat((Number(wAgent.balance) + Number(totalCommissionMasteragent)).toFixed(2));
  //                                 await Wallet.update(
  //                                     { balance: updatedBalanceMasteragent },
  //                                     { where: { user_id: referralMasterAgentModel.inviterId } }
  //                                 );
  //                             }
  //                         } else if (userInviter.role === "masteragent") {
  //                             const wMasteragentPlayer = await Wallet.findByUserId(referralModel.inviterId);
  //                             const updatedBalanceMasteragentPlayer = parseFloat((Number(wMasteragentPlayer.balance) + Number(totalCommissionMasteragentPlayer)).toFixed(2));
  //                             await Wallet.update(
  //                                 { balance: updatedBalanceMasteragentPlayer },
  //                                 { where: { user_id: referralModel.inviterId } }
  //                             );
  //                         }
  //                     }else{
  //                       // const config = await Config.findOne({ where: { id: gameName === 'dos' ? 2 : 1 } });
  //                       // config.update({ companyShare: totalCommission })
  //                     }
  //                 }
  //               })();
  //             });
  //           }
  //         }).catch(error => {
  //           console.error("Error during query:", error);
  //         });
  //       }
        
  //       gameData.hasWinnerDeclaredForIncompleteRound[gameName] = true;
  //     }
  //   })
  // });
  
      gameData.games.forEach(gameName => {
        game.view(gameName === 'bbp' && BBPGameStateChanged, Player, UserData, Output).each((entity, state, player, userData, output) => { 
          // && player.slots.size > 0
          if (player.game === gameName && gameData.state[gameName] === GameState.WinnerDeclared) {
            
              const playerSlots = new Map();
              playerSlots.set(userData.data.id, {
                  userId: userData.data.id,
                  uuid: userData.data.uuid,
                  gameId: gameData.gamesTableId[gameName],
                  slots: mapToArray(player.slots)
              });

              gameData.playerSlots[gameName] = Array.from(playerSlots.values());
          }
      });
  });


  game.view(BetData, UserData, Player, Output).each((entity, bet, userData, player, output) => {
    game.remove(gameEntity, BetDbSuccess);
    game.view(Output).each((entity, output) => {
      const convertedAllBets = {bbp:[]};
      for (let key in convertedAllBets) {
        const slots = gameData.slotBets[key];
        const walkinSlots = gameData.slotBetsWalkin[key];
        let combinedSlots = new Map(walkinSlots);
        slots.forEach((value, key) => {
          if (combinedSlots.has(key)) {
            combinedSlots.set(key, combinedSlots.get(key) + value);
          } else {
            combinedSlots.set(key, value);
          }
        });
        convertedAllBets[key] = mapToArray(combinedSlots);
      }
      
      if(hasValue(output.msg) && typeof output.msg === 'string'){
        let newOutPut = JSON.parse(output.msg);
        newOutPut.allBets = convertedAllBets;
        output.msg = JSON.stringify(newOutPut);
      }else{
        output.insert("allBets", convertedAllBets);
      }
      //output.insert("allBets", convertedAllBets);
      
    });
  });
}

export class BetDbSuccess { }

