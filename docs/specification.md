# CSV Blocks (CSVB)

A superset of CSV designed as a simple, intuitive, human-editable intermediate format for data imports.

CSVB is like CSV but with additional features:

- Forgiving and convenient syntax.
- Comments.
- Strict typing of columns.
- Blocks of rows.
- Default values for blank cells in blocks.

## File Format Rules

### 1. Rows

- Rows contain cells over the course of one line.
- Cells are comma separated.
- Values can be put inside double quotes to use reserved characters (quoted value).
- Double quotes can be used within a quoted value by escaping with a second double quote (`""`).
- Whitespace around the delimiter outside of quotes is trimmed.
- Blank cells are considered `undefined`.
- Trailing empty cells may omit commas.

### 1. The Header Row

- The first line is the header row.
- Header row cells define the data's fields.
- Header cells follow the format `name[:type]`.
- The type denotes the strict data type for field values (see below).
- If type is omitted, string type is assumed.

### 3. Comments

- Use `#` for comments.
- Whole line comments are ignored.
- Inline comments in cells, outside of quotes, are also ignored and effectively terminate the cell and row.

### 4. Blank Lines

- Blank or whitespace-only lines are ignored, but also start a new block context (see below).

### 5. Blocks

- A block is a grouping of consecutive rows.
- Blocks are separated by one or more blank lines.
- Blank lines start a new block context. Block context is not started after header row (for compatibility with regular CSV).
- The first row of a block is the default row. It is required and defines default values for that block.
- The default row can include blank cells to omit providing a default value.
- Blank cells within the block inherit values from the default row where the corresponding column has a default value defined.

### 6. Types

- Types are strictly enforced according to the header.
- Invalid values raise an error during parsing.

| Type                        | Valid values                                                                                             |
| :-------------------------- | :------------------------------------------------------------------------------------------------------- |
| `boolean`, `bool`, `b`      | Case insensitive. `true`, `t`, `yes`, `y`, or `1` are truthy. `false`, `f`, `no`, `n`, or `0` are falsy. |
| `date`, `d`                 | ISO-8601 preferred for compatibility, but language-parseable is valid.                                   |
| `number`, `num`, `int`, `n` | Any language-parsable integer or float.                                                                  |
| `string`, `str`, `s`        | Stored as-is.                                                                                            |

## Examples

See [test directory](../test)
