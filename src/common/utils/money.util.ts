export const nairaToKobo = (amountInNaira: number): number => {
  return Math.round(amountInNaira * 100);
};

export const koboToNaira = (amountInKobo: number): number => {
  return amountInKobo / 100;
};
