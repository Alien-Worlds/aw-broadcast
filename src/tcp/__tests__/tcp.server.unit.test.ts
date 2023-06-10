import { BroadcastTcpServer } from '../tcp.server';
import { BroadcastTcpClientCast } from '../tcp.client-cast';
import { BroadcastTcpStash } from '../tcp.stash';
import { Server, Socket, createServer } from 'net';
import { BroadcastTcpMessage } from '../messages/tcp.message';
import { log } from '@alien-worlds/api-core';
import { BroadcastTcpChannel } from '../tcp.channel';
import {
  getClientAddress,
  getTcpConnectionOptions,
  splitToMessageBuffers,
} from '../tcp.utils';
import { BroadcastMessage } from '../../broadcast.message';
import { BroadcastTcpSystemMessage } from '../messages/tcp.system.message';
import {
  BroadcastTcpMessageName,
  BroadcastTcpMessageType,
} from '../messages/tcp.message.enums';
import { serialize } from 'v8';
import { ClientMessageHandler } from '../../broadcast.server';

jest.mock('../tcp.utils');
jest.mock('../tcp.client-cast');
jest.mock('../tcp.stash');
jest.mock('@alien-worlds/api-core', () => ({
  log: jest.fn(),
}));

jest.mock('net', () => ({
  createServer: () => ({
    on: jest.fn(),
    listen: jest.fn(),
    once: jest.fn(),
  }),
}));

let socket: Socket = {
  remoteAddress: '0.0.0.0',
  remotePort: 1111,
  localAddress: '0.0.0.0',
  localPort: 1111,
  write: jest.fn(),
} as any;

describe('BroadcastTcpServer', () => {
  let broadcastServer: BroadcastTcpServer;
  let client: BroadcastTcpClientCast;
  const client1 = new BroadcastTcpClientCast(socket, 'client1');
  const client2 = new BroadcastTcpClientCast(socket, 'client2');

  beforeEach(() => {
    broadcastServer = new BroadcastTcpServer({});

    (client1 as any).name = 'client1';
    (client1 as any).address = '127.0.0.1';
    (client2 as any).name = 'client2';
    (client2 as any).address = '127.0.0.1';

    (getClientAddress as jest.Mock).mockReturnValue('127.0.0.1');

    (broadcastServer as any).clients = [client1, client2];

    (broadcastServer as any).channelsByName.set(
      'channel1',
      new BroadcastTcpChannel('channel1', [client1, client2])
    );

    client = new BroadcastTcpClientCast(socket, '');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onClientAddedMessageHandler', () => {
    it('should add client to channel and resend stashed messages', () => {
      const client1 = new BroadcastTcpClientCast(socket, 'client1');
      const client2 = new BroadcastTcpClientCast(socket, 'client2');

      (client1 as any).address = '127.0.0.1';
      (client2 as any).address = '127.0.0.1';

      (getClientAddress as jest.Mock).mockReturnValue('127.0.0.1');

      (broadcastServer as any).clients = [client1, client2];

      const channelsByName = new Map() as jest.Mocked<Map<string, BroadcastTcpChannel>>;

      (broadcastServer as any).channelsByName = channelsByName;
      const addClientSpy = jest.spyOn(BroadcastTcpChannel.prototype, 'addClient');
      const setSpy = jest.spyOn((broadcastServer as any).channelsByName, 'set');

      (broadcastServer as any).resendStashedMessages = jest.fn();
      (broadcastServer as any).onClientAddedMessageHandler(socket, {
        channel: 'channel1',
      });

      expect(getClientAddress).toHaveBeenCalledWith(socket, false);
      expect(setSpy).toHaveBeenCalled();
      expect(addClientSpy).toHaveBeenCalledTimes(0);
      expect((broadcastServer as any).resendStashedMessages).toHaveBeenCalledTimes(1);
      setSpy.mockClear();
    });

    it('should log an error if an exception is thrown', () => {
      const client1 = new BroadcastTcpClientCast(socket, 'client1');
      const client2 = new BroadcastTcpClientCast(socket, 'client2');

      (client1 as any).address = '127.0.0.1';
      (client2 as any).address = '127.0.0.1';

      (getClientAddress as jest.Mock).mockReturnValue('127.0.0.1');

      (broadcastServer as any).clients = [client1, client2];
      (broadcastServer as any).resendStashedMessages = jest.fn(() => {
        throw new Error('Something went wrong.');
      });

      (broadcastServer as any).onClientAddedMessageHandler(socket, {
        channel: 'channel1',
      });

      expect(log).toHaveBeenCalledWith('Something went wrong.');
    });
  });

  describe('onClientRemovedMessageHandler', () => {
    it('should remove client from the channel', () => {
      const client1 = new BroadcastTcpClientCast(socket, 'client1');
      const client2 = new BroadcastTcpClientCast(socket, 'client2');

      (client1 as any).address = '127.0.0.1';
      (client2 as any).address = '127.0.0.1';

      (getClientAddress as jest.Mock).mockReturnValue('127.0.0.1');

      (broadcastServer as any).clients = [client1, client2];
      (broadcastServer as any).channelsByName.set(
        'channel1',
        new BroadcastTcpChannel('channel1', [client1, client2])
      );

      const removeClientSpy = jest.spyOn(BroadcastTcpChannel.prototype, 'removeClient');

      (broadcastServer as any).onClientRemovedMessageHandler(socket, {
        channel: 'channel1',
      });

      expect(removeClientSpy).toHaveBeenCalledTimes(1);
    });

    it('should log an error if an exception is thrown', () => {
      const client1 = new BroadcastTcpClientCast(socket, 'client1');
      const client2 = new BroadcastTcpClientCast(socket, 'client2');

      (client1 as any).address = '127.0.0.1';
      (client2 as any).address = '127.0.0.1';

      (getClientAddress as jest.Mock).mockReturnValue('127.0.0.1');
      (broadcastServer as any).channelsByName.set(
        'channel1',
        new BroadcastTcpChannel('channel1', [client1, client2])
      );
      (broadcastServer as any).clients = [client1, client2];
      const removeClientSpy = jest.spyOn(BroadcastTcpChannel.prototype, 'removeClient');
      removeClientSpy.mockImplementation(() => {
        throw new Error('Something went wrong.');
      });

      (broadcastServer as any).onClientRemovedMessageHandler(socket, {
        channel: 'channel1',
      });

      expect(log).toHaveBeenCalledWith('Something went wrong.');
    });
  });

  describe('onClientDisconnected', () => {
    it('should remove client and remove client from channels', () => {
      const client1 = new BroadcastTcpClientCast(socket, 'client1');
      const client2 = new BroadcastTcpClientCast(socket, 'client2');

      (client1 as any).address = '127.0.0.1';
      (client2 as any).address = '127.0.0.1';

      (getClientAddress as jest.Mock).mockReturnValue('127.0.0.1');

      (broadcastServer as any).clients = [client1, client2];

      (broadcastServer as any).channelsByName.set(
        'channel1',
        new BroadcastTcpChannel('channel1', [client1, client2])
      );

      const removeClientSpy = jest.spyOn(BroadcastTcpChannel.prototype, 'removeClient');

      (broadcastServer as any).onClientDisconnected(socket);

      expect(getClientAddress).toHaveBeenCalledWith(socket, false);
      expect((broadcastServer as any).clients).toHaveLength(1);
      expect(removeClientSpy).toHaveBeenCalledTimes(1);
    });

    it('should log an error if an exception is thrown', () => {
      const client1 = new BroadcastTcpClientCast(socket, 'client1');
      const client2 = new BroadcastTcpClientCast(socket, 'client2');
      const removeClientSpy = jest.spyOn(BroadcastTcpChannel.prototype, 'removeClient');
      removeClientSpy.mockImplementation(() => {
        throw new Error('Something went wrong.');
      });

      (client1 as any).address = '127.0.0.1';
      (client2 as any).address = '127.0.0.1';

      (getClientAddress as jest.Mock).mockReturnValue('127.0.0.1');

      (broadcastServer as any).clients = [client1, client2];
      (broadcastServer as any).channelsByName.set(
        'channel1',
        new BroadcastTcpChannel('channel1', [client1, client2])
      );

      (broadcastServer as any).onClientDisconnected(socket);

      expect(log).toHaveBeenCalled();
    });
  });

  describe('findClient', () => {
    it('should find a client by name', () => {
      const client1 = new BroadcastTcpClientCast(socket, 'client1');
      const client2 = new BroadcastTcpClientCast(socket, 'client2');

      (client1 as any).name = 'client1';
      (client1 as any).address = '127.0.0.1';
      (client2 as any).address = '127.0.0.1';
      (client2 as any).name = 'client2';

      (broadcastServer as any).clients = [client1, client2];

      const result = (broadcastServer as any).findClient('client1');

      expect(result).toBeInstanceOf(BroadcastTcpClientCast);
      expect(result.name).toBe('client1');
    });

    it('should find a client by address', () => {
      const client1 = new BroadcastTcpClientCast(socket, 'client1');
      (client1 as any).name = 'client1';
      (client1 as any).address = '127.0.0.1';
      (broadcastServer as any).clients = [client1];

      const result = (broadcastServer as any).findClient('127.0.0.1');

      expect(result).toBeInstanceOf(BroadcastTcpClientCast);
      expect(result.address).toBe('127.0.0.1');
    });

    it('should return undefined if client is not found', () => {
      const result = (broadcastServer as any).findClient('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('onClientIncomingMessage', () => {
    it('should handle incoming message without recipient', () => {
      const socket = {};
      const message = new BroadcastTcpMessage(
        'message1',
        'sender1',
        'channel1',
        'type1',
        'name1'
      );

      (broadcastServer as any).channelsByName.get('channel1').sendMessage = jest.fn();
      (broadcastServer as any).findClient = jest.fn();
      const BroadcastMessageCreate = jest.spyOn(BroadcastMessage, 'create');

      (broadcastServer as any).clientMessageHandler = jest.fn();
      (broadcastServer as any).onClientIncomingMessage(socket, message);

      expect((broadcastServer as any).findClient).toHaveBeenCalledTimes(0);
      expect(BroadcastMessageCreate).toHaveBeenCalledWith(
        undefined,
        'channel1',
        undefined,
        'name1'
      );
      expect((broadcastServer as any).clientMessageHandler).toHaveBeenCalled();
      expect((broadcastServer as any).clients[0].send).toHaveBeenCalled();
      expect((broadcastServer as any).clients[1].send).not.toHaveBeenCalled();
      expect(
        (broadcastServer as any).channelsByName.get('channel1').sendMessage
      ).toHaveBeenCalledWith(message, ['127.0.0.1']);
    });

    it('should handle incoming message with recipient', () => {
      const socket = {};
      const message = new BroadcastTcpMessage(
        'message1',
        'sender1',
        'channel1',
        'type1',
        'name1',
        'recipient1'
      );
      const BroadcastMessageCreate = jest.spyOn(BroadcastMessage, 'create');
      (broadcastServer as any).findClient = jest.fn(
        () => (broadcastServer as any).clients[1]
      );
      (broadcastServer as any).channelsByName.get('channel1').sendMessage = jest.fn();
      (broadcastServer as any).clientMessageHandler = jest.fn();
      (broadcastServer as any).onClientIncomingMessage(socket, message);

      expect((broadcastServer as any).findClient).toHaveBeenCalledWith('recipient1');
      expect((broadcastServer as any).findClient).toHaveBeenCalledTimes(1);
      expect(BroadcastMessageCreate).toHaveBeenCalledWith(
        'recipient1',
        'channel1',
        undefined,
        'name1'
      );
      expect((broadcastServer as any).clientMessageHandler).toHaveBeenCalled();
      expect((broadcastServer as any).clients[0].send).toHaveBeenCalled();
      expect(
        (broadcastServer as any).channelsByName.get('channel1').sendMessage
      ).toHaveBeenCalledWith(message, ['127.0.0.1']);
    });

    it('should handle incoming message with undelivered message', () => {
      const socket = {};
      const message = new BroadcastTcpMessage(
        'message1',
        'sender1',
        'channel1',
        'type1',
        'name1',
        'recipient1',
        null,
        true
      );
      const createMessageNotDeliveredSpy = jest.spyOn(
        BroadcastTcpSystemMessage,
        'createMessageNotDelivered'
      );
      (broadcastServer as any).clientMessageHandler = jest.fn();
      (broadcastServer as any).findClient = jest.fn(() => null);
      (broadcastServer as any).channelsByName.get('channel1').sendMessage = jest.fn(
        () => false
      );

      (broadcastServer as any).onClientIncomingMessage(socket, message);

      expect((broadcastServer as any).findClient).toHaveBeenCalledTimes(1);
      expect(BroadcastMessage.create).toHaveBeenCalledWith(
        'recipient1',
        'channel1',
        null,
        'name1'
      );
      expect((broadcastServer as any).clientMessageHandler).toHaveBeenCalled();
      expect((broadcastServer as any).clients[0].send).toHaveBeenCalled();
      expect(
        (broadcastServer as any).channelsByName.get('channel1').sendMessage
      ).toHaveBeenCalledWith(message, ['127.0.0.1']);
      expect(createMessageNotDeliveredSpy).toHaveBeenCalledWith(message);
      expect((broadcastServer as any).stash.add).toHaveBeenCalledWith(message);
    });
  });

  describe('onClientError', () => {
    it('should handle client connection error', () => {
      const socket = {};
      const error = new Error('Connection error');

      const removeClientSpy = jest.spyOn(BroadcastTcpChannel.prototype, 'removeClient');

      (broadcastServer as any).onClientError(socket, error);

      expect(removeClientSpy).toHaveBeenCalledWith('127.0.0.1');
    });
  });

  describe('handleClientMessage', () => {
    it('should handle client connected system message', () => {
      (broadcastServer as any).onClientConnected = jest.fn();

      const socket = {};
      const buffer = serialize({
        id: '1',
        type: BroadcastTcpMessageType.System,
        name: BroadcastTcpMessageName.ClientConnected,
        data: { name: 'client1', channels: ['channel1'] },
      });
      (broadcastServer as any).handleClientMessage(socket, buffer);

      expect((broadcastServer as any).onClientConnected).toHaveBeenCalledWith(
        socket,
        expect.objectContaining({
          name: 'client1',
          channels: ['channel1'],
        })
      );
    });

    it('should handle client added message handler system message', () => {
      const socket = {};
      const buffer = serialize({
        id: '2',
        type: BroadcastTcpMessageType.System,
        name: BroadcastTcpMessageName.ClientAddedMessageHandler,
        data: { channel: 'channel1' },
      });
      (broadcastServer as any).onClientAddedMessageHandler = jest.fn();
      (broadcastServer as any).handleClientMessage(socket, buffer);

      expect((broadcastServer as any).onClientAddedMessageHandler).toHaveBeenCalledWith(
        socket,
        expect.objectContaining({
          channel: 'channel1',
        })
      );
    });

    it('should handle client removed message handler system message', () => {
      const socket = {};
      const buffer = serialize({
        id: '3',
        type: BroadcastTcpMessageType.System,
        name: BroadcastTcpMessageName.ClientRemovedMessageHandler,
        data: { channel: 'channel1' },
      });
      (broadcastServer as any).onClientRemovedMessageHandler = jest.fn();
      (broadcastServer as any).handleClientMessage(socket, buffer);

      expect((broadcastServer as any).onClientRemovedMessageHandler).toHaveBeenCalledWith(
        socket,
        expect.objectContaining({
          channel: 'channel1',
        })
      );
    });

    it('should handle client incoming data message', () => {
      const socket = {};
      const buffer = serialize({
        id: '4',
        type: BroadcastTcpMessageType.Data,
        name: 'message1',
        data: { text: 'Hello, World!' },
      });
      (broadcastServer as any).onClientIncomingMessage = jest.fn();
      (broadcastServer as any).handleClientMessage(socket, buffer);

      expect((broadcastServer as any).onClientIncomingMessage).toHaveBeenCalledWith(
        socket,
        expect.any(BroadcastTcpMessage)
      );
    });

    it('should handle unknown message type', () => {
      const socket = {};
      const buffer = serialize({
        id: '5',
        type: 'unknown',
        name: 'message1',
        data: { text: 'Hello, World!' },
      });
      (broadcastServer as any).onClientConnected = jest.fn();
      (broadcastServer as any).onClientAddedMessageHandler = jest.fn();
      (broadcastServer as any).onClientRemovedMessageHandler = jest.fn();
      (broadcastServer as any).onClientIncomingMessage = jest.fn();

      (broadcastServer as any).handleClientMessage(socket, buffer);

      expect((broadcastServer as any).onClientConnected).not.toHaveBeenCalled();
      expect((broadcastServer as any).onClientAddedMessageHandler).not.toHaveBeenCalled();
      expect(
        (broadcastServer as any).onClientRemovedMessageHandler
      ).not.toHaveBeenCalled();
      expect((broadcastServer as any).onClientIncomingMessage).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON message', () => {
      const socket = {};
      const buffer = serialize('invalid');

      (broadcastServer as any).onClientConnected = jest.fn();
      (broadcastServer as any).onClientAddedMessageHandler = jest.fn();
      (broadcastServer as any).onClientRemovedMessageHandler = jest.fn();
      (broadcastServer as any).onClientIncomingMessage = jest.fn();

      (broadcastServer as any).handleClientMessage(socket, buffer);

      expect((broadcastServer as any).onClientConnected).not.toHaveBeenCalled();
      expect((broadcastServer as any).onClientAddedMessageHandler).not.toHaveBeenCalled();
      expect(
        (broadcastServer as any).onClientRemovedMessageHandler
      ).not.toHaveBeenCalled();
      expect((broadcastServer as any).onClientIncomingMessage).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('should start the server and set up event listeners', async () => {
      const bufferMock = Buffer.from('message1');
      const serverMock = createServer();
      (broadcastServer as any).handleClientMessage = jest.fn();
      (broadcastServer as any).onClientError = jest.fn();
      (broadcastServer as any).onClientDisconnected = jest.fn();
      (splitToMessageBuffers as jest.Mock).mockReturnValue([bufferMock]);
      (getTcpConnectionOptions as jest.Mock).mockReturnValue({});

      const options = {};

      const onConnectionMock = jest.fn();
      const onDataMock = jest.fn();
      const onErrorMock = jest.fn();
      const onCloseMock = jest.fn();
      (broadcastServer as any).server = serverMock;
      (broadcastServer as any).server.on.mockImplementation((event, callback) => {
        if (event === 'connection') {
          onConnectionMock(callback);
        }
      });

      const socketMock = {
        on: jest.fn(),
        once: jest.fn(),
      } as any;

      onConnectionMock.mockImplementation(callback => {
        callback(socketMock);

        expect(socketMock.on).toHaveBeenCalledWith('data', expect.any(Function));
        expect(socketMock.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(socketMock.once).toHaveBeenCalledWith('close', expect.any(Function));

        const onDataCallback = socketMock.on.mock.calls.find(
          call => call[0] === 'data'
        )[1];
        const onErrorCallback = socketMock.on.mock.calls.find(
          call => call[0] === 'error'
        )[1];
        const onCloseCallback = socketMock.once.mock.calls.find(
          call => call[0] === 'close'
        )[1];

        const handleClientMessageMock = (broadcastServer as any).handleClientMessage;

        onDataCallback(bufferMock);
        expect(handleClientMessageMock).toHaveBeenCalledWith(socketMock, bufferMock);

        const errorMock = new Error('Connection error');
        onErrorCallback(errorMock);
        expect((broadcastServer as any).onClientError).toHaveBeenCalledWith(
          socketMock,
          errorMock
        );

        onCloseCallback();
        expect((broadcastServer as any).onClientDisconnected).toHaveBeenCalledWith(
          socketMock
        );
      });

      await broadcastServer.start();

      expect((broadcastServer as any).server.listen).toHaveBeenCalled();
      expect((broadcastServer as any).server.listen).toHaveBeenCalledWith(
        options,
        expect.any(Function)
      );
      expect((broadcastServer as any).server.on).toHaveBeenCalledWith(
        'connection',
        expect.any(Function)
      );
      expect((broadcastServer as any).onClientError).toHaveBeenCalledWith(
        socketMock,
        expect.any(Error)
      );
      expect((broadcastServer as any).onClientDisconnected).toHaveBeenCalledWith(
        socketMock
      );
    });
  });

  it('should set the clientMessageHandler correctly', () => {
    const server = new BroadcastTcpServer({});

    const mockHandler: ClientMessageHandler<BroadcastMessage> = jest.fn();

    server.onMessage(mockHandler);

    expect(server['clientMessageHandler']).toBe(mockHandler);
  });

  describe('sendMessageToChannel', () => {
    it('should send a message to the channel if it exists', () => {
      const server = new BroadcastTcpServer({});

      const mockSendMessage = jest.fn();

      const mockChannel = {
        sendMessage: mockSendMessage,
      } as any;

      (server as any).channelsByName.set('channel1', mockChannel);

      (server as any).sendMessageToChannel('123', 'Message', 'channel1', {
        data: 'test',
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        BroadcastTcpMessage.create({
          id: '123',
          sender: 'server',
          channel: 'channel1',
          data: { data: 'test' },
          name: 'Message',
          type: 'DATA',
        })
      );
    });

    it('should log an error message if the channel does not exist', () => {
      const server = new BroadcastTcpServer({});

      (server as any).sendMessageToChannel('123', 'Message', 'nonexistent', {
        data: 'test',
      });

      expect(log as jest.Mock).toHaveBeenCalled();
    });
  });

  describe('sendMessageToClient', () => {
    it('should send a message to the client', () => {
      const server = new BroadcastTcpServer({});

      const mockSend = jest.fn();

      const mockClient = {
        send: mockSend,
        address: 'client1',
      } as any;

      server['sendMessageToClient']('123', mockClient, { data: 'test' }, 'Message');

      expect(mockSend.mock.calls[0][0]).toEqual({
        id: '123',
        sender: 'server',
        channel: null,
        data: { data: 'test' },
        name: 'Message',
        type: 'DATA',
        recipient: 'client1',
        persistent: true,
      });
    });

    it('should log an error message if an error occurs', () => {
      const server = new BroadcastTcpServer({});

      const mockClient = {
        address: 'client1',
      } as any;

      server['sendMessageToClient']('123', mockClient, { data: 'test' }, 'Message');

      expect(log as jest.Mock).toHaveBeenCalledWith(
        'An error occurred while sending a message to client.'
      );
    });
  });

  describe('sendMessage', () => {
    it('should call sendMessageToChannel if channel is specified', () => {
      const mockSendMessageToChannel = jest.fn();
      (broadcastServer as any).sendMessageToChannel = mockSendMessageToChannel;

      const mockSendMessageToClient = jest.fn();
      (broadcastServer as any).sendMessageToClient = mockSendMessageToClient;

      const mockMessage = {
        id: '123',
        channel: 'channel1',
        client: '',
        name: 'Message',
        data: { data: 'test' },
      } as any;

      broadcastServer.sendMessage(mockMessage);

      expect(mockSendMessageToChannel).toHaveBeenCalledWith(
        '123',
        'Message',
        'channel1',
        { data: 'test' }
      );

      expect(mockSendMessageToClient).not.toHaveBeenCalled();
    });

    it('should call sendMessageToClient if client is specified', () => {
      const mockSendMessageToChannel = jest.fn();
      (broadcastServer as any).sendMessageToChannel = mockSendMessageToChannel;

      const mockSendMessageToClient = jest.fn();
      (broadcastServer as any).sendMessageToClient = mockSendMessageToClient;

      const mockMessage = {
        id: '123',
        channel: '',
        client: 'client1',
        name: 'Message',
        data: { data: 'test' },
      } as any;

      broadcastServer.sendMessage(mockMessage);

      expect(mockSendMessageToChannel).not.toHaveBeenCalled();

      expect(mockSendMessageToClient).toHaveBeenCalledWith(
        '123',
        expect.anything(),
        { data: 'test' },
        'Message'
      );
    });

    it('should not call sendMessageToChannel or sendMessageToClient if neither channel nor client is specified', () => {
      const server = new BroadcastTcpServer({});

      const mockSendMessageToChannel = jest.fn();
      (broadcastServer as any).sendMessageToChannel = mockSendMessageToChannel;

      const mockSendMessageToClient = jest.fn();
      (broadcastServer as any).sendMessageToClient = mockSendMessageToClient;

      const mockMessage = {
        id: '123',
        channel: '',
        client: '',
        name: 'Message',
        data: { data: 'test' },
      } as any;

      server.sendMessage(mockMessage);

      expect(mockSendMessageToChannel).not.toHaveBeenCalled();

      expect(mockSendMessageToClient).not.toHaveBeenCalled();
    });
  });

  describe('resendStashedMessages', () => {
    it('should resend stashed messages to the client', () => {
      const stash = new BroadcastTcpStash() as jest.Mocked<BroadcastTcpStash>;

      stash.pop.mockReturnValueOnce([
        new BroadcastTcpMessage(
          '1',
          'sender',
          'channel',
          'type',
          'name',
          'recipient',
          'data'
        ),
        new BroadcastTcpMessage(
          '2',
          'sender',
          'channel',
          'type',
          'name',
          'recipient',
          'data'
        ),
      ]);

      (broadcastServer as any).stash = stash;

      (broadcastServer as any).resendStashedMessages(client, 'channel');

      expect(client.send).toHaveBeenCalledTimes(2);
      expect(client.send).toHaveBeenCalledWith(expect.any(BroadcastTcpMessage));
      expect(client.send).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ id: '1' })
      );
      expect(client.send).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ id: '2' })
      );
    });

    it('should log an error if an exception is thrown', () => {
      const stash = new BroadcastTcpStash() as jest.Mocked<BroadcastTcpStash>;

      stash.pop.mockImplementation(() => {
        throw new Error('Something went wrong.');
      });

      (broadcastServer as any).stash = stash;

      (broadcastServer as any).resendStashedMessages(client, 'channel');

      expect(log).toHaveBeenCalledWith('Something went wrong.');
    });
  });

  describe('onClientConnected', () => {
    it.skip('should handle client connection and add to channels', () => {
      const addClientSpy = jest.spyOn(BroadcastTcpChannel.prototype, 'addClient');
      const channelsByName = new Map() as jest.Mocked<Map<string, BroadcastTcpChannel>>;
      (broadcastServer as any).channelsByName = channelsByName;

      (broadcastServer as any).resendStashedMessages = jest.fn();

      (broadcastServer as any).onClientConnected(socket, {
        name: 'client3',
        channels: ['channel1', 'channel2'],
      });

      expect(log).toHaveBeenCalledWith(
        'Broadcast TCP Server: client 127.0.0.1 (client1) connection open.'
      );

      expect(addClientSpy).toHaveBeenCalledTimes(2);

      expect((broadcastServer as any).resendStashedMessages).toHaveBeenCalledTimes(2);
    });

    it('should log an error if an exception is thrown', () => {
      (broadcastServer as any).resendStashedMessages = jest.fn(() => {
        throw new Error('Something went wrong.');
      });

      (broadcastServer as any).onClientConnected(socket, {
        name: 'client',
        channels: ['channel'],
      });

      expect(log).toHaveBeenCalledWith('Something went wrong.');
    });
  });
});
