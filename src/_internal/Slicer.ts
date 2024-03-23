import math from 'next-math';
import { hasher } from 'cryptx-sdk/hash';

import { InvalidSignatureError } from './errors';


export type Chunk = {
  readonly index: number;
  readonly value: string;
  readonly hash: string;
}

export class Slicer { /* eslint-disable no-magic-numbers */
  #originalSHA512?: string;
  readonly #chunkSize: number;
  readonly #original: string;
  #chunks: Chunk[];

  public static async join(chunks: Chunk[], originalChecksum?: string): Promise<string> {
    const parts: string[] = [];
    const max = math.max(...[...chunks].map(chunk => chunk.index));
    
    for(let i = 0; i <= max; i++) {
      const chunk = chunks.find(chunk => chunk.index === i);
      if(!chunk) continue;
      
      const hash = await hasher.hash(chunk.value, 'sha512', 'hex');

      if(hash !== chunk.hash) {
        throw new InvalidSignatureError('Failed to verify the integrity of the chunk.', chunk.hash, hash);
      }

      parts.push(chunk.value);
    }

    const original = parts.join('');
    if(!originalChecksum) return original;

    const originalHash = await hasher.hash(original, 'sha512', 'hex');

    if(originalHash !== originalChecksum) {
      throw new InvalidSignatureError('Failed to verify the integrity of the original string.', originalChecksum, originalHash);
    }

    return original;
  }

  public constructor(value: string, chunkSize: number = 96) {
    if(typeof value !== 'string') {
      throw new TypeError('You can only slice strings.');
    }

    if(typeof chunkSize !== 'number') {
      throw new TypeError('Chunk size must be a number.');
    }

    if(chunkSize < 2) {
      throw new TypeError('Chunk size must be at least 2.');
    }

    this.#chunkSize = chunkSize;
    this.#original = value;
    this.#chunks = [];
  }

  public async slice(): Promise<void> {
    if(this.#chunks.length > 0) {
      throw new Error('You can only slice the string once.');
    }

    this.#originalSHA512 = await hasher.hash(this.#original, 'sha512', 'hex');

    for(let i = 0; i < this.#original.length; i += this.#chunkSize) {
      const chunk = this.#original.slice(i, i + this.#chunkSize);
      const hash = await hasher.hash(chunk, 'sha512', 'hex');

      this.#chunks.push({
        index: i,
        value: chunk,
        hash,
      });
    }
  }

  public async createMerkleTree(): Promise<string[]> {
    if(this.#chunks.length < 1) {
      throw new Error('You must slice the string first.');
    }

    const hashes = await Promise.all(
      this.#chunks.map((chunk) => hasher.hash(chunk.value, 'sha512', 'hex')) // eslint-disable-line comma-dangle
    );

    while(hashes.length > 1) {
      const levelHashes: string[] = [];
  
      for(let i = 0; i < hashes.length; i += 2) {
        const leftHash = hashes[i];
        const rightHash = i + 1 < hashes.length ? hashes[i + 1] : '';
  
        const combinedHash = await hasher.hash(leftHash + rightHash, 'sha512', 'hex');
        levelHashes.push(combinedHash);
      }
  
      hashes.length = 0; // Clear the current hashes
      hashes.push(...levelHashes);
    }

    return hashes;
  }

  public get hash(): string {
    if(!this.#originalSHA512) {
      throw new Error('You must slice the string first.');
    }

    return this.#originalSHA512;
  }

  public get chunks(): Chunk[] {
    return [ ...this.#chunks ];
  }

  public get chunkSize(): number {
    return this.#chunkSize;
  }
} /* eslint-enable no-magic-numbers */

export default Slicer;
