import { Op } from "sequelize";
import Config from "../../../models/Config";
import Game from "../../../models/Game";
import User from "../../../models/User";
import { Game as GameWorld, GameData, Input, Output, Plugin } from "./Code";
import { Moderator } from "./Moderator";
import { UserData } from "./UserData";

export class DatabaseManager implements Plugin {
	build(game: GameWorld): void {
		game
			.system(insertGameData);
	}
}

function updateUserData(game) {
	game.view(UserData).each((entity, userData) => {
		if (!userData.isInitialized) {
			userData.isInitialized = true;
			initUserData(userData);
		}
	});
}

function insertGameData(game) {
	game.view(UserData, Moderator).each((entity, userData) => {
		game.view(GameData).each((entity, gameData) => {
			if (gameData.isInsertGameDatabase.state) {
				insertGame(gameData, gameData.isInsertGameDatabase.game === 'bbp' && 3, userData.data.dataValues.id, gameData.isInsertGameDatabase.game);
        gameData.isInsertGameDatabase.state = false;
        gameData.isInsertGameDatabase.game = '';
			}
		});
	});
}

function insertGame(gameData: GameData, game_id, userId, gameName) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  Config.findOne({ where:{ id:game_id }}).then(config => {
    // Count the number of games created today
    Game.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(today + 'T00:00:00Z'), // Start of today
          [Op.lt]: new Date(today + 'T23:59:59Z')  // End of today
        }
      }
    }).then(count => {
      // Use the count as the gameId
      Game.new(userId, config.id, game_id, gameName).then(res => {
        console.log(`Game ${gameName} created`);

        const currentYear = new Date().getFullYear();
        const currentDate = new Date().getDate();
        const currentMonth = new Date().getMonth() + 1;  // Months are zero-indexed
        const day = currentDate < 10 ? `0${currentDate}` : `${currentDate}`;  // Add leading zero if necessary
        const month = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;  // Add leading zero if necessary
        const yearShort = currentYear.toString().slice(-2);
        const formattedDate = `${yearShort}${month}${day}`;
        const gameInitials = gameName.toLowerCase() === 'bbp' && 'BBP';
        const countFormatted = String(count + 1).padStart(4, '0');
        const gameId = `${formattedDate}${gameInitials}${countFormatted}`;

        // Set the count of today's games as the value for gameData.gameId
        gameData.gameId[gameName] = gameId;
        gameData.gamesTableId[gameName] = res.id;
      }).catch(error => {
        console.log(error);
      });

    }).catch(error => {
      console.log(error);
    });

  }).catch(error => {
    console.log(error);
  });
}


function initUserData(userData) {
	User.findByUUID(userData.data.dataValues.uuid)
		.then(result => {
			// userData.id = result.id;
			userData.data = result;
			// console.log(result.role)
		}).catch(error => {
			console.log(error)
		})
}

/*
	Issue a async function
	Need a feedback loop
		Issue the database change
		Then have a listener after processing
*/