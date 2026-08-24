export const generateCode = (num: number) => {
  return generateRandomCode(num);
};

export const generateRandomCode = (len: number): number => {
  if (len < 1) {
    throw new Error('Number must be greater than 0');
  }

  const max = Math.pow(10, len - 1);
  const min = Math.pow(10, len) - 1;

  const randomNum = Math.floor(min + Math.random() * (max - min + 1));
  return randomNum;
};
