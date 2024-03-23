import { AES, SymmetricKey } from 'cryptx-sdk/symmetric';
import { type Decrypted } from 'cryptx-sdk/symmetric/core';


export function aesEncrypt(key: Uint8Array, data: any): Promise<Uint8Array>;
export function aesEncrypt(key: Uint8Array, data: any, encoding: BufferEncoding): Promise<string>;
export async function aesEncrypt(key: Uint8Array, data: any, encoding?: BufferEncoding): Promise<string | Uint8Array> {
  const k = new SymmetricKey(key, {
    algorithm: 'aes-256-cbc',
    usages: ['encrypt', 'decrypt', 'sign', 'verify'],
  });

  const aes = new AES(k, 'aes-256-cbc');
  const e = await aes.encrypt(data);

  if(!encoding) return e.buffer;
  return e.toString(encoding);
}

export async function aesDecrypt<T = any>(key: Uint8Array, data: string | Buffer | Uint8Array): Promise<Decrypted<T>> {
  const k = new SymmetricKey(key, {
    algorithm: 'aes-256-cbc',
    usages: ['encrypt', 'decrypt', 'sign', 'verify'],
  });

  const aes = new AES(k, 'aes-256-cbc');
  return aes.decrypt(data instanceof Buffer ? data : Buffer.from(data));
}
