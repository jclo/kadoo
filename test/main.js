// ESLint declarations:
/* global describe, it */
/* eslint one-var: 0, no-unused-vars: 0, semi-style: 0, no-underscore-dangle: 0 */

'use strict';

// -- Node modules
const should     = require('chai').should()
    , { expect } = require('chai')
    ;


// -- Local modules
const Kadoo = require('../index.js')
    ;


// -- Local constants
const input = './test/src/main.js'
    ;


// -- Local variables


// -- Main

describe('Test Kadoo:', () => {
  it('Expects Kadoo to be a function', () => {
    expect(Kadoo).to.be.a('function');
  });

  const kadoo = Kadoo(input, {});
  it('Expects kadoo.get() to return a string.', (done) => {
    kadoo.get((data) => {
      expect(data).to.be.a('string');
      done();
    });
  });

  it('Expects kadoo._dump() to return a string.', (done) => {
    kadoo._dump(false, (data) => {
      expect(data).to.be.a('string');
      done();
    });
  });
});
