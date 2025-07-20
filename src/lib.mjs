import { parse } from 'csv-parse';
import duplexify from 'duplexify';
import { Transform } from 'stream';

/** @typedef {'b' | 'd' | 'n' | 's'} ColType */

/**
 * @typedef Context
 * @property {number} block
 * @property {number | 'defaults' | 'header'} row
 * @property {string} column
 */

/**
 * @param {string} error
 * @param {Context} context
 * @returns {Error}
 */
const contextError = (error, { block, row, column }) =>
  Error(
    `${error}. At${block ? ` block ${block},` : ''} ${typeof row === 'number' ? `row ${row}` : row}${column ? `, column '${column}'` : ''}.`,
  );

/**
 * @param {string} value
 * @param {Context} context
 * @returns {boolean}
 */
function parseBool(value, context) {
  switch (value.toLowerCase()) {
    case 'true':
    case 't':
    case 'yes':
    case 'y':
    case '1':
      return true;

    case 'false':
    case 'f':
    case 'no':
    case 'n':
    case '0':
      return false;

    default:
      throw contextError(`Unexpected bool value '${value}'`, context);
  }
}

/**
 * @param {string} type
 * @param {Context} context
 * @returns {ColType}
 */
function parseType(type, context) {
  switch (type) {
    case 'boolean':
    case 'bool':
    case 'b':
      return 'b';

    case 'date':
    case 'd':
      return 'd';

    case 'number':
    case 'num':
    case 'int':
    case 'n':
      return 'n';

    case undefined:
    case 'str':
    case 'string':
    case 's':
      return 's';

    default:
      throw contextError(`Unexpected type '${type}'`, context);
  }
}

/**
 * @param {string} value
 * @param {ColType} type
 * @param {Context} context
 * @param {boolean | Date | number | string} [_default]
 * @returns {boolean | Date | number | string | undefined}
 */
function parseValue(value, type, context, _default) {
  if (value === undefined || value === '') {
    return _default;
  } else {
    switch (type) {
      case 'b':
        return parseBool(value, context);

      case 'd':
        const d = Date.parse(value);
        if (Number.isNaN(d)) {
          throw contextError(`Not a date: '${value}'`, context);
        }
        return new Date(d);

      case 'n':
        const n = Number(value);
        if (Number.isNaN(n)) {
          throw contextError(`Not a number: '${value}'`, context);
        }
        return n;

      case 's':
        return value;

      default:
        throw contextError(`Unexpected type '${type}'`, context);
    }
  }
}

/** @returns {import('duplexify').Duplexify} */
export function csvb() {
  /** @type {Context} */
  const context = {
    block: null,
    row: 'header',
    column: null,
  };

  let blockReset = false;

  /** @type {{ name: string; type: ColType }[]} */
  let schema;

  /** @type {(boolean | Date | number | string)[]} */
  let defaults = [];

  const csvb = new Transform({
    objectMode: true,
    transform(/** @type {string[]} */ row, _encoding, callback) {
      try {
        if (context.row === 'header') {
          schema = row.map((cell) => {
            if (cell === '') {
              throw Error('Unexpected empty header cell');
            }
            const split = cell.split(':').map((v) => v.trim());
            const [name, type] = split;
            context.column = name;
            if (split.length > 2) {
              throw contextError(
                `Expected max of 2 parts in header cell. Found ${split.length}`,
                context,
              );
            }
            const schema = { name, type: parseType(type, context) };
            context.column = null;
            return schema;
          });
          context.row = 1;
        } else if (row.length == 1 && row[0] === '') {
          blockReset = true;
          context.block = context.block === null ? 1 : context.block + 1;
          context.row = 'defaults';
        } else if (blockReset) {
          blockReset = false;
          defaults = schema.map(({ name, type }, i) => {
            context.column = name;
            return parseValue(row[i], type, context);
          });
          context.column = null;
          // @ts-ignore
          context.row = 1;
        } else {
          /** @type {object} */
          const record = {};
          schema.forEach(({ name, type }, i) => {
            context.column = name;
            return (record[name] = parseValue(row[i], type, context, defaults[i]));
          });
          context.column = null;
          // @ts-ignore
          context.row++;
          this.push(record);
        }
        callback();
      } catch (e) {
        callback(e);
      }
    },
  });

  const csv = parse({
    cast: false,
    columns: false,
    comment: '#',
    comment_no_infix: false,
    trim: true,
    relax_column_count_less: true,
  });

  csv.pipe(csvb);

  return duplexify(csv, csvb, { objectMode: true });
}
