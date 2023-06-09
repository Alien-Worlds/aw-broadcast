import { Socket } from 'net';
import { BroadcastTcpMessage } from '../messages/tcp.message';
import { BroadcastTcpClientCast } from '../tcp.client-cast';
import { getClientAddress, writeSocketBuffer } from '../tcp.utils';

jest.mock('net');
jest.mock('../tcp.utils');

describe('BroadcastTcpClientCast', () => {
  const mockSocket = new Socket();
  const mockName = 'testClient';
  let client;

  beforeEach(() => {
    client = new BroadcastTcpClientCast(mockSocket, mockName);
  });

  it('should create a new BroadcastTcpClientCast', () => {
    expect(client).toBeInstanceOf(BroadcastTcpClientCast);
    expect(client.name).toBe(mockName);
  });

  it('should return the address', () => {
    const mockAddress = 'mockAddress';
    (getClientAddress as jest.Mock).mockReturnValue(mockAddress);
    client = new BroadcastTcpClientCast(mockSocket, mockName);
    expect(client.address).toBe(mockAddress);
  });

  it('should add a channel', () => {
    const mockChannel = 'mockChannel';
    client.addChannel(mockChannel);
    expect(client.channels.has(mockChannel)).toBe(true);
  });

  it('should remove a channel', () => {
    const mockChannel = 'mockChannel';
    client.addChannel(mockChannel);
    client.removeChannel(mockChannel);
    expect(client.channels.has(mockChannel)).toBe(false);
  });

  it('should send a message', () => {
    const mockMessage = new BroadcastTcpMessage('id', 'sender', 'channel', 'type');
    const mockBuffer = Buffer.from('mockBuffer');
    (writeSocketBuffer as jest.Mock).mockReturnValue(mockBuffer);
    client.send(mockMessage);
    expect(mockSocket.write).toHaveBeenCalledWith(mockBuffer);
  });
});
