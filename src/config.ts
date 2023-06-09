import { ConfigVars } from '@alien-worlds/api-core';
import { BroadcastConfig } from './types';

export const buildBroadcastConfig = (
  configVars: ConfigVars,
  prefix = ''
): BroadcastConfig => {
  const p = prefix
    ? prefix.endsWith('_')
      ? prefix.toUpperCase()
      : prefix.toUpperCase() + '_'
    : '';
  return {
    port: configVars.getNumberEnv(`${p}BROADCAST_PORT`),
    host: configVars.getStringEnv(`${p}BROADCAST_HOST`),
    clientName: configVars.getStringEnv(`${p}BROADCAST_CLIENT_NAME`),
  };
};
