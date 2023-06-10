import { BroadcastMessage } from '../broadcast.message';

describe('BroadcastMessage', () => {
  let data;
  beforeEach(() => {
    data = { key: 'value' };
  });

  test('should create a channel message correctly', () => {
    const message = BroadcastMessage.createChannelMessage('channel1', data, 'name');
    expect(message.channel).toBe('channel1');
    expect(message.data).toEqual(data);
    expect(message.name).toBe('name');
    expect(message.client).toBe(null);
    expect(message.persistent).toBe(true);
  });

  test('should create a client message correctly', () => {
    const message = BroadcastMessage.createClientMessage('client1', data, 'name');
    expect(message.client).toBe('client1');
    expect(message.data).toEqual(data);
    expect(message.name).toBe('name');
    expect(message.channel).toBe(null);
    expect(message.persistent).toBe(true);
  });

  test('should create multi-channel messages correctly', () => {
    const messages = BroadcastMessage.createMultiChannelMessage(
      ['channel1', 'channel2'],
      data,
      'name'
    );
    expect(messages).toHaveLength(2);
    messages.forEach(message => {
      expect(['channel1', 'channel2']).toContain(message.channel);
      expect(message.data).toEqual(data);
      expect(message.name).toBe('name');
      expect(message.client).toBe(null);
      expect(message.persistent).toBe(true);
    });
  });

  test('should create group messages correctly', () => {
    const messages = BroadcastMessage.createGroupMessage(
      ['client1', 'client2'],
      data,
      'name'
    );
    expect(messages).toHaveLength(2);
    messages.forEach(message => {
      expect(['client1', 'client2']).toContain(message.client);
      expect(message.data).toEqual(data);
      expect(message.name).toBe('name');
      expect(message.channel).toBe(null);
      expect(message.persistent).toBe(true);
    });
  });

  test('should create a client-channel message correctly', () => {
    const message = BroadcastMessage.create('client1', 'channel1', data, 'name');
    expect(message.client).toBe('client1');
    expect(message.channel).toBe('channel1');
    expect(message.data).toEqual(data);
    expect(message.name).toBe('name');
    expect(message.persistent).toBe(true);
  });
});
