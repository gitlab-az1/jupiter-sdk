import { hasher } from 'cryptx-sdk/hash';

import { HttpHeaders } from './_internal/types';
import { DECIMAL_BASE_NUMBERS, shortId } from './_internal/utils';


// eslint-disable-next-line no-magic-numbers
const FIVE_MINUTES = 5 * 60 * 1000;

export type SignatureVerificationOptions = {
  timestamp?: number;
  timeout?: number;
}

export class Credentials {
  readonly #i: string;
  readonly #apiKey: string;
  readonly #token: string;
  readonly #secret?: Buffer;

  public constructor(
    apiKey: string,
    apiToken: string,
    resourceSecretKey?: string // eslint-disable-line comma-dangle
  ) {
    if(typeof apiKey !== 'string') {
      throw new TypeError('apiKey must be a string');
    }

    if(typeof apiToken !== 'string') {
      throw new TypeError('apiToken must be a string');
    }

    if(!!resourceSecretKey && typeof resourceSecretKey !== 'string') {
      throw new TypeError('resourceSecretKey must be a string');
    }

    this.#i = shortId();
    this.#apiKey = apiKey;
    this.#token = apiToken;
    
    // eslint-disable-next-line no-extra-boolean-cast
    if(!!resourceSecretKey) {
      this.#secret = Buffer.from(resourceSecretKey, 'base64');
    }
  }

  public get apiKey(): string {
    return this.#apiKey;
  }

  public get token(): string {
    return this.#token;
  }

  public get secret(): Buffer | undefined {
    if(!this.#secret) return undefined;
    return Buffer.from(this.#secret);
  }

  public get credentialsInstanceId(): string {
    return this.#i;
  }

  public headers(): HttpHeaders {
    return {
      Connection: 'close',
      Accept: 'application/json, text/plain, application/octet-stream',
      'Accept-Encoding': 'gzip, deflate',
      'X-Jupiter-Api-Key': this.#apiKey,
      'X-Jupiter-Request-TS': Date.now().toString(),
      'X-Jupiter-Credentials-Id': this.#i,
      Authorization: `Bearer ${this.#token}`,
    };
  }

  async #sign(content: string | Buffer | Uint8Array): Promise<string> {
    if(!this.#secret) {
      throw new Error('Cannot sign content without a secret key');
    }

    const ts = Date.now().toString();
    
    if(!Buffer.isBuffer(content)) {
      content = Buffer.from(content);
    }

    const hmac = await hasher.hmac(Buffer.concat([ content, Buffer.from(ts) ]),
      this.#secret, 'sha512', 'hex');

    return `t=${ts},s=${hmac},i=${this.#i}`;
  }

  public sign(content: string | Buffer | Uint8Array): Promise<string> {
    return this.#sign(content);
  }

  async #verify(
    content: string | Buffer | Uint8Array,
    sign: string,
    options?: SignatureVerificationOptions // eslint-disable-line comma-dangle
  ): Promise<boolean> {
    if(!this.#secret) {
      throw new Error('Cannot verify content without a secret key');
    }

    const parts = sign.split(',');
    if(parts.length !== DECIMAL_BASE_NUMBERS.Three) return false;

    if(!parts[DECIMAL_BASE_NUMBERS.Zero].startsWith('t=')) return false;
    if(!parts[DECIMAL_BASE_NUMBERS.One].startsWith('s=')) return false;
    if(!parts[DECIMAL_BASE_NUMBERS.Two].startsWith('i=')) return false;

    const [ t, s, i ] = parts.map(p => p.slice(DECIMAL_BASE_NUMBERS.Two));

    if(!/\d/.test(t)) return false;
    if(!/[0-9a-f]+/.test(s)) return false;
    if(!/^[a-f0-9]{8}$/.test(i)) return false;
    
    const ts = options?.timestamp ?? Date.now();
    const timeout = options?.timeout ?? FIVE_MINUTES;

    const difference = Math.abs(ts - Number(t));
    if(difference > timeout) return false;

    if(!Buffer.isBuffer(content)) {
      content = Buffer.from(content);
    }

    const hmac = await hasher.hmac(Buffer.concat([ content, Buffer.from(t) ]),
      this.#secret, 'sha512', 'hex');

    return hmac === s;
  }

  public verify(
    content: string | Buffer | Uint8Array,
    sign: string,
    options?: SignatureVerificationOptions // eslint-disable-line comma-dangle
  ): Promise<boolean> {
    return this.#verify(content, sign, options);
  }
}

export default Credentials;
