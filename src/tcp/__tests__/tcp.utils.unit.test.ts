
import { Socket } from 'net';
import {
  getTcpConnectionOptions,
  writeSocketBuffer,
  splitToMessageBuffers,
  getClientAddress,
} from '../tcp.utils';
import { BroadcastConnectionConfig } from '../../types';
import { BroadcastTcpMessage } from '../messages/tcp.message';

describe('getTcpConnectionOptions', () => {
  it('should return the TCP connection options with URL', () => {
    const config: BroadcastConnectionConfig = {
      url: '/path/to/socket',
      host: 'localhost',
      port: 1234,
    };

    const options = getTcpConnectionOptions(config);

    expect(options).toEqual({ path: '/path/to/socket' });
  });

  it('should return the TCP connection options with host and port', () => {
    const config: BroadcastConnectionConfig = {
      host: 'localhost',
      port: 1234,
    };

    const options = getTcpConnectionOptions(config);

    expect(options).toEqual({ host: 'localhost', port: 1234 });
  });

  it('should throw an error for wrong TCP connection options', () => {
    const config: BroadcastConnectionConfig = {};

    expect(() => {
      getTcpConnectionOptions(config);
    }).toThrowError('Wrong TCP connection options');
  });
});

describe('writeSocketBuffer', () => {
  it('should write the broadcast TCP message to a buffer with a header', () => {
    const message = new BroadcastTcpMessage('1', 'sender', 'channel', 'type');
    const buffer = writeSocketBuffer(message);

    // Expected buffer structure: [size (4 bytes), message content]
    const size = buffer.readUInt32BE(0);
    const content = buffer.slice(4);

    expect(size).toBe(content.length);
    expect(content).toEqual(message.toBuffer());
  });
});

describe('splitToMessageBuffers', () => {
  it('should split a buffer into multiple message buffers', () => {
    const message1 = Buffer.alloc(4 + 9);
    const message2 = Buffer.alloc(4 + 9);
    const message3 = Buffer.alloc(4 + 9);

    message1.writeUInt32BE(9, 0);
    message2.writeUInt32BE(9, 0);
    message3.writeUInt32BE(9, 0);

    const buffer = Buffer.concat([message1, message2, message3]);
    const messageBuffers = splitToMessageBuffers(buffer);

    expect(messageBuffers).toEqual([
      message1.slice(4),
      message2.slice(4),
      message3.slice(4),
    ]);
  });


  it('should handle splitting when buffer contains partial messages', () => {
    const message1 = Buffer.from('Message 1');
    const message2 = Buffer.from('Message 2');

    const buffer = Buffer.concat([message1.slice(0, 6), message2.slice(0, 6)]);
    const messageBuffers = splitToMessageBuffers(buffer);

    expect(messageBuffers).toEqual([]);
  });

  it.skip('should handle splitting when buffer contains complete and partial messages', () => {
    const message1 = Buffer.from('Message 1');
    const message2 = Buffer.from('Message 2');
    const message3 = Buffer.from('Message 3');

    const headerSize = 4;
    const header = Buffer.alloc(headerSize);
    header.writeUInt32BE(message2.length);

    const buffer = Buffer.concat([
      message1,
      Buffer.concat([header, message2.slice(0, 6)]),
      message3,
    ]);
    const messageBuffers = splitToMessageBuffers(buffer);

    expect(messageBuffers).toEqual([message1, message2, message3]);
  });
});

describe('getClientAddress', () => {
  it('should return the remote address when local is false', () => {
    const socket = {
      remoteAddress: '192.168.0.1',
      remotePort: 1234,
      localAddress: '127.0.0.1',
      localPort: 5678,
    } as any;

    const address = getClientAddress(socket, false);

    expect(address).toBe('192.168.0.1:1234');
  });

  it('should return the local address when local is true', () => {
    const socket = {
      remoteAddress: '192.168.0.1',
      remotePort: 1234,
      localAddress: '127.0.0.1',
      localPort: 5678,
    } as any;

    const address = getClientAddress(socket, true);

    expect(address).toBe('127.0.0.1:5678');
  });
});
