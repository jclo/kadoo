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
 *  . _searchFirstSignature       searches for the first library signature,
 *  . _searchSecondSignature      searches for the second library signature,
 *  . _searchThirdSignature       searches for the third library signature,
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
 * Searches for the first library signature.
 * (pattern: "if (typeof define === 'function' && define.amd)")
 *
 * @function (arg1)
 * @private
 * @param {String}          the current line,
 * @returns {Boolean}       returns true if the signature is found,
 * @since 0.0.0
 */
function _searchFirstSignature(line) {
  const s = line.trim().split(' ');
  if (s[0] === 'if'
      && s[1] === '(typeof'
      && s[2] === 'define'
      && s[3] === '==='
      && s[4] === '\'function\''
      && s[5] === '&&'
      && s[6] === 'define.amd)') {
    return true;
  }
  return false;
}

/**
 * Searches for the second library signature.
 * (pattern: "module.exports = factory(root);")
 *
 * @function (arg1)
 * @private
 * @param {String}          the current line,
 * @returns {Boolean}       returns true if the signature is found,
 * @since 0.0.0
 */
function _searchSecondSignature(line) {
  const s = line.trim().split(' ');
  if (s[0] === 'module.exports'
    && s[1] === '='
    && s[2] === 'factory(root);'
  ) {
    return true;
  }
  return false;
}

/**
 * Searches for the third library signature.
 * (pattern: "root.LibName = factory(root);")
 *
 * @function (arg1)
 * @private
 * @param {String}          the current line,
 * @returns {Boolean}       returns true if the signature is found,
 * @since 0.0.0
 */
function _searchThirdSignature(line) {
  const s = line.trim().split(' ');

  if (s[0].startsWith('root.')
    && s[1] === '='
    && s[2] === 'factory(root);'
  ) {
    return s[0].slice(5);
  }
  return false;
}

/**
 * Searches for the fourth library signature.
 * (pattern: "this: }(this, (root) => {")
 *
 * @function (arg1)
 * @private
 * @param {String}          the current line,
 * @returns {Boolean}       returns true if the signature is found,
 * @since 0.0.0
 */
function _searchFourthSignature(line) {
  const s = line.trim();
  if (s === '}(this, (root) => {') {
    return true;
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
  const MAXCOUNT = 50
      , bufferStream = new stream.PassThrough()
      ;

  bufferStream.end(Buffer.from(packet.contents));
  const rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity,
  });

  let revcontents = ''
    , libname = 'unknown'
    , count = 0
    , sig1 = false
    , sig2 = false
    , sig3 = false
    , sig4 = false
    , wc
    , l
    ;

  rl.on('line', (line) => {
    if (!sig1) {
      sig1 = _searchFirstSignature(line);
      l = `${INDENT4}${line}`.trimEnd();
      revcontents += `${l}\n`;
      count += 1;
      if (count > MAXCOUNT) {
        throw new Error(
          `We haven't found the first signature of the library ${packet.path}`,
        );
      }
      return;
    }

    if (!sig2) {
      l = `${INDENT4}${line}`.trimEnd();
      sig2 = _searchSecondSignature(line);
      if (sig2) {
        // If the signature is found, we add an extra line containing
        // 'root.{Lib} = factory(root);' to reference the embedded library
        // when the library is run on Node.js.
        wc = `${INDENT4}${'\x20'.repeat(line.search(/\S/))}`;
        l += `\n${wc}/* eslint-disable-next-line no-param-reassign */`;
        l += `\n${wc}root.{{lib:name}} = factory(root);`;
      }
      revcontents += `${l}\n`;
      count += 1;
      if (count > MAXCOUNT) {
        throw new Error(
          `We haven't found the second signature of the library ${packet.path}`,
        );
      }
      return;
    }

    if (!sig3) {
      sig3 = _searchThirdSignature(line);
      if (sig3) {
        libname = sig3;
      }
      l = `${INDENT4}${line}`.trimEnd();
      revcontents += `${l}\n`;
      count += 1;
      if (count > MAXCOUNT) {
        throw new Error(
          `We haven't found the third signature of the library ${packet.path}`,
        );
      }
      return;
    }

    if (!sig4) {
      l = `${INDENT4}${line}`.trimEnd();
      sig4 = _searchFourthSignature(line);
      if (sig4) {
        l = l.replace('this', '{{lib:link}}');
      }
      revcontents += `${l}\n`;
      count += 1;
      if (count > MAXCOUNT) {
        throw new Error(
          `We haven't found the fourth signature of the library ${packet.path}`,
        );
      }
      return;
    }

    // indent until the end:
    l = `${INDENT4}${line}`.trimEnd();
    revcontents += `${l}\n`;
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
