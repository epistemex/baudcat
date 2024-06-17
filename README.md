baudcat
=======

A simple buffered cat command with BAUD rate simulation.

Cross-platform for terminal emulators.

Usage
-----

Examples:

    baudcat textfile.txt                # output textfile at default 2,400 BAUD
    baudcat --baud 300 textfile.txt     # output textfile at 300 BAUD
    baudcat -C anim.vt                  # hide cursor before outputting, restore at end
    baudcat file.txt --fps 30 -b 9600   # reduce frame rate
    cat textfile.txt | baudcat -        # pipe and use STDIN (-) as input file

Use the option `--help` or `-h` to see more information.

Notes
-----

The BAUD rate is currently an approximation due to various factors that hasn't been addressed. This
behavior may or may not change in a future release.

Use the option `--stats` for actual B/s rate.


Installation
------------

Requires Node.js and NPM. Install globally:

    npm i -g https://github.com/epistemex/baudcat

License
-------

MIT (see the [LICENSE-MIT](./LICENSE-MIT) file for details)

Copyright (c) 2020, 2024 Epistemex
