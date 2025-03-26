import { hasValue } from "../../../common/gameutils";
import { Game, Input, Output, Plugin } from "./Code";

type ClassType<T> = new (...args: any[]) => T;

export class SocketManager implements Plugin {
  static classType: ClassType<any>;

  static setClassType<T>(classType: ClassType<T>) {
    SocketManager.classType = classType;
  }

	build(game: Game): void {
		game
			.before(this.before);
	}
	before(game) {
		game.view(SocketManager.classType, Input, Output)
		.each((entity, socket, input, output) => {
			input.msg = undefined;
			
			if (!hasValue(socket.isLoaded)) {
				socket.isLoaded = true;
				socket.on("message", (message) => {
					input.msg = JSON.parse(message);
				})
			}

			if (output.msg !== undefined) {
				socket.send(JSON.stringify(output.msg));
				output.msg = undefined;
			}
		});
	}
	
}