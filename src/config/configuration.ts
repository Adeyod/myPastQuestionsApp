import { getEnvOrThrow } from './env.utils';

export default () => ({
  envValues: {
    secret: getEnvOrThrow('JWT_SECRET'),
    refreshToken: getEnvOrThrow('JWT_REFRESH_SECRET'),
    jwt_expires_in: getEnvOrThrow('JWT_EXPIRES_IN'),
    jwt_refresh_expires_in: getEnvOrThrow('JWT_REFRESH_EXPIRES_IN'),
  },
});
