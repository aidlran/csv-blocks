import { createReadStream } from 'fs';
import { join } from 'path';
import { test } from 'vitest';
import { csvb } from './lib.mjs';

test('CSVB', () =>
  new Promise((resolve, reject) => {
    createReadStream(join(__dirname, '../test/people.csvb'))
      .pipe(csvb())
      .on('data', () => {})
      .on('error', reject)
      .on('end', resolve);
  }));
