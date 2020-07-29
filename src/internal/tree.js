// ESLint declarations
/* eslint one-var: 0, semi-style: 0, no-underscore-dangle: 0 */

'use strict';


// -- Vendor Modules
const path = require('path')
    ;


// -- Local Modules
const config = require('../config')
    ;


// -- Local Constants
const { TREE } = config
    ;


// -- Local Variables


// -- Private Functions --------------------------------------------------------

/**
 * Returns the tree section.
 *
 * @function (arg1)
 * @private
 * @param {Object}          the object tree that links the modules,
 * @returns {String}        returns the tree section,
 * @since 0.0.0
 */
function _getTree(treecontents, lib) {
  let callLibs;

  if (lib && lib.length > 0) {
    callLibs = `${TREE}_RUN_EMBED_LIB();`;
  } else {
    callLibs = '/* - */';
  }

  return ['  /* ***************************************************************************',
    '   *',
    '   * Tree is an object that links all the internal IIFE modules.',
    '   *',
    '   * ************************************************************************ */',
    '  /* eslint-disable */',
    `  let ${TREE} = ${JSON.stringify(treecontents)};`,
    `  ${TREE}.extend=function(o,m){var k=Object.keys(m);for(var i=0;i<k.length;i++){o[k[i]]=m[k[i]]}};`,
    `  ${callLibs}`,
    '  /* eslint-enable */',
    ''].join('\n');
}

/**
 * Builds the object tree.
 *
 * Nota:
 * The tree object references the files in the folder structure. If the
 * folder structure looks like:
 *   . src
 *      |_ util1 - util2
 *                   |_ util3
 *
 * The tree structure will be:
 *  . T = { src: { util1: {}, util2: { util3: {} } } }
 *
 * @function (arg1, arg2)
 * @private
 * @param {Object}          the tree object,
 * @param {String}          the path of the file,
 * @returns {}              -,
 * @since 0.0.0,
 */
function _build(tree, file) {
  const p = file.replace('.js', '').split(path.sep);

  let i = 0;
  let t = tree;
  let keys;
  let key;
  do {
    keys = Object.keys(t);
    key = keys.indexOf(p[i]);
    if (key === -1) {
      t[p[i]] = {};
      t = t[p[i]];
    } else {
      t = t[p[i]];
    }
    i += 1;
  } while (i < p.length);
}


// -- Public -------------------------------------------------------------------

module.exports = {

  /**
   * Builds the object tree.
   *
   * @method (arg1, arg2)
   * @private
   * @param {Object}        the tree object,
   * @param {String}        the path of the file,
   * @returns {}            -,
   * @since 0.0.0,
   */
  build(tree, file) {
    _build(tree, file);
  },

  /**
   * Returns the tree section.
   *
   * @method (arg1)
   * @public
   * @param {Object}        the object tree that links the modules,
   * @returns {String}      returns the tree section,
   * @since 0.0.0,
   */
  get(treecontents, lib) {
    return _getTree(treecontents, lib);
  },
};
