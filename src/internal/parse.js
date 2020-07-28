/** ****************************************************************************
 *
 * Parses the passed-in file to build the dependency tree.
 *
 * parse.js is just a literal object that contains a set of functions. It
 * can't be intantiated.
 *
 *
 * Private Functions:
 *  . _getPacket                  returns the module matching the filename,
 *  . _encapsulateInIIFEE         surrounds the file contents by an IIFE module,
 *  . _computeLink                computes the position of the module,
 *  . _pushToPackets              adds the new module to the module list,
 *  . _searchAndReplaceExport     searches and Replaces the export expression,
 *  . _searchAndReplaceImport     searches and replaces the import expression,
 *  . _parse                      builds the dependency tree,
 *
 *
 * Public Methods:
 *  . parse                       builds the dependency tree and generate UMD,
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
const fs       = require('fs')
    , stream   = require('stream')
    , readline = require('readline')
    , path     = require('path')
    ;


// -- Local Modules
const getFromNodeModule = require('./nodemodule')
    , Lib               = require('./lib')
    , T                 = require('./tree')
    , concat            = require('./concat')
    , config            = require('../config')
    ;


// -- Local Constants
const { TREE }    = config
    , { LIBIN }   = config
    , { INDENT2 } = config
    , { INDENT4 } = config
    ;


// -- Local Variables


// -- Private Functions --------------------------------------------------------

/**
 * Returns the module matching the filename,
 *
 * @function (arg1, arg2)
 * @private
 * @param {Array}           the list of the registered modules,
 * @param {String}          the relative path of the requested module,
 * @returns {}              -,
 * @since 0.0.0
 */
function _getPacket(packets, file) {
  for (let i = 0; i < packets.length; i++) {
    if (packets[i].path === file) {
      return packets[i];
    }
  }
  throw new Error(`Gloops, we haven't found "${file}" in packets!`);
}

/**
 * Surrounds the file contents by an IIFE module.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Object}          the module object,
 * @param {String}          the contents of the module,
 * @returns {}              -,
 * @since 0.0.0
 */
/* eslint-disable no-param-reassign */
function _encapsulateInIIFEE(packet, revcontents) {
  const { index } = packet
      , file      = packet.path
      , im        = packet.import.join(', ')
      ;

  // Encapsulate only src modules and not embedded libraries (node_modules).
  if (!packet.path.includes('node_modules')) {
    let contents = '';
    let h = `${INDENT2}/* index: ${index}, path: '${file}', import: [${im}] */\n`;
    h += `${INDENT2}(function() {\n`;

    contents = `${h}${revcontents}`;
    contents += `${INDENT2}}());\n\n`;
    packet.revcontents = Buffer.from(contents, 'utf8');
    return;
  }
  packet.revcontents = Buffer.from(revcontents, 'utf8');
}
/* eslint-enable no-param-reassign */


/**
 * Computes the position of the module in the folder tree.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Array}           the list of the registered modules,
 * @param {String}          the path of the passed-in module,
 * @returns {String}        returns the computed link,
 * @since 0.0.0
 */
function _computeLink(packets, file) {
  const rlink = path.relative(packets[0].base, file)
      , link = rlink.replace('.js', '').split(path.sep)
      , l = link.join('.')
      ;

  // removes hyphen in the path:
  return l.replace('-', '');
}

/**
 * Adds the new module to the module list.
 *
 * @function (arg1, arg2, arg3, arg4, arg5)
 * @private
 * @param {Array}           the list of the registered modules,
 * @param {Array}           a fifo containing the list of the newest modules,
 * @param {String}          the relative path of the new module,
 * @param {String}          the path of the parent (calling) module,
 * @param {String}          the module link,
 * @returns {}              -,
 * @since 0.0.0
 */
function _pushToPackets(packets, fifo, f, parent, link) {
  const file = path.relative(packets[0].base, `${f}.js`);
  let index;

  // Search if this file is already registered. If not, add it to
  // the list of files to process.
  let match = false;
  for (let i = 0; i < packets.length; i++) {
    if (packets[i].path === file) {
      match = true;
      index = i + 1;
      break;
    }
  }
  if (!match) {
    index = packets.length + 1;
    packets.push({
      index,
      path: file,
      import: [],
      links: [],
      export: null,
      contents: null,
      revcontents: null,
    });
    fifo.push(file);
  }

  // Add the reference of this file/module to its parent:
  const packet = _getPacket(packets, parent);
  packet.import.push(index);
  packet.links.push(link);
}

/**
 * Searches and Replaces the export expression.
 *
 * @function (arg1, arg2, arg3)
 * @private
 * @param {String}          the passed-in line,
 * @param {Array}           the list of the registered modules,
 * @param {String}          the path of the processed module,
 * @returns {String/null}   returns the modified line or null,
 * @since 0.0.0
 */
function _searchAndReplaceExport(line, packets, file) {
  let s = '';
  if (line.search(/export/) > -1 && line.search(/default/) > -1) {
    const l = line.trim().split(' ');
    if (l[0] === 'export' && l[1] === 'default') {
      const link = _computeLink(packets, file);
      const packet = _getPacket(packets, file);
      packet.export = {
        name: line.trim().replace('export default ', '').replace(';', ''),
        link,
      };

      // export default xxxx
      // $_TREE.xxx =
      if (packet.index === 1) {
        return line
          .replace('export', `${TREE}.${link}`)
          .replace('default', '=')
        ;
      }

      if (l.length === 3) {
        // 'l' looks like: 'export default A;'
        s += line
          .replace('export', `${TREE}.extend(`)
          .replace('default', `${TREE}.${link},`)
          .replace(`${l[2]}`, `${l[2].replace(';', '')});`)
          .replace('extend( ', 'extend(')
        ;
        return s;
      }

      // 'l' looks like: 'export default { A, B };'
      const s1 = line.slice(line.indexOf('{'), line.indexOf('}') + 1);
      let s2 = s1;
      if (s2.charAt(1) !== ' ') {
        s2 = s2.replace('{', '{ ');
      }
      if (s2.charAt(s2.indexOf('}') - 1) !== ' ') {
        s2 = s2.replace('}', ' }');
      }
      s += line
        .replace('export', `${TREE}.extend(`)
        .replace('default', `${TREE}.${link},`)
        .replace(s1, `${s2})`)
        .replace('extend( ', 'extend(')
      ;
      return s;
    }
  }
  return null;
}

/**
 * Searches and replaces the import expression.
 *
 * @function (arg1, arg2, arg3, arg4, arg5)
 * @private
 * @param {String}          the passed-in line,
 * @param {Array}           the list of the registered modules,
 * @param {Array}           the list of modules to process,
 * @param {String}          the path of the parent module,
 * @param {String}          the relative path,
 * @returns {String/null}   returns the modified line or null,
 * @since 0.0.0
 */
function _searchAndReplaceImport(line, packets, fifo, parent, rpath) {
  if (line.search(/import/) > -1 && line.search(/from/) > -1) {
    const l = line.trim().split(' ');
    if (l[0] === 'import' && l[2] === 'from') {
      const s = l[3].replace(';', '').replace(/'/g, '');

      // So, we found an import. We replace it by a link to the imported
      // file. The link looks like:
      //  . import X from './abc'
      // gives:
      //  . const X = $_TREE.src.<parent_link>.abc
      // The index and the link of the imported file are stored in packet
      // link to the parent.
      let f;
      let link;
      if (s.match(/(^.\/)|(^..\/)/)) {
        f = path.resolve(path.dirname(parent), s);
        link = _computeLink(packets, f);
      } else {
        f = getFromNodeModule(rpath, s);
        link = Lib.computeLink(packets, f);
      }
      _pushToPackets(packets, fifo, f, parent, link);

      // Prefer destructuring if the endpoint equal to the source:
      // import X from './abc/X' => const { X } = $_TREE.abc;
      const endlink = link.split('.').pop();
      if (!link.startsWith(LIBIN) && l[1] === endlink) {
        return line
          .replace('import', 'const')
          .replace(l[1], `{ ${l[1]} }`)
          .replace('from', '=')
          .replace(`'${s}'`, `${TREE}.${link.replace(`.${endlink}`, '')}`)
        ;
      }

      return line
        .replace('import', 'const')
        .replace('from', '=')
        .replace(`'${s}'`, `${TREE}.${link}`)
      ;
    }
  }
  return null;
}

/**
 * Builds the dependency tree.
 *
 * Nota:
 * From the passed-in file, this function searches for the import expressions
 * and build the list of all the linked files. The information are stored
 * in the array 'packets'. Each module is referenced by an object that
 * contains path, import, export, contents, etc. for each file.
 *
 * When all the files are parsed, it passes packet to 'concat'. From these
 * data, 'concat' builds the UMD module that becomes the resulting
 * library.
 *
 * @function (arg1, arg2, arg3, arg4, arg5)
 * @private
 * @param {Array}           the list of modules to process,
 * @param {Array}           the list of registered modules,
 * @param {Object}          the tree object referencing the modules,
 * @param {Object}          the relative path,
 * @param {Function}        the function to call at the completion,
 * @returns {}              -,
 * @since 0.0.0
 */
function _parse(fifo, packets, tree, rpath, callback) {
  const input = fifo.shift()
      , bufferStream = new stream.PassThrough()
      , contents = fs.readFileSync(input)
      ;

  if (input.includes('node_modules')) {
    const packet = _getPacket(packets, input);
    packet.contents = contents;
    Lib.parse(packets, packet, () => {
      /* eslint-disable-next-line no-param-reassign */
      tree[LIBIN] = {};
      if (fifo.length > 0) {
        _parse(fifo, packets, tree, rpath, callback);
      } else {
        callback();
      }
    });
    return;
  }

  let revcontents = ''
    , im
    , ex
    , l
    ;

  bufferStream.end(Buffer.from(contents));
  const rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity,
  });

  rl.on('line', (line) => {
    im = _searchAndReplaceImport(line, packets, fifo, input, rpath);
    ex = _searchAndReplaceExport(line, packets, input);
    if (im) {
      revcontents += `${INDENT4}${im}\n`;
    } else if (ex) {
      revcontents += `${INDENT4}${ex}\n`;
    } else {
      l = `${INDENT4}${line}`.trimEnd();
      revcontents += `${l}\n`;
    }
  });

  rl.on('close', () => {
    const packet = _getPacket(packets, input);
    packet.contents = contents;
    _encapsulateInIIFEE(packet, revcontents);
    T.build(tree, packet.path);

    if (fifo.length > 0) {
      _parse(fifo, packets, tree, rpath, callback);
    } else {
      callback();
    }
  });
}


// -- Public -------------------------------------------------------------------

/**
 *  Parses the passed-in file and builds the resulting UMD Module.
 *
 * @function (arg1, arg2, arg3, arg4, arg5)
 * @public
 * @param {String}          the path of the input file,
 * @param {Array}           an empty array intended to contain the list of modules,
 * @param {Object}          an empty object intended to contain the link between modules,
 * @param {String}          the type of module to produce (generic, umd or es6),
 * @param {Function}        the function to call at the completion,
 * @returns {}              -,
 * @since 0.0.0,
 */
module.exports = function(file, packets, tree, type, callback) {
  const rpath = path.resolve(path.parse(file).root)
      , input = path.relative(rpath, file)
      , fifo  = []
      ;

  packets.push({
    index: 1,
    path: input,
    import: [],
    links: [],
    export: null,
    contents: null,
    revcontents: null,
    base: rpath,
  });
  fifo.push(input);
  _parse(fifo, packets, tree, rpath, () => {
    concat(packets, tree, type, (data) => {
      callback(data);
    });
  });
};
