

export class Socket {
	recvFn;
	replyFn;

	// For testing purposes only
	uuid;

	constructor(replyFn) {
		this.replyFn = replyFn;
	}

	on(event: string, callback: (message: string) => void): void {
		if (event === "message") {
			this.recvFn = callback;
		}
	}

	simulateMessage(message: string): void {
		if (this.recvFn) {
			this.recvFn(message);
		}
	}

	send(message: string): void {
		if (this.replyFn !== undefined) {
			this.replyFn(message);
		}
	}
}

export class Socket2 {
	recvFn;
	replyFn;

	constructor() {
	}

	on(event: string, callback: (message: string) => void): void {
		if (event === "message") {
			this.recvFn = callback;
		}
	}

	simulateMessage(message: string): void {
		if (this.recvFn) {
			this.recvFn(message);
		}
	}

	send(message: string): void {
		if (this.replyFn) {
			this.replyFn(message);
		}
	}

	onReply(cb: (message: string) => void) {
		this.replyFn = cb;
	}
}


