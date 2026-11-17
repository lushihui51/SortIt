import type { Deck } from "../../convex/model/deck";
import type { AppDeckFile } from "./appDeckFile";
import file from "./deck.json";
import { toDeck } from "./toDeck";

export const appDeckFile: AppDeckFile = file;
export const appDeck: Deck = toDeck(appDeckFile);
