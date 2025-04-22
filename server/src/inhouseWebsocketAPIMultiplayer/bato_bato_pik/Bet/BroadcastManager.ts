import { Game, Plugin } from "../Code";

export class PlayerManager implements Plugin {
	build(game: Game): void {
		game
			.system(update);
	}
}

function update(game: Game) {

}