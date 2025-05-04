

export class Player {
	hasBet = false;
	newBetSlot = new Map<string, number>();
	slots = new Map<string, number>();
	uuid: string; // For testing
  game: '';
  isSavedToDb = false;
}

