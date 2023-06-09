import { deserialize, serialize } from 'v8';
import { nanoid } from 'nanoid';
import { BroadcastTcpMessageContent } from '../tcp.message.types';
import { BroadcastTcpMessage } from '../tcp.message';


jest.mock('v8', () => ({
  serialize: jest.fn(data => JSON.stringify(data)),
  deserialize: jest.fn(data => JSON.parse(data.toString())),
}));

jest.mock('nanoid', () => ({
  __esModule: true,
  default: () => 'mockedId',
}));

describe('BroadcastTcpMessage', () => {
  const mockContent: BroadcastTcpMessageContent = {
    id: 'testId',
    sender: 'testSender',
    channel: 'testChannel',
    type: 'testType',
    name: 'testName',
    recipient: 'testRecipient',
    data: 'testData',
  };

  it('should create an instance with static fromBuffer method', () => {
    const buffer = Buffer.from(JSON.stringify(mockContent));
    const message = BroadcastTcpMessage.fromBuffer(buffer);
    expect(message).toBeInstanceOf(BroadcastTcpMessage);
    expect(message.id).toBe(mockContent.id);
    expect(message.sender).toBe(mockContent.sender);
    expect(message.channel).toBe(mockContent.channel);
    expect(message.type).toBe(mockContent.type);
    expect(message.name).toBe(mockContent.name);
    expect(message.recipient).toBe(mockContent.recipient);
    expect(message.data).toBe(mockContent.data);
    expect(message.persistent).toBeTruthy();
  });

  it('should create an instance with static create method', () => {
    const message = BroadcastTcpMessage.create(mockContent);
    expect(message).toBeInstanceOf(BroadcastTcpMessage);
    expect(message.id).toBe(mockContent.id);
    expect(message.sender).toBe(mockContent.sender);
    expect(message.channel).toBe(mockContent.channel);
    expect(message.type).toBe(mockContent.type);
    expect(message.name).toBe(mockContent.name);
    expect(message.recipient).toBe(mockContent.recipient);
    expect(message.data).toBe(mockContent.data);
    expect(message.persistent).toBeTruthy();
  });

  it('should create an instance with static create method and generate id', () => {
    const { id, ...contentWithoutId } = mockContent;
    const message = BroadcastTcpMessage.create(contentWithoutId);
    expect(message).toBeInstanceOf(BroadcastTcpMessage);
    expect(message.id).toBe('mockedId');
  });

  it('should serialize the message to a buffer', () => {
    const message = new BroadcastTcpMessage(
      mockContent.id,
      mockContent.sender,
      mockContent.channel,
      mockContent.type,
      mockContent.name,
      mockContent.recipient,
      mockContent.data,
    );

    const buffer = message.toBuffer();
    const serializedData = JSON.parse(buffer.toString());
    expect(serializedData.sender).toBe(mockContent.sender);
    expect(serializedData.channel).toBe(mockContent.channel);
    expect(serializedData.type).toBe(mockContent.type);
    expect(serializedData.name).toBe(mockContent.name);
    expect(serializedData.recipient).toBe(mockContent.recipient);
    expect(serializedData.data).toBe(mockContent.data);
    expect(serializedData.persistent).toBe(true);
  });
});
