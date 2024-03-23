export class HttpError extends Error {
  public override readonly name: string;
  public readonly code: string;
  public readonly statusCode: number;

  constructor(response: Record<string, any>,
    res: Response,
    code: string = 'ERR_NETWORK_ERROR') {
    super();

    this.name = 'HttpError';
    this.message = response.message ?? response.error ?? response.reason ?? response.cause ?? 'Unknown error';

    /* eslint-disable no-magic-numbers */
    if(!this.message || this.message.trim().length < 1) {
      if(Array.isArray(response.errors) && response.errors.length > 0) {
        this.message = response.errors[0].message ?? 'Unknown error';
      } else {
        this.message = 'Unknown error';
      }
    }
    /* eslint-enable no-magic-numbers */

    this.code = code;
    this.statusCode = res.status;
  }
}


export class InvalidSignatureError extends Error {
  public override readonly name: string = 'InvalidSignatureError';
  public override readonly message: string;
  public readonly expected: string;
  public readonly received: string;

  constructor(message: string, expected: string, actual: string) {
    super(message);

    this.message = message;
    this.expected = expected;
    this.received = actual;
  }
}
