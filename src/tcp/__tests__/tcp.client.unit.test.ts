import { wait } from '@alien-worlds/aw-core';
import { BroadcastTcpClient } from '../tcp.client';
import { Socket } from 'net';
import { ConnectionState } from '../../enums';
import { BroadcastConnectionConfig } from '../../types';
import { BroadcastTcpMessageQueue } from '../tcp.message-queue';
import { BroadcastMessage } from '../../broadcast.message';
import {
  getClientAddress,
  getTcpConnectionOptions,
  splitToMessageBuffers,
} from '../tcp.utils';
import { BroadcastTcpSystemMessage } from '../messages/tcp.system.message';
import { BroadcastTcpMessage } from '../messages/tcp.message';
import { BroadcastTcpChannel } from '../tcp.channel';
import {
  BroadcastTcpMessageName,
  BroadcastTcpMessageType,
} from '../messages/tcp.message.enums';

jest.mock('net');
jest.mock('../tcp.utils');
jest.mock('../tcp.message-queue');

jest.mock('@alien-worlds/aw-core', () => ({
  wait: jest.fn(),
  log: jest.fn(),
}));

describe('BroadcastTcpClient', () => {
  let mockSocket;
  let mockMessageQueue;
  let client;

  beforeEach(() => {
    mockSocket = new Socket();
    mockMessageQueue = new BroadcastTcpMessageQueue(mockSocket);
    (getTcpConnectionOptions as jest.Mock).mockReturnValue({ path: '/some/path' });

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
    const mockMessage: BroadcastMessage = BroadcastMessage.create(
      'someClient',
      'someChannel',
      {},
      'someName'
    );

    client.sendMessage(mockMessage);
    expect((client as any).messageQueue.add).toHaveBeenCalledTimes(2);
  });

  it('should handle a message correctly', () => {
    const mockHandler = jest.fn();
    const mockMessage: BroadcastMessage = BroadcastMessage.create(
      'someClient',
      'someChannel',
      {},
      'someName'
    );
    client.onMessage(mockMessage.channel, mockHandler);

    expect((client as any).channelHandlers.get(mockMessage.channel)).toBe(mockHandler);
    expect((client as any).messageQueue.add).toHaveBeenCalled();
  });

  describe('onSocketData', () => {
    it('should handle system messages', () => {
      const systemMessage: BroadcastTcpSystemMessage = BroadcastTcpSystemMessage.create({
        id: '123',
        sender: 'server',
        channel: null,
        type: 'SYSTEM',
        name: 'System Message',
        recipient: null,
        data: {},
      });
      const messageFromBuffer: BroadcastTcpMessage = BroadcastTcpMessage.create({
        id: '456',
        sender: 'client1',
        channel: 'channel1',
        type: 'SYSTEM',
        name: 'System Message',
        recipient: null,
        data: {},
      });
      (splitToMessageBuffers as jest.Mock).mockReturnValue(['...', '...']);

      jest
        .spyOn(BroadcastTcpMessage, 'fromBuffer')
        .mockReturnValueOnce(systemMessage)
        .mockReturnValueOnce(messageFromBuffer);

      const handler = jest.fn();
      client.onMessage('channel1', handler);
      (client as any).onSystemMessage = jest.fn();
      (client as any).onSocketData(Buffer.from([]));

      expect(handler).not.toHaveBeenCalled();
      expect((client as any).onSystemMessage).toHaveBeenCalled();
    });

    it('should handle channel messages', () => {
      const systemMessage: BroadcastTcpSystemMessage = BroadcastTcpSystemMessage.create({
        id: '123',
        sender: 'server',
        channel: null,
        type: 'DATA',
        name: ' Message',
        recipient: null,
        data: {},
      });
      const messageFromBuffer: BroadcastTcpMessage = BroadcastTcpMessage.create({
        id: '456',
        sender: 'client1',
        channel: 'channel1',
        type: 'DATA',
        name: 'Message',
        recipient: null,
        data: {},
      });

      jest
        .spyOn(BroadcastTcpMessage, 'fromBuffer')
        .mockReturnValueOnce(systemMessage)
        .mockReturnValueOnce(messageFromBuffer);

      const handler = jest.fn();
      client.onMessage('channel1', handler);
      (client as any).channelHandlers.set('channel1', handler);
      (client as any).onSocketData(Buffer.from([]));

      expect((client as any).channelHandlers.get('channel1')).toBe(handler);
      expect(handler).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('onSocketConnect', () => {
    it('should set the connection state to online, update the address, and add client connected message to the message queue', () => {
      const address = '127.0.0.1';
      (getClientAddress as jest.Mock).mockReturnValue(address);

      jest.spyOn((client as any).messageQueue, 'add');
      jest.spyOn((client as any).messageQueue, 'start');

      (client as any).onSocketConnect();

      expect((client as any).connectionState).toBe(ConnectionState.Online);
      expect((client as any).address).toBe(address);
      expect(getClientAddress).toHaveBeenCalledWith((client as any).socket, true);
      expect((client as any).messageQueue['add']).toHaveBeenCalled();
      expect((client as any).messageQueue.start).toHaveBeenCalled();
    });
  });

  describe('onSocketError', () => {
    it('should set the connection state to offline, log the error message, stop the message queue, and trigger reconnect', () => {
      const error = new Error('Socket error');

      jest.spyOn((client as any).messageQueue, 'stop');
      jest.spyOn(client, 'reconnect');

      (client as any).onSocketError(error);

      expect((client as any).connectionState).toBe(ConnectionState.Offline);
      expect((client as any).messageQueue.stop).toHaveBeenCalled();
      expect((client as any).reconnect).toHaveBeenCalled();
    });
  });

  describe('onSocketEnd', () => {
    it('should set the connection state to offline, log the disconnection message, stop the message queue, and trigger reconnect', () => {
      jest.spyOn((client as any).messageQueue, 'stop');
      jest.spyOn(client, 'reconnect');

      (client as any).onSocketEnd();

      expect((client as any).connectionState).toBe(ConnectionState.Offline);
      expect((client as any).messageQueue.stop).toHaveBeenCalled();
      expect((client as any).reconnect).toHaveBeenCalled();
    });
  });
});
