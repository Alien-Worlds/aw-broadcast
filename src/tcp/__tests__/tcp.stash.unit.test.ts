
import { BroadcastTcpMessage } from '../messages/tcp.message';
import { BroadcastTcpStash } from '../tcp.stash';

describe('BroadcastTcpStash', () => {
  let stash: BroadcastTcpStash;
  const message1 = new BroadcastTcpMessage('1', 'sender1', 'channel1', 'type1');
  const message2 = new BroadcastTcpMessage('2', 'sender2', 'channel2', 'type2');
  const message3 = new BroadcastTcpMessage('3', 'sender3', 'channel1', 'type3');

  beforeEach(() => {
    stash = new BroadcastTcpStash();
  });

  describe('add', () => {
    it('should add a message to the stash', () => {
      stash.add(message1);

      expect(stash['messagesByChannel'].size).toBe(1);
      expect(stash['messagesByChannel'].get('channel1')).toEqual([message1]);
    });

    it('should add multiple messages to the stash for the same channel', () => {
      stash.add(message1);
      stash.add(message3);

      expect(stash['messagesByChannel'].size).toBe(1);
      expect(stash['messagesByChannel'].get('channel1')).toEqual([message1, message3]);
    });

    it('should add messages to the stash for different channels', () => {
      stash.add(message1);
      stash.add(message2);

      expect(stash['messagesByChannel'].size).toBe(2);
      expect(stash['messagesByChannel'].get('channel1')).toEqual([message1]);
      expect(stash['messagesByChannel'].get('channel2')).toEqual([message2]);
    });
  });

  describe('pop', () => {
    beforeEach(() => {
      stash.add(message1);
      stash.add(message2);
      stash.add(message3);
    });

    it('should retrieve and remove messages for a specific channel', () => {
      expect(stash.pop('channel1')).toEqual([message1, message3]);
      expect(stash['messagesByChannel'].has('channel1')).toBe(false);
    });

    it('should return an empty array if no messages exist for the channel', () => {
      expect(stash.pop('nonexistent')).toEqual([]);
    });

    it('should return an empty array if channel has no messages after popping', () => {
      stash.pop('channel1');

      expect(stash.pop('channel1')).toEqual([]);
    });
  });
});
