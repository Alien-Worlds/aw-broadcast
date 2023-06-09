import { BroadcastTcpClientCast } from '../tcp.client-cast';
import { BroadcastTcpMessage } from '../messages/tcp.message';
import { BroadcastTcpChannel } from '../tcp.channel';
import { getClientAddress } from '../tcp.utils';
import { Socket } from 'net';

jest.mock('net');

jest.mock('../tcp.utils');

describe('BroadcastTcpChannel', () => {
  const mockName = 'testChannel';
  let channel;
  let socket: jest.Mocked<Socket>;

  beforeEach(() => {
    socket = new Socket() as jest.Mocked<Socket>;
    channel = new BroadcastTcpChannel(mockName);
  });

  it('should create a new BroadcastTcpChannel', () => {
    expect(channel).toBeInstanceOf(BroadcastTcpChannel);
    expect(channel.name).toBe(mockName);
    expect(channel.clients).toEqual([]);
  });

  it('should add a client', () => {
    const mockClient = new BroadcastTcpClientCast(socket, null);
    channel.addClient(mockClient);
    expect(channel.clients).toContain(mockClient);
  });

  it('should not add a client if it already exists', () => {
    const mockClient = new BroadcastTcpClientCast(socket, null);
    channel.addClient(mockClient);
    channel.addClient(mockClient);
    expect(channel.clients.length).toBe(1);
  });

  it('should remove a client', () => {
    (getClientAddress as jest.Mock).mockReturnValue('test');
    const mockClient = new BroadcastTcpClientCast(socket, null);
    channel.addClient(mockClient);
    channel.removeClient('test');
    expect(channel.clients.length).toBe(0);
  });

  it('should send a message to all clients except those in the exclude array', () => {
    const mockClient1 = new BroadcastTcpClientCast(
      socket,
      null
    ) as jest.Mocked<BroadcastTcpClientCast>;
    (mockClient1 as any)._address = 'test1';

    const mockClient2 = new BroadcastTcpClientCast(
      socket,
      null
    ) as jest.Mocked<BroadcastTcpClientCast>;
    (mockClient2 as any)._address = 'test2';

    const mockClient1SendSpy = jest.spyOn(mockClient1, 'send');
    const mockClient2SendSpy = jest.spyOn(mockClient2, 'send');

    const mockMessage = new BroadcastTcpMessage('id', 'sender', 'channel', 'type');
    channel.addClient(mockClient1);
    channel.addClient(mockClient2);
    channel.sendMessage(mockMessage, ['test1']);
    expect(mockClient1SendSpy).not.toHaveBeenCalled();
    expect(mockClient2SendSpy).toHaveBeenCalled();
  });
});
