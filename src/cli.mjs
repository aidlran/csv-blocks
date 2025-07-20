#!/usr/bin/env node

import { Command } from 'commander';
import { createReadStream, statSync, writeFileSync } from 'fs';
import pkg from '../package.json' with { type: 'json' };
import { csvb } from './lib.mjs';

const program = new Command(pkg.name)
  .description(pkg.description)
  .version(pkg.version, '-v, --version')
  .description('Parses a CSV blocks formatted file, checks for errors, and outputs records.')
  .argument('<input>', "Path to input file. Pass '-' to use stdin.")
  .argument('[output]', "Path to output file. Pass '-' to use stdout.")
  .option('--no-print', "Don't print the table.")
  .action((input, output, { print }) => {
    /** @type {import('stream').Stream} */
    let inputStream;

    if (input === '-') {
      if (process.stdin.isTTY) {
        program.error('stdin provided no input');
      }
      inputStream = process.stdin;
    } else {
      try {
        const stat = statSync(input);
        if (!stat.isFile()) {
          program.error(`Not a file: '${input}'`);
        }
        inputStream = createReadStream(input);
      } catch (e) {
        // @ts-ignore
        if (e instanceof Error && e?.code === 'ENOENT') {
          program.error(e.message);
        }
        throw e;
      }
    }

    /** @type {object[]} */
    const records = [];

    const stream = inputStream
      .pipe(csvb())
      .on('error', (e) => program.error(e.message))
      .on('data', (record) => records.push(record));

    if (print) {
      stream.on('end', () => console.table(records));
    }

    if (typeof output === 'string') {
      stream.on('end', () => {
        const json = JSON.stringify(records, null, 2);
        if (output === '-') {
          process.stdout.write(json);
        } else {
          writeFileSync(output, json);
        }
      });
    }
  });

program.parse();
