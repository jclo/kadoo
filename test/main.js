// ESLint declarations:
/* global describe, it */
/* eslint one-var: 0, no-unused-vars: 0, semi-style: 0 */

'use strict';

// -- Node modules
const should     = require('chai').should()
    , { expect } = require('chai')
    ;


// -- Local modules
const Kadoo = require('../index.js')
    ;


// -- Local constants


// -- Local variables


// -- Main

describe('Test Kadoo:', () => {
  it('Expects Kadoo to be a function', () => {
    expect(Kadoo).to.be.a('function');
  });
});
