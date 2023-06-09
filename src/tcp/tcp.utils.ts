import { Socket } from 'net';
import { BroadcastConnectionConfig } from '../types';
import { BroadcastTcpMessage } from './messages/tcp.message';

/**
 * Retrieves the TCP connection options based on the provided configuration.
 * It supports both URL and separate host/port configurations.
 *
 * @param {BroadcastConnectionConfig} config - The configuration object for the TCP connection.
 * @returns {Object} The TCP connection options.
 * @throws {Error} If the TCP connection options are invalid or incomplete.
 */
export const getTcpConnectionOptions = (config: BroadcastConnectionConfig) => {
  const { url, host, port } = config;

  if (url) {
    return { path: url };
  } else if (host || port) {
    return { host, port };
  } else {
    throw new Error('Wrong TCP connection options');
  }
};

const HEADER_SIZE = 4;

/**
 * Writes the given broadcast TCP message to a buffer, prepending it with a header containing the
 * message size.
 *
 * @param {BroadcastTcpMessage} message - The broadcast TCP message to be written to the buffer.
 * @returns {Buffer} The buffer containing the message with the header.
 */
export const writeSocketBuffer = (message: BroadcastTcpMessage): Buffer => {
  const buffer = message.toBuffer();
  const size = Buffer.alloc(HEADER_SIZE);
  size.writeUInt32BE(buffer.length);
  return Buffer.concat([size, buffer]);
};

/**
 * Splits a buffer into multiple message buffers based on the embedded message size headers.
 * Each message buffer represents a complete message.
 *
 * @param {Buffer} buffer - The buffer containing the concatenated message buffers.
 * @returns {Buffer[]} An array of message buffers.
 */
export const splitToMessageBuffers = (buffer: Buffer): Buffer[] => {
  const buffers: Buffer[] = [];
  let offset = 0;
  let remainingBytes = null;

  while (offset < buffer.length) {
    if (remainingBytes === null) {
      // Need to read the size of the next message
      if (offset + 4 <= buffer.length) {
        // We have enough bytes to read the size
        remainingBytes = buffer.readUInt32BE(offset);
        offset += 4;
      } else {
        // Not enough bytes yet, wait for the next data chunk
        break;
      }
    } else {
      // Reading the payload of a message
      if (offset + remainingBytes <= buffer.length) {
        // We have enough bytes to read the entire message
        const messageBuffer = buffer.subarray(offset, offset + remainingBytes);
        buffers.push(messageBuffer);
        remainingBytes = null;
        offset += messageBuffer.length;
      } else {
        // Not enough bytes yet, wait for the next data chunk
        break;
      }
    }
  }

  return buffers;
};

/**
 * Retrieves the client address from the provided socket based on whether it's the local or remote address.
 *
 * @param {Socket} socket - The socket object representing the client connection.
 * @param {boolean} local - Indicates whether to retrieve the local or remote address.
 * @returns {string} The client address.
 */
export const getClientAddress = (
  { remoteAddress, remotePort, localAddress, localPort }: Socket,
  local: boolean
) => (local ? `${localAddress}:${localPort}` : `${remoteAddress}:${remotePort}`);
