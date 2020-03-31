/** ****************************************************************************
 *
 * Retrieves the library path from a node module.
 *
 * nodemodule.js is just a literal object that contains a set of functions. It
 * can't be intantiated.
 *
 * Private Functions:
 *  . _getPathFromIndex           extracts the library path from 'index.js',
 *  . _getNodeModulePath          retrieves the library path,
 *
 *
 * Public Function:
 *  . getNodeModulePath           returns the library path,
 *
 *
 *
 * @namespace    -
 * @dependencies none
 * @exports      -
 * @author       -
 * @since        0.0.0
 * @version      -
 * ************************************************************************** */
/* eslint-disable one-var, semi-style, no-underscore-dangle */

'use strict';


// -- Node modules
const fs   = require('fs')
    , path = require('path')
    ;


// -- Local modules


// -- Local constants


// -- Local variables


// -- Private Functions --------------------------------------------------------

/**
 * Extracts the library path from 'index.js'.
 *
 * Nota:
 * We search here the pattern 'module.exports = require('...')' because we
 * assume that 'index.js' contains only a link to the library as this library
 * is intended to run in a browser. Thus, it is the result of multiple
 * source files bundled together.
 *
 * @function (arg1, arg2)
 * @private
 * @param {String}          the root path,
 * @param {String}          the module name or the library path,
 * @returns {String}        returns the library path,
 * @since 0.0.0,
 */
function _getPathFromIndex(rpath, name) {
  const index = fs.readFileSync(`${rpath}/node_modules/${name}/index.js`, 'utf8');
  if (!index.match(/module\.exports.*=.*require.*(.*)/)) {
    throw new Error(`${rpath}/node_modules/${name}/index.js\n does NOT contains "module.exports"!\n`);
  }
  const lib = index
    .match(/require\(.*\)/)[0]
    .replace('require(', '')
    .replace(')', '')
    .replace(/'/g, '')
  ;

  return path.resolve(`${rpath}/node_modules/${name}`, lib);
}

/**
 * Retrieves the library path.
 *
 * @function (arg1, arg2)
 * @private
 * @param {String}          the root path,
 * @param {String}          the module name or the library path,
 * @returns {String}        returns the library path,
 * @since 0.0.0,
 */
function _getNodeModulePath(rpath, name) {
  let stat
    ;

  // Check if the path match a JS file:
  try {
    fs.accessSync(`${rpath}/node_modules/${name}.js`);
    stat = true;
  } catch (error) {
    stat = null;
  }
  if (stat) return `${rpath}/node_modules/${name}`;

  // Check if package.json main isn't empty:
  try {
    fs.accessSync(`${rpath}/node_modules/${name}/package.json`);
  } catch (error) {
    throw new Error(`The file "${rpath}/node_modules/${name}/package.json" does NOT exist!`);
  }
  const pack = JSON.parse(
    fs.readFileSync(`${rpath}/node_modules/${name}/package.json`, 'utf8'),
  );
  if (pack.main === 'index.js') {
    return _getPathFromIndex(rpath, name);
  }
  if (pack.main.length > 0) {
    try {
      fs.accessSync(`${rpath}/node_modules/${name}/${pack.main}`);
    } catch (error) {
      throw new Error(
        `The file "${rpath}/node_modules/${name}/${pack.main}" does NOT exist!`,
      );
    }
    return `${rpath}/node_modules/${name}/${pack.main}`.replace('.js', '');
  }

  // Check if index.js exists:
  try {
    fs.accessSync(`${rpath}/node_modules/${name}/index.js`);
  } catch (error) {
    throw new Error(`The file "${rpath}/node_modules/${name}/index.js" does NOT exist!`);
  }
  return _getPathFromIndex(rpath, name);
}


// -- Public -------------------------------------------------------------------

/**
 * Returns the library path.
 *
 * Nota:
 * We search here the referenced library in 'node_modules'. The algorithm
 * is the following:
 *  - we search first if the name matches a 'js' file,
 *  - if not, we search if 'main' in package.json contains the name of
 *    a 'js' file,
 *  - if not, we search the reference to the 'js' file in 'index.js',
 *  - if we find the library, we return the path to the 'js' file withtout
 *    the extension '.js'
 *  - if we don't find anything, we throw an error,
 *
 * @function (arg1, arg2)
 * @public
 * @param {String}          the root path,
 * @param {String}          the module name or the library path,
 * @returns {String}        returns the library path,
 * @since 0.0.0,
 */
module.exports = function(rpath, name) {
  return _getNodeModulePath(rpath, name);
};

/* - */
