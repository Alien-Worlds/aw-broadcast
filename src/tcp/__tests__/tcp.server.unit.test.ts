import { Socket } from 'net';
import { BroadcastTcpServer } from '../tcp.server';
import { BroadcastMessageHandlerData } from '../tcp.types';

jest.mock('net', () => {
  return {
    Socket: jest.fn(),
    createServer: jest.fn().mockReturnThis(),
    on: jest.fn(),
    listen: jest.fn(),
  };
});

jest.mock('./path/to/tcp.client-cast', () => {
  return {
    BroadcastTcpClientCast: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn(),
      };
    }),
  };
});

jest.mock('./path/to/tcp.channel', () => {
  return {
    BroadcastTcpChannel: jest.fn().mockImplementation(() => {
      return {
        addClient: jest.fn(),
        removeClient: jest.fn(),
        sendMessage: jest.fn(),
      };
    }),
  };
});

describe('BroadcastTcpServer', () => {
  let server: BroadcastTcpServer;
  const socket = new Socket();
  const data: BroadcastMessageHandlerData = {
    channel: 'test',
  };

  beforeEach(() => {
    server = new BroadcastTcpServer({});
    // Casting to "any" to test private methods
    (server as any).clients = [];
    (server as any).channelsByName = new Map();
  });

  describe('onClientRemovedMessageHandler', () => {
    it('should handle client removing message handler', () => {
      // set up
      (server as any).onClientRemovedMessageHandler(socket, data);
      // assertions here
    });
  });

  describe('onClientDisconnected', () => {
    it('should handle client disconnecting', () => {
      // set up
      (server as any).onClientDisconnected(socket);
      // assertions here
    });
  });

  describe('findClient', () => {
    it('should find client', () => {
      // set up
      const client = (server as any).findClient('clientName');
      // assertions here
    });
  });

  describe('onClientIncomingMessage', () => {
    it('should handle client incoming message', () => {
      // set up
      const message = // set up the message
        (server as any).onClientIncomingMessage(socket, message);
      // assertions here
    });
  });

  describe('onClientError', () => {
    it('should handle client error', () => {
      // set up
      const error = new Error('Test error');
      (server as any).onClientError(socket, error);
      // assertions here
    });
  });

  describe('handleClientMessage', () => {
    it('should handle client message', () => {
      // set up
      const buffer = Buffer.from('Test message');
      (server as any).handleClientMessage(socket, buffer);
      // assertions here
    });
  });
});
