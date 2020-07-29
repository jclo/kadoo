/** ****************************************************************************
 *
 * Bundles javascript files in an UMD module.
 *
 * kadoo.js is built upon the Prototypal Instantiation pattern. It
 * returns an object by calling its constructor. It doesn't use the new
 * keyword.
 *
 * Private Functions:
 *  . none,
 *
 *
 * Constructor:
 *  . Kadoo                       returns Kadoo object,
 *
 *
 * Private Methods:
 *  . _dump                       prints the generated UMD module to stdout,
 *  . _getPacket                  returns the packet array,
 *  . _getTree                    returns the tree object,
 *
 *
 * Public Methods:
 *  . get                         creates the UMD module,
 *  . bundle                      inserts the generated UMD module in a Gulp stream,
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


// -- Local Modules
const parse  = require('./internal/parse')
    , Stream = require('./internal/streamout')
    // , Debug  = require('./debug/debug')
    ;


// -- Local Constants


// -- Local Variables
let methods;


// -- Public -------------------------------------------------------------------

/**
 * Creates Kadoo object.
 *
 * @constructor (arg1, arg2)
 * @public
 * @param {String}          the input file,
 * @param {Object}          the optional parameters,
 * @returns {Object}        returns Kadoo object,
 * @since 0.0.0
 */
const Kadoo = function(app, options) {
  const obj = Object.create(methods);
  obj.app = app;
  obj.export = options && options.export ? options.export : 'MyBundle';
  obj.type = options && options.type ? options.type : 'umd';
  obj.packets = [];
  obj.tree = {};
  return obj;
};


// -- Methods ------------------------------------------------------------------

methods = {

  /**
   * Prints the generated UMD module to stdout.
   *
   * @method (arg1, arg2)
   * @private
   * @param {Boolean}       dump to stdout or return to callback,
   * @param {Function}      function to call at the completion if stdout is false,
   * @returns {}            -,
   * @since 0.0.0
   */
  _dump(stdout, callback) {
    this.get((data) => {
      if (stdout) {
        process.stdout.write(`${data}\n`);
      } else {
        callback(data);
      }
    });
  },

  /**
   * Returns the packet array.
   *  (for debugging purpose)
   *
   * @method ()
   * @private
   * @param {}              -,
   * @returns {Array}       returns the packet array,
   * @since 0.0.0
   */
  _getPackets() {
    return this.packets;
  },

  /**
   * Returns the tree object.
   *  (for debugging purpose)
   *
   * @method ()
   * @private
   * @param {}              -,
   * @returns {Object}      returns the tree object,
   * @since 0.0.0
   */
  _getTree() {
    return this.tree;
  },

  /**
   * Creates the UMD module.
   *
   * @method ()
   * @public
   * @param {}              -,
   * @returns {}            -,
   * @since 0.0.0
   */
  get(callback) {
    this.packets = [];
    this.tree = {};
    parse(this.app, this.packets, this.tree, this.type, (buf) => {
      if (callback) {
        callback(buf);
      }
    });
    return this;
  },

  /**
   * Inserts the generated UMD module in a Gulp stream.
   *
   * @method ()
   * @public
   * @param {}              -,
   * @returns {}            -,
   * @since 0.0.0
   */
  bundle() {
    this.get((data) => {
      Stream.push(this.app, data);
    });
    return Stream.getStream();
  },
};


module.exports = Kadoo;
/* - */
