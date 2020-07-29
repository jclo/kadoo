/** ****************************************************************************
 *
 * Concatenates modules and libraries inside an UMD module.
 *
 * concat.js is just a literal object that contains a set of functions. It
 * can't be intantiated.
 *
 *
 * Private Functions:
 *  . _fixLibLinks                fixes the wrong library links,
 *  . _getIifeContents            concatenates all the IIFE modules,
 *  . _getLibContents             concatenates all the library modules,
 *  . _split                      Returns the list of modules and libraries,
 *  . _concat                     merges everything in an UMD or ES6 module,
 *
 *
 * Public Function:
 *  . concat                      concatenates all the modules and libraries,
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

// ESLint declarations
/* eslint one-var: 0, semi-style: 0, no-underscore-dangle: 0 */

'use strict';


// -- Vendor Modules
const fs       = require('fs')
    , stream   = require('stream')
    , readline = require('readline')
    ;


// -- Local Modules
const pack   = require('../../package')
    , T      = require('./tree')
    , config = require('../config')
    ;


// -- Local Constants
const { header }  = config
    , { footer }  = config
    , { TREE }    = config
    , { LIBIN }   = config
    , { INDENT2 } = config
    , { INDENT4 } = config
    , { ES6GLOB } = config
    ;


// -- Local Variables


// -- Private Functions --------------------------------------------------------

/**
 * Fixes the wrong library links.
 *
 * Nota:
 * When the keyword import is replaced in a module, the name of the
 * imported library, if it is a library, is unknown. Thus, the link refers
 * to the filename of the library instead of the library.
 * For instance, 'import LRU from '@mobilabs/lru' is replaced by
 * 'LRU = $_TREE.libin.lru'.
 * Here we fix this by replacing 'lru' by the name exported by the library.
 *
 * @function (arg1, arg2, arg3)
 * @private
 * @param {String}          the concatened module contents,
 * @param {Array}           the list of the libraries links,
 * @param {Function}        the function to call at the completion,
 * @returns {}              -,
 * @since 0.0.0
 */
function _fixLibLinks(contents, elinks, callback) {
  const bufferStream = new stream.PassThrough();

  bufferStream.end(Buffer.from(contents));
  const rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity,
  });

  let nc = ''
    , l
    , nl
    , name
    ;

  rl.on('line', (line) => {
    // we search here for a link structured like this:
    //   - const X = $__TREE.libin.xxx
    // and we replace 'xxx' by the exported name of the library.
    if (line.includes(`${TREE}.${LIBIN}.`)) {
      l = line.trim().slice(0, -1).split(' ');
      name = elinks[l[3].replace(`${TREE}.`, '')];
      if (name && name === l[1]) {
        // Prefer destructuring:
        nl = `${INDENT4}const { ${l[1]} } = ${TREE}.${LIBIN};`;
      } else if (name) {
        nl = `${INDENT4}const ${l[1]} = ${TREE}.${LIBIN}.${name};`;
      } else {
        throw new Error(
          `We haven't found the exported name of the library "${l[3]}"`,
        );
      }
      nc += `${nl}\n`;
    } else {
      nc += `${line}\n`;
    }
  });

  rl.on('close', () => {
    callback(nc);
  });
}

/**
 * Returns the module concatened contents.
 *
 * @function (arg1)
 * @private
 * @param {Array}           the list of modules,
 * @returns {String}        returns the concatened contents,
 * @since 0.0.0
 */
function _getIifeContents(iife) {
  let contents = '';

  for (let i = 0; i < iife.length; i++) {
    contents += iife[i].revcontents.toString();
  }
  return contents;
}

/**
 * Returns the library concatened contents.
 *
 * @function (arg1)
 * @private
 * @param {Array}           the list of libraries,
 * @returns {String}        returns the concatened contents,
 * @since 0.0.0
 */
function _getLibContents(lib) {
  if (lib.length === 0) {
    return null;
  }

  let contents = '';
  contents += `${INDENT2}/* eslint-disable no-shadow */\n`;
  contents += `${INDENT2}function ${TREE}_RUN_EMBED_LIB() {\n`;
  for (let i = 0; i < lib.length; i++) {
    contents += lib[i].revcontents.toString();
  }
  contents += `${INDENT2}}\n`;
  contents += `${INDENT2}/* eslint-enable no-shadow */\n`;

  return contents;
}

/**
 * Returns the list of module and the list of libraries and their links.
 *
 * @function (arg1)
 * @private
 * @param {Array}           the list of modules and libraries,
 * @returns {Array}         returns the list of modules, libraries, links,
 * @since 0.0.0
 */

function _split(packets) {
  const iife  = []
      , elibs = []
      , links = {}
      ;

  for (let i = 0; i < packets.length; i++) {
    if (packets[i].path.startsWith('node_modules')) {
      elibs.push(packets[i]);
      links[packets[i].export.link] = packets[i].export.name;
    } else {
      iife.push(packets[i]);
    }
  }

  return [iife, elibs, links];
}

/**
 * Merges everything in an UMD module.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Array}           the list of modules and libraries,
 * @param {Object}          the object tree that links the modules together,
 * @returns {Object}        returns the resulting UMD Module as a buffer,
 * @since 0.0.0
 */
function _concat(packets, tree, type, callback) {
  const libname = packets[0].export.name
      , liblink = packets[0].export.link
      ;

  const [iife, elibs, elinks] = _split(packets);

  let head;
  let foot;
  let exportM;
  switch (type) {
    case 'generic':
      head = fs.readFileSync(header, 'utf8').replace(/{{lib:name}}/g, libname);
      foot = fs.readFileSync(footer, 'utf8').replace('{{lib:name:link}}', `${TREE}.${liblink}`);
      break;

    case 'es6':
      head = fs.readFileSync(header, 'utf8')
        .replace(/{{lib:name}}/g, libname)
        .replace('{{lib:es6:define}}', `const ${ES6GLOB} = {};`)
        .replace('{{lib:es6:link}}', ES6GLOB);

      exportM = '\n// -- Export\n';
      exportM += `export default ${ES6GLOB}.${libname};`;
      foot = fs.readFileSync(footer, 'utf8')
        .replace('{{lib:name:link}}', `${TREE}.${liblink}`)
        .replace('{{lib:es6:export}}', exportM);
      break;

    default:
      // By default, we consider it is an umd module
      head = fs.readFileSync(header, 'utf8')
        .replace(/{{lib:name}}/g, libname)
        .replace('{{lib:es6:define}}\n', '')
        .replace('{{lib:es6:link}}', 'this');

      foot = fs.readFileSync(footer, 'utf8')
        .replace('{{lib:name:link}}', `${TREE}.${liblink}`)
        .replace('{{lib:es6:export}}\n', '');
  }

  const treeSection = T.get(tree, elibs);
  const iifecontents = _getIifeContents(iife);
  const libcontents = _getLibContents(elibs);

  _fixLibLinks(iifecontents, elinks, (revIIFEContents) => {
    let s = `/*! Generated by Kadoo v${pack.version} */\n`;
    s += `${head}\n${treeSection}\n`;
    s += `${revIIFEContents}\n`;
    s += libcontents ? `${libcontents}\n` : '';
    s += `${foot}`;

    callback(s);
  });
}


// -- Public -------------------------------------------------------------------

/**
 * Concatenates all the modules and libraries in an UMD or ES6 module.
 *
 * @function (arg1, arg2, arg3, arg4)
 * @public
 * @param {Array}           the list of modules and libraries,
 * @param {Object}          the object tree that links the modules together,
 * @param {String}          the type of module to produce (generic, umd or es6),
 * @param {Function}        the function to call at the completion,
 * @returns {}              - ,
 * @since 0.0.0,
 */
module.exports = function(packets, tree, type, callback) {
  _concat(packets, tree, type, (data) => {
    callback(data);
  });
};
