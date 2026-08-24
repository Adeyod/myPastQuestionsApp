export const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not defined in environment variables.`);
  }

  return value;
};
