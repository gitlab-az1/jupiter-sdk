import XBuffer from 'cryptx-sdk/buffer';
import { delay } from 'not-synchronous/core';

import Credentials from '../Credentials';
import { HttpError } from '../_internal/errors';
import { EncoderDecoder, Json } from '../encoder';
import type  { HttpHeaders, HttpMethod, MaybeArray } from '../_internal/types';
import { APP_VERSION, DECIMAL_BASE_NUMBERS, isPlainObject } from '../_internal/utils';



export type Jsonable = Record<string | number, any> | any[] | string;

export type ServerlessBrokerRequestInit<T extends Jsonable> = {
  method: HttpMethod;
  path: MaybeArray<string>;
  body?: T;
  headers?: HttpHeaders,
  retries?: number;
  timeout?: number;
};


export type HttpClientProps = {
  baseUrl: string;
  credentials: Credentials;
  defaultHeaders?: HttpHeaders;
  defaultTimeout?: number;
};


const A_QUARTER_OF_SECOND = 250;

export class HttpClient {
  readonly #bodyEncoder: EncoderDecoder = new Json();
  readonly #credentials: Credentials;

  private readonly _baseUrl: string;
  private readonly _defaultHeaders: HttpHeaders;
  private readonly _defaultTimeout?: number;

  public constructor(props: HttpClientProps) {
    if(!props.baseUrl) {
      throw new Error('baseUrl is required');
    }

    new URL(props.baseUrl);
    this._baseUrl = props.baseUrl.replace(/\/$/, '');

    this._defaultHeaders = (!!props.defaultHeaders &&
        typeof props.defaultHeaders === 'object' &&
        isPlainObject(props.defaultHeaders)) ?
      props.defaultHeaders :
      {};

    this._defaultTimeout = (!!props.defaultTimeout &&
        typeof props.defaultTimeout === 'number' &&
        props.defaultTimeout > DECIMAL_BASE_NUMBERS.Zero) ?
      props.defaultTimeout :
      undefined;

    if(!(props.credentials instanceof Credentials)) {
      throw new Error('credentials must be an instance of Credentials');
    }

    this.#credentials = props.credentials;
  }

  public get credentials(): Credentials {
    return this.#credentials;
  }

  #ua(): string {
    return `JupiterSDK/${APP_VERSION} (Node ${process.version}; ${process.arch})`;
  }

  // eslint-disable-next-line complexity
  async #request<Res extends Jsonable = any, T extends Jsonable = never>(init: ServerlessBrokerRequestInit<T>): Promise<Res> {
    const pathname = (Array.isArray(init.path) ? init.path : [init.path])
      .map(p => p.replace(/^\//, '')).join('/');

    const u = new URL(
      pathname.charAt(DECIMAL_BASE_NUMBERS.Zero) === '/' ?
        pathname :
        `/${pathname}`,
      this._baseUrl);

    const headers = new Headers(this._defaultHeaders as Record<string, string> | undefined);

    for(const [name, value] of Object.entries(this.#credentials.headers())) {
      if(!value) continue;
      headers.set(name, value);
    }

    // eslint-disable-next-line no-extra-boolean-cast
    if(!!init.headers) {
      for(const prop in init.headers) {
        if(!Object.prototype.hasOwnProperty.call(init.headers, prop)) continue;
        headers.set(prop, init.headers[prop] as string);
      }
    }

    // eslint-disable-next-line no-extra-boolean-cast
    if(!!init.body) {
      headers.set('Content-Length', XBuffer.fromString(this.#bodyEncoder.encode(init.body)).byteLength.toString());         
    }

    headers.set('User-Agent', this.#ua());
    headers.set('Content-Type', 'application/json; charset=UTF-8');
    let err = new Error();

    for(let attempt = 0; attempt <= (init.retries ?? DECIMAL_BASE_NUMBERS.Three); attempt++) {
      // eslint-disable-next-line no-magic-numbers
      if(attempt > 0) {
        await delay(DECIMAL_BASE_NUMBERS.Two ** attempt * A_QUARTER_OF_SECOND);
      }

      const ac = new AbortController();
      const timeout = init.timeout ?? this._defaultTimeout;

      try {
        const res = await (
          timeout && timeout > DECIMAL_BASE_NUMBERS.Zero ? Promise.race<Response>([
            fetch(u, {
              headers,
              redirect: 'follow',
              signal: ac.signal,
              method: init.method,
              body: init.body ? this.#bodyEncoder.encode(init.body) : undefined,
            }),
            new Promise((_, reject) => {
              setTimeout(() => {
                ac.abort();
                reject({ message: 'Request timeout', code: 'ERR_REQUEST_TIMEOUT' });
              }, timeout);
            }),
          ]) : fetch(u, {
            headers,
            redirect: 'follow',
            method: init.method,
            body: init.body ? this.#bodyEncoder.encode(init.body) : undefined,
          })
        );

        const output = await res.json();
        // eslint-disable-next-line no-magic-numbers
        const ok = 2 === ((res.status / 100) | 0);

        // eslint-disable-next-line no-magic-numbers
        if(!ok && ![0].includes(res.status)) { // include in the array the status code you want to ignore
          throw new HttpError(output, res);
        }

        return output as Res;
      } catch (e: any) {
        if(!!e.code && e.code === 'ERR_REQUEST_TIMEOUT') {
          throw e;
        }

        err = e instanceof Error ? e : new Error(e);
      }
    }

    throw err;
  }

  public get<T extends Jsonable = any>(path: MaybeArray<string>, init?: Omit<ServerlessBrokerRequestInit<never>, 'method' | 'body' | 'path'>): Promise<T> {
    return this.#request<T>({
      path,
      method: 'GET',
      headers: init?.headers,
      retries: init?.retries,
      timeout: init?.timeout,
    });
  }

  public post<T extends Jsonable = any, B extends Jsonable = any>(path: MaybeArray<string>, body?: B, init?: Omit<ServerlessBrokerRequestInit<B>, 'method' | 'body' | 'path'>): Promise<T> {
    return this.#request<T, B>({
      path,
      body,
      method: 'POST',
      headers: init?.headers,
      retries: init?.retries,
      timeout: init?.timeout,
    });
  }

  public put<T extends Jsonable = any, B extends Jsonable = any>(path: MaybeArray<string>, body?: B, init?: Omit<ServerlessBrokerRequestInit<B>, 'method' | 'body' | 'path'>): Promise<T> {
    return this.#request<T, B>({
      path,
      body,
      method: 'PUT',
      headers: init?.headers,
      retries: init?.retries,
      timeout: init?.timeout,
    });
  }

  public patch<T extends Jsonable = any, B extends Jsonable = any>(path: MaybeArray<string>, body?: B, init?: Omit<ServerlessBrokerRequestInit<B>, 'method' | 'body' | 'path'>): Promise<T> {
    return this.#request<T, B>({
      path,
      body,
      method: 'PATCH',
      headers: init?.headers,
      retries: init?.retries,
      timeout: init?.timeout,
    });
  }

  public delete<T extends Jsonable = any>(path: MaybeArray<string>, init?: Omit<ServerlessBrokerRequestInit<never>, 'method' | 'body' | 'path'>): Promise<T> {
    return this.#request<T>({
      path,
      method: 'DELETE',
      headers: init?.headers,
      retries: init?.retries,
      timeout: init?.timeout,
    });
  }
}

export default HttpClient;
