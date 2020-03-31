/** ****************************************************************************
 *
 * Parses the linked libraries to retrieve the exported name.
 *
 * lib.js is just a literal object that contains a set of functions. It
 * can't be intantiated.
 *
 *
 * Private Functions:
 *  . _computeLink                computes the link from the imported node module,
 *  . _replaceTags                adds the exported name and the reference to the parent,
 *  . _addInfos                   surrounds the library by the collected information,
 *  . _searchForModuleExports     searches for the module export line,
 *  . _searchForLibName           searches for the exported name,
 *  . _searchForThis              searches for the this,
 *  . _parse                      parses the library line by line,
 *
 *
 * Public Methods:
 *  . computeLink                 computes the link from the imported node module,
 *  . parse                       parses the library line by line to extract info,
 *
 *
 *
 * @namespace    Kadoo
 * @dependencies none
 * @exports      -
 * @author       -
 * @since        0.0.0
 * @version      -
 * ************************************************************************** */
/* eslint one-var: 0, semi-style: 0, no-underscore-dangle: 0 */

'use strict';


// -- Vendor Modules
const stream   = require('stream')
    , readline = require('readline')
    , path     = require('path')
    ;


// -- Local Modules
const config = require('../config')
    ;


// -- Local Constants
const { TREE }    = config
    , { LIBIN }   = config
    , { INDENT4 } = config
    ;


// -- Local Variables


// -- Private Functions --------------------------------------------------------


/**
 * Computes the link from the imported node module.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Array}           the list of modules,
 * @param {String}          the file path,
 * @returns {String}        returns the computed link,
 * @since 0.0.0
 */
function _computeLink(packets, file) {
  const link = path.relative(packets[0].base, file.replace('-', '')).split(path.sep);
  return `${LIBIN}.${link[link.length - 1]}`;
}

/**
 * Adds the exported name and the reference to the parent in the header.
 *
 * @function (arg1, arg2, arg3)
 * @private
 * @param {String}          the library (node module) contents,
 * @param {String}          the exported name,
 * @param {String}          the link to the parent,
 * @returns {}              -,
 * @since 0.0.0
 */
function _replaceTags(revcontents, libname, link) {
  let l = link.split('.');
  l.splice(-1);
  l = l.join('.');

  return revcontents
    .replace('{{lib:name}}', libname)
    .replace('{{lib:link}}', `${TREE}.${l}`)
  ;
}

/**
 * Surrounds the library by the collected information.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Object}          the library object,
 * @param {String}          the modified library contents,
 * @returns {}              -,
 * @since 0.0.0
 */
/* eslint-disable no-param-reassign */
function _addInfos(packet, revcontents) {
  const { index } = packet
      , file      = packet.path
      , { name }  = packet.export
      , { link }  = packet.export
      ;

  let contents = '';
  let h = `${INDENT4}/* index: ${index}, path: '${file}' */\n`;
  h += `${INDENT4}/* export: ${name}, link: '${link}' */\n`;
  contents = `${h}${revcontents}`;
  packet.revcontents = Buffer.from(contents, 'utf8');
}
/* eslint-enable no-param-reassign */

/**
 * Searches for the module export line.
 *
 * Nota:
 * We search for the sequence 'module.exports = factory(root)'. If the
 * sequence is found, we add an extra line containing 'root.{Lib} = factory(root);'
 * to reference the library when we conducts the tests in Node.
 *
 * @function (arg1)
 * @private
 * @param {String}          the selected line,
 * @returns {String/null}   returns the modified line or null,
 * @since 0.0.0
 */
function _searchForModuleExports(line) {
  const s = line.trim().split(' ');
  if (s[0] === 'module.exports'
    && s[1] === '='
    && s[2] === 'factory(root);'
  ) {
    const wc = `${INDENT4}${'\x20'.repeat(line.search(/\S/))}`;
    const edisable = '/* eslint-disable-next-line no-param-reassign */';
    return `${line}\n${wc}${edisable}\n${wc}root.{{lib:name}} = factory(root);`;
  }
  return null;
}

/**
 * Searches for the exported name.
 *
 * Nota:
 * We search here the sequence 'root.{Lib} = factory(root);' If the
 * sequence is found, we get the exported name (i.e. {Lib} here).
 *
 * @function (arg1)
 * @private
 * @param {String}          the selected line,
 * @returns {String/null}   returns the modified line or null,
 * @since 0.0.0
 */
function _searchForLibName(line) {
  const s = line.trim().split(' ');

  if (s[0].startsWith('root.')
    && s[1] === '='
    && s[2] === 'factory(root);'
  ) {
    return s[0].slice(5);
  }
  return null;
}


// search for this: }(this, (root) => {

/**
 * Searches for the this.
 *
 * @function (arg1)
 * @private
 * @param {String}          the selected line,
 * @returns {String/null}   returns the modified line or null,
 * @since 0.0.0
 */
function _searchForThis(line) {
  const s = line.trim();
  if (s === '}(this, (root) => {') {
    return line.replace('this', '{{lib:link}}');
  }
  return null;
}

/**
 * Parses the library line by line to extract useful information.
 *
 * @function (arg1, arg2, arg3)
 * @private
 * @param {Array}           the list of modules,
 * @param {Object}          the library object,
 * @param {Function}        the function to call at the completion,
 * @returns {}              -,
 * @since 0.0.0
 */
/* eslint-disable no-param-reassign */
function _parse(packets, packet, callback) {
  const bufferStream = new stream.PassThrough()
      ;

  bufferStream.end(Buffer.from(packet.contents));
  const rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity,
  });

  let revcontents = ''
    , libname
    , name
    , l
    , ex
    , that
    ;

  rl.on('line', (line) => {
    ex = _searchForModuleExports(line);
    name = _searchForLibName(line);
    that = _searchForThis(line);

    if (ex) {
      revcontents += `${INDENT4}${ex}\n`;
    } else if (name) {
      libname = name;
      l = `${INDENT4}${line}`.trimEnd();
      revcontents += `${l}\n`;
    } else if (that) {
      l = `${INDENT4}${that}`.trimEnd();
      revcontents += `${l}\n`;
    } else {
      l = `${INDENT4}${line}`.trimEnd();
      revcontents += `${l}\n`;
    }
  });

  rl.on('close', () => {
    const link = _computeLink(packets, packet.path.replace('.js', ''));
    packet.export = { name: libname, link };
    revcontents = _replaceTags(revcontents, libname, link);
    _addInfos(packet, revcontents);
    callback();
  });
}
/* eslint-enable no-param-reassign */


// -- Public -------------------------------------------------------------------

module.exports = {

  /**
   * Computes the link from the imported node module.
   *
   * @method (arg1, arg2)
   * @public
   * @param {Array}         the list of modules,
   * @param {String}        the file path,
   * @returns {String}      returns the computed link,
   * @since 0.0.0,
   */
  computeLink(packets, file) {
    return _computeLink(packets, file);
  },

  /**
   * Parses the library line by line to extract useful information.
   *
   * @method (arg1, arg2, arg3)
   * @public
   * @param {Array}         the list of modules,
   * @param {Object}        the library object,
   * @param {Function}      the function to call at the completion,
   * @since 0.0.0,
   */
  parse(packets, packet, callback) {
    _parse(packets, packet, () => {
      callback();
    });
  },
};
