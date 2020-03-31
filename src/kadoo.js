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
  obj.packets = [];
  obj.tree = {};
  return obj;
};


// -- Methods ------------------------------------------------------------------

methods = {

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
    parse(this.app, this.packets, this.tree, (buf) => {
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
