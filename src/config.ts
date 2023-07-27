import { ConfigVars } from '@alien-worlds/aw-core';
import { BroadcastConfig } from './types';

/**
 * Builds a broadcast configuration object from a provided set of environment variables.
 *
 * This function uses a `ConfigVars` object to get environment variables, and it appends a provided prefix
 * to the environment variable keys when fetching their values. The function then builds and returns a `BroadcastConfig` object
 * that represents the configuration of the broadcast system.
 *
 * @param configVars The `ConfigVars` object that encapsulates the environment variables.
 * @param prefix A string to prefix to the environment variable keys. The string will be transformed to uppercase and an underscore
 * will be appended if it is not already present. Default is an empty string.
 * @returns A `BroadcastConfig` object that includes port, host, and clientName properties. These properties represent
 * the configuration of the broadcast system.
 */
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
