# CSV Blocks (CSVB)

A superset of CSV designed as a simple, intuitive, human-editable intermediate format for data imports.

CSVB is like CSV but with additional features:

- Forgiving and convenient syntax.
- Comments.
- Strict typing of columns.
- Blocks of rows.
- Default values for blank cells in blocks.

## Format Specification

See [docs/specification.md](docs/specification.md)

## Usage

### Library

`csv-blocks` uses [`csv-parse`](https://www.npmjs.com/package/csv-parse) as a base and exposes a similar stream API.

```js
import { csvb } from 'csv-blocks';
import { createReadStream } from 'fs';

const stream = createReadStream('my-file.csvb')
  // Create a new instance per CSVB file parsed
  .pipe(csvb())
  // Each "chunk" is a row parsed into an object
  .on('data', (record) => console.log(record));
  .on('error', (e) => console.error(e))
```

### CLI

A CLI is included as `csv-blocks` and aliased as `csvb` for convenience.

```sh
# Check format and print records to console in a table
npx csv-blocks my-file.csvb

# Only parse and throw any errors
npx csv-blocks --no-print my-file.csvb

# Provide a second argument to output records to a file as JSON
npx csv-blocks --no-print my-file.csvb my-file.json

# Get full help and options
npx csv-blocks --help
```
