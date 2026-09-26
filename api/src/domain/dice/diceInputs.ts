import {
	BONUS_POINTS,
	BONUS_THRESHOLD,
	NUM_DICES,
} from "@/domain/dice/dice.type.ts";

/**
 * Calcul des scores pour chaque ligne de la feuille de score (Yams / 5 dés).
 * Les dés sont un tableau de 5 faces (1-6).
 */

export interface DiceFaceInput {
	face: number;
	locked?: boolean;
}

function countFaces(dices: DiceFaceInput[]): Record<number, number> {
	const counts: Record<number, number> = {};
	for (const d of dices) {
		counts[d.face] = (counts[d.face] ?? 0) + 1;
	}
	return counts;
}

export function oneInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	return dices.filter((d) => d.face === 1).length * 1;
}

export function twoInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	return dices.filter((d) => d.face === 2).length * 2;
}

export function threeInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	return dices.filter((d) => d.face === 3).length * 3;
}

export function fourInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	return dices.filter((d) => d.face === 4).length * 4;
}

export function fiveInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	return dices.filter((d) => d.face === 5).length * 5;
}

export function sixInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	return dices.filter((d) => d.face === 6).length * 6;
}

export function threeOfAKindInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	const faceCounts = countFaces(dices);
	const hasThree = Object.values(faceCounts).some((c) => c >= 3);
	return hasThree ? dices.reduce((acc, d) => acc + d.face, 0) : 0;
}

export function fourOfAKindInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	const faceCounts = countFaces(dices);
	const hasFour = Object.values(faceCounts).some((c) => c >= 4);
	return hasFour ? dices.reduce((acc, d) => acc + d.face, 0) : 0;
}

export function fullHouseInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	const sorted = [...dices].sort((a, b) => a.face - b.face);
	const isFullHouse =
		(sorted[0].face === sorted[1].face &&
			sorted[0].face === sorted[2].face &&
			sorted[3].face === sorted[4].face) ||
		(sorted[0].face === sorted[1].face &&
			sorted[2].face === sorted[3].face &&
			sorted[2].face === sorted[4].face);
	const allSame = sorted.every(
		(d, i) => i === 0 || d.face === sorted[i - 1].face,
	);
	return isFullHouse && !allSame ? 25 : 0;
}

export function smallStraightInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	const faces = new Set(dices.map((d) => d.face));
	const isSmall =
		(faces.has(1) && faces.has(2) && faces.has(3) && faces.has(4)) ||
		(faces.has(2) && faces.has(3) && faces.has(4) && faces.has(5)) ||
		(faces.has(3) && faces.has(4) && faces.has(5) && faces.has(6));
	return isSmall ? 30 : 0;
}

export function largeStraightInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	const sorted = [...dices].sort((a, b) => a.face - b.face);
	const isLarge =
		(sorted[0].face === 1 &&
			sorted[1].face === 2 &&
			sorted[2].face === 3 &&
			sorted[3].face === 4 &&
			sorted[4].face === 5) ||
		(sorted[0].face === 2 &&
			sorted[1].face === 3 &&
			sorted[2].face === 4 &&
			sorted[3].face === 5 &&
			sorted[4].face === 6);
	return isLarge ? 40 : 0;
}

export function diceInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	const first = dices[0].face;
	return dices.every((d) => d.face === first) ? 50 : 0;
}

export function chanceInput(dices: DiceFaceInput[]): number {
	if (dices?.length !== NUM_DICES) return 0;
	return dices.reduce((acc, d) => acc + d.face, 0);
}

export const SCORE_KEYS = [
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"threeOfAKind",
	"fourOfAKind",
	"fullHouse",
	"smallStraight",
	"largeStraight",
	"chance",
	"dice",
] as const;

export type ScoreKey = (typeof SCORE_KEYS)[number];

const INPUT_FUNCTIONS: Record<ScoreKey, (dices: DiceFaceInput[]) => number> = {
	one: oneInput,
	two: twoInput,
	three: threeInput,
	four: fourInput,
	five: fiveInput,
	six: sixInput,
	threeOfAKind: threeOfAKindInput,
	fourOfAKind: fourOfAKindInput,
	fullHouse: fullHouseInput,
	smallStraight: smallStraightInput,
	largeStraight: largeStraightInput,
	chance: chanceInput,
	dice: diceInput,
};

export function computeScoreFor(key: ScoreKey, dices: DiceFaceInput[]): number {
	return INPUT_FUNCTIONS[key](dices);
}

const UPPER_KEYS: ScoreKey[] = ["one", "two", "three", "four", "five", "six"];

export interface DicePlayerScoresLike {
	one: number | null;
	two: number | null;
	three: number | null;
	four: number | null;
	five: number | null;
	six: number | null;
	bonus: number;
	threeOfAKind: number | null;
	fourOfAKind: number | null;
	fullHouse: number | null;
	smallStraight: number | null;
	largeStraight: number | null;
	chance: number | null;
	dice: number | null;
	total: number;
}

export function computeBonusAndTotal(scores: DicePlayerScoresLike): {
	bonus: number;
	total: number;
} {
	const upperSum = UPPER_KEYS.reduce((acc, k) => acc + (scores[k] ?? 0), 0);
	const bonus = upperSum >= BONUS_THRESHOLD ? BONUS_POINTS : 0;
	const lowerKeys: ScoreKey[] = [
		"threeOfAKind",
		"fourOfAKind",
		"fullHouse",
		"smallStraight",
		"largeStraight",
		"chance",
		"dice",
	];
	const lowerSum = lowerKeys.reduce((acc, k) => acc + (scores[k] ?? 0), 0);
	const total = upperSum + bonus + lowerSum;
	return { bonus, total };
}
