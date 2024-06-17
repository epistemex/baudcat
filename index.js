#!/usr/bin/env node
/* *********************************************************
 *
 *  baudcat
 *
 *  Copyright (c) 2020, 2024 Epistemex
 *
 **********************************************************/

'use strict';

const write = process.stdout.write.bind(process.stdout);
const error = process.stderr.write.bind(process.stderr);

const options = require('commander')
  .description('A simple buffered cat command with BAUD rate simulation.\n(c) 2020 Epistemex')
  .version(require('./package.json').version, '-v, --version')
  .usage('[options] textfile')
  .option('-b, --baud <rate>', 'Simulate baud rate [1, 512K].', 2400)
  .option('-C, --no-cursor', 'Hide cursor while outputting. Restore at end.')
  .option('--fps <fps>', 'Frames per second [1, 240].', 60)
  .option('--stats', 'Show stats at the end.')
  .option('--blocksize <size>', 'Read blocksize, in KB (ignored if STDIN)', 128)
  .parse(process.argv);

const isStdIn = options.args[ 0 ] === '-';
const startTime = Date.now();

if ( options.args.length === 1 ) {
  process.on('exit', () => {
    resetCursor();

    if ( options.stats && options.args[ 0 ] !== '-' ) {
      const endTime = Date.now();
      const size = require('fs').statSync(options.args[ 0 ]).size;
      const time = (endTime - startTime) / 1000;
      const bps = size / time;

      write('\x1b[0m\n' + '='.repeat(72) + '\n');
      write(`Size: ${ size } bytes\n`);
      write(`Time: ${ time.toFixed(1) } seconds\n`);
      write(`BAUD: ${ bps.toFixed(1) } B/s (setting: ${ options.baud } BAUD)\n`);
      write('='.repeat(72) + '\n');
    }
  });

  process.on('SIGINT', () => {
    resetCursor();
    write('\n');
    options.stats = false;
    process.exit();
  });

  go();
}
else options.outputHelp();

// -----------------------------------------------------------------------------

function go() {
  const fs = require('fs');
  const { Transform } = require('stream');

  // Sanity checks and clamping
  const blockSize = Math.max(1, Math.min(options.blocksize, 4194304)) << 10;
  const baud = Math.max(1, Math.min(524288, options.baud | 0));
  const fps = Math.max(1, Math.min(240, options.fps | 0));

  let step = 1;
  let delay = baud;
  let readStr;

  /**
   * Will write data in small chunks per frame or char delay per char (baud < fps)
   * at the rate calculated by `delay` and delta by `step`.
   * @param options
   * @constructor
   */
  class TDelay extends Transform {
    constructor(options) {super(options);}

    _transform(chunk, enc, cb) {
      let i = 0;

      // todo consider improving accuracy by using delta times.
      setTimeout(function _chunk() {
        const ref = setTimeout(_chunk, delay);
        write(chunk.subarray(i, i += step));
        if ( i >= chunk.length ) {
          clearTimeout(ref);
          cb();
        }
      }, delay);
    }
  }

  // open read stream and add handlers
  (readStr = isStdIn ? process.stdin : fs.createReadStream(options.args[ 0 ], { highWaterMark: blockSize }))
    .on('error', () => {error('Could not open file.\n');})
    .on('end', () => {if ( !isStdIn ) readStr.close();});

  // hide cursor?
  if ( !options.cursor ) write('\x1b[0m\x1b[?25l');

  if ( baud >= fps ) {
    delay = fps;
    step = Math.max(1, Math.round(baud / fps));
  }

  delay = Math.max(4, Math.round(1000 / delay));
  readStr.pipe(new TDelay());
}

function resetCursor() {
  if ( !options.cursor ) write('\x1b[0m\x1b[?25h');
}
