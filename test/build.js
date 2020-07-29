/* eslint-disable one-var, semi-style */

'use strict';

// -- Node modules
const fs = require('fs')
    ;


// -- Local modules
const Kadoo = require('../index');


// -- Local constants


// -- Local variables


// -- Public -------------------------------------------------------------------

const kadoo = Kadoo('./test/src/main.js', {});
const kadoo6 = Kadoo('./test/src/main.js', { type: 'es6' });

kadoo.get((data) => {
  fs.writeFile('./test/lib/bundle.js', data, 'utf8', (err) => {
    if (err) throw err;
    process.stdout.write('The UMD module is saved in "./test/lib/bundle.js"\n');
  });
});

kadoo6.get((data) => {
  fs.writeFile('./test/lib/bundle.mjs', data, 'utf8', (err) => {
    if (err) throw err;
    process.stdout.write('The ES6 module is saved in "./test/lib/bundle.mjs"\n');
  });
});
