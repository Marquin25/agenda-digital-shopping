/** Friday the 13th easter egg (B-76): every 13th activation of the black cat celebrates. */
export const LUCKY_NUMBER = 13;

export function isLuckyActivation(count: number): boolean {
  return count > 0 && count % LUCKY_NUMBER === 0;
}

export const CELEBRATION_MESSAGE =
  "Sexta-feira 13! O gato preto cruzou seu caminho… e trouxe sorte: tem evento bom te esperando na agenda.";

/** How long the celebration animation stays on, in milliseconds. */
export const CELEBRATION_MS = 2_000;
