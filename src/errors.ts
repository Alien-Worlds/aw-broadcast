import { BroadcastErrorType } from './enums';
/**
 * `BroadcastError` is a custom error class for handling errors specific to the broadcast system.
 * It extends the built-in `Error` class in JavaScript and adds a `type` property that represents the type of the broadcast error.
 */
export class BroadcastError extends Error {
  /**
   * Constructs a new `BroadcastError`.
   *
   * @param type The type of the error, represented by a `BroadcastErrorType` value.
   * @param message An optional string that describes the error. This is stored on the error object itself.
   */
  constructor(public type: BroadcastErrorType, message?: string) {
    super(message);
  }
}

/**
 * `BroadcastSendError` is a custom error class for handling errors that occur while sending messages in the broadcast system.
 * It extends `BroadcastError` and sets the error type to `BroadcastErrorType.SendError` by default.
 */
export class BroadcastSendError extends BroadcastError {
  /**
   * Constructs a new `BroadcastSendError`.
   *
   * @param reason An optional `Error` object that caused the `BroadcastSendError`. Its message is appended to the error message
   * of the `BroadcastSendError`.
   */
  constructor(private reason?: Error) {
    super(
      BroadcastErrorType.SendError,
      `An error occurred while sending a message. ${reason ? reason.message : ''}`
    );
  }
}
