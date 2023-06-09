import { nanoid } from 'nanoid';
import { BroadcastTcpSystemMessage } from '../tcp.system.message';
import { BroadcastTcpMessageName, BroadcastTcpMessageType } from '../tcp.message.enums';
import { BroadcastTcpMessage } from '../tcp.message';

jest.mock('nanoid', () => ({
  __esModule: true,
  default: () => 'mockedId',
}));

describe('BroadcastTcpSystemMessage', () => {
  const mockSender = 'testSender';
  const mockChannels = ['channel1', 'channel2'];
  const mockName = 'testName';

  it('should create a ClientConnected system message', () => {
    const message = BroadcastTcpSystemMessage.createClientConnected(
      mockName,
      mockSender,
      mockChannels
    );
    expect(message).toBeInstanceOf(BroadcastTcpSystemMessage);
    expect(message.id).toBe('mockedId');
    expect(message.sender).toBe(mockSender);
    expect(message.type).toBe(BroadcastTcpMessageType.System);
    expect(message.name).toBe(BroadcastTcpMessageName.ClientConnected);
    expect(message.data).toEqual({ name: mockName, channels: mockChannels });
  });

  it('should create a ClientDisconnected system message', () => {
    const message = BroadcastTcpSystemMessage.createClientDisconnected(
      mockName,
      mockSender
    );
    expect(message).toBeInstanceOf(BroadcastTcpSystemMessage);
    expect(message.id).toBe('mockedId');
    expect(message.sender).toBe(mockSender);
    expect(message.type).toBe(BroadcastTcpMessageType.System);
    expect(message.name).toBe(BroadcastTcpMessageName.ClientDisconnected);
    expect(message.data).toEqual({ name: mockName });
  });

  it('should create a MessageNotDelivered system message', () => {
    const broadcastMessage = new BroadcastTcpMessage(
      'broadcastId',
      'broadcastSender',
      'broadcastChannel',
      'broadcastType'
    );
    const message = BroadcastTcpSystemMessage.createMessageNotDelivered(broadcastMessage);
    expect(message).toBeInstanceOf(BroadcastTcpSystemMessage);
    expect(message.id).toBe('mockedId');
    expect(message.type).toBe(BroadcastTcpMessageType.System);
    expect(message.name).toBe(BroadcastTcpMessageName.MessageNotDelivered);
    expect(message.recipient).toBe(broadcastMessage.sender);
    expect(message.data).toBe(broadcastMessage);
  });

  it('should create a ClientAddedMessageHandler system message', () => {
    const mockChannel = 'testChannel';
    const message = BroadcastTcpSystemMessage.createClientAddedMessageHandler(
      mockChannel,
      mockSender
    );
    expect(message).toBeInstanceOf(BroadcastTcpSystemMessage);
    expect(message.id).toBe('mockedId');
    expect(message.sender).toBe(mockSender);
    expect(message.type).toBe(BroadcastTcpMessageType.System);
    expect(message.name).toBe(BroadcastTcpMessageName.ClientAddedMessageHandler);
    expect(message.data).toEqual({ channel: mockChannel });
  });

  it('should create a ClientRemovedMessageHandler system message', () => {
    const mockChannel = 'testChannel';
    const message = BroadcastTcpSystemMessage.createClientRemovedMessageHandler(
      mockChannel,
      mockSender
    );
    expect(message).toBeInstanceOf(BroadcastTcpSystemMessage);
    expect(message.id).toBe('mockedId');
    expect(message.sender).toBe(mockSender);
    expect(message.type).toBe(BroadcastTcpMessageType.System);
    expect(message.name).toBe(BroadcastTcpMessageName.ClientRemovedMessageHandler);
    expect(message.data).toEqual({ channel: mockChannel });
  });
});
