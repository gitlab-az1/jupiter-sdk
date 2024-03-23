import { DECIMAL_BASE_NUMBERS } from './_internal/utils';
import { jsonSafeParser, jsonSafeStringify } from './_internal/safe-json';


/**
 * EncoderDecoder is to allow the user to use different encodings, like json, msgpack etc.
 */
export interface EncoderDecoder {
  encode<T = unknown>(data: T): string;
  encode<T = unknown>(data: T, lint: boolean): string;
  decode<T = unknown>(s: string): T;
}


export class Json implements EncoderDecoder {
  private _useDebugMode: boolean = false;

  public constructor(options?: { debug?: boolean }) {
    if(!!options && typeof options.debug === 'boolean') {
      this._useDebugMode = options.debug;
    }
  }

  public encode<T = unknown>(data: T, lint: boolean = false): string {
    if(this._useDebugMode === true) {
      console.debug('Encoding data:', data);
    }

    return (
      lint === true ?
        jsonSafeStringify(data, null, DECIMAL_BASE_NUMBERS.Two) || '[null]'
        : jsonSafeStringify(data) || '[null]'
    );
  }

  public decode<T = unknown>(s: string): T {
    if(this._useDebugMode === true) {
      console.debug('Decoding data:', s);
    }

    const parsed = jsonSafeParser(s);

    if(parsed.isLeft()) {
      throw parsed.value;
    }

    return parsed.value as T;
  }
}
