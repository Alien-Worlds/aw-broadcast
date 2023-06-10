import { ConfigVars } from '@alien-worlds/api-core';
import { buildBroadcastConfig } from '../config';

// Mock the ConfigVars class
jest.mock('@alien-worlds/api-core', () => {
  return {
    ConfigVars: jest.fn().mockImplementation(() => {
      return {
        getNumberEnv: jest.fn().mockImplementation(key => {
          switch (key) {
            case 'BROADCAST_PORT':
              return 9000;
            default:
              return null;
          }
        }),
        getStringEnv: jest.fn().mockImplementation(key => {
          switch (key) {
            case 'BROADCAST_HOST':
              return 'localhost';
            case 'BROADCAST_CLIENT_NAME':
              return 'TestClient';
            default:
              return null;
          }
        }),
      };
    }),
  };
});

describe('buildBroadcastConfig', () => {
  it('should return the correct config object', () => {
    const configVars = new ConfigVars();

    const expectedConfig = {
      port: 9000,
      host: 'localhost',
      clientName: 'TestClient',
    };

    const resultConfig = buildBroadcastConfig(configVars);

    expect(resultConfig).toEqual(expectedConfig);
  });

  it('should handle prefix correctly', () => {
    const configVars = new ConfigVars();

    const expectedConfig = {
      port: null,
      host: null,
      clientName: null,
    };

    const resultConfig = buildBroadcastConfig(configVars, 'nonexistent');

    expect(resultConfig).toEqual(expectedConfig);
  });
});
