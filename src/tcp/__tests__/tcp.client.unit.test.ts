import { wait } from '@alien-worlds/api-core';
import { BroadcastTcpClient } from '../tcp.client';
import { Socket } from 'net';
import { ConnectionState } from '../../enums';
import { BroadcastConnectionConfig } from '../../types';
import { BroadcastTcpMessageQueue } from '../tcp.message-queue';
import { BroadcastMessage } from '../../broadcast.message';

jest.mock('net');
jest.mock('../tcp.message-queue');

jest.mock('@alien-worlds/api-core', () => ({
  wait: jest.fn(),
}));

describe('BroadcastTcpClient', () => {
  let mockSocket;
  let mockMessageQueue;
  let client;

  beforeEach(() => {
    mockSocket = new Socket();
    mockMessageQueue = new BroadcastTcpMessageQueue(mockSocket);

    const config: BroadcastConnectionConfig = {
      url: '/some/path',
    };

    client = new BroadcastTcpClient(config);
    (client as any).socket = mockSocket;
    (client as any).messageQueue = mockMessageQueue;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should construct with correct parameters', () => {
    expect((client as any).connectionOptions.path).toBe('/some/path');
    expect((client as any).socket).toBe(mockSocket);
    expect((client as any).messageQueue).toBe(mockMessageQueue);
    expect((client as any).connectionState).toBe(ConnectionState.Offline);
  });

  it('should handle system message correctly', () => {
    const mockSystemMessage = {
      data: {},
      name: 'someSystemMessage',
    };
    (client as any).onSystemMessage(mockSystemMessage);

  });

  it('should try to reconnect if connection state is offline', async () => {
    jest.useFakeTimers();
    (client as any).reconnectTimeout = 1000;
    (wait as jest.Mock).mockResolvedValue(true);
    (client as any).connectionState = ConnectionState.Offline;
    await (client as any).reconnect();

    jest.advanceTimersByTime(5000);
    expect((client as any).socket.connect).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('should send a message correctly', () => {
    const mockMessage: BroadcastMessage = {
      channel: 'someChannel',
      client: 'someClient',
      data: {},
      id: 'someId',
      name: 'someName',
    };

    client.sendMessage(mockMessage);
    expect((client as any).messageQueue.add).toHaveBeenCalledTimes(2);
  });

  it('should handle a message correctly', () => {
    const mockHandler = jest.fn();
    const mockMessage: BroadcastMessage = {
      channel: 'someChannel',
      client: 'someClient',
      data: {},
      id: 'someId',
      name: 'someName',
    };
    client.onMessage(mockMessage.channel, mockHandler);

    expect((client as any).channelHandlers.get(mockMessage.channel)).toBe(mockHandler);
    expect((client as any).messageQueue.add).toHaveBeenCalled();
  });
});
