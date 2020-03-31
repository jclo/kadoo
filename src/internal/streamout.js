/** ****************************************************************************
 *
 * Includes the output to a Gulp Stream.
 *
 * streamout.js is just a literal object that contains a set of functions. It
 * can't be intantiated.
 *
 *
 * Private Functions:
 *  . _convertToVinyl             encapsulates the data in a Vinyl file,
 *
 *
 * Public Static Methods:
 *  . getStream                   returns the created Transform Stream,
 *  . push                        inserts the generated output in a Gulp stream,
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
const stream        = require('stream')
    , { Transform } = require('stream')
    , Vinyl         = require('vinyl')
    ;


// -- Local modules


// -- Local constants


// -- Local variables


// -- Private Functions --------------------------------------------------------

/**
 * Encapsulates the data in a Vinyl file.
 * (the goal is to be captured by a Gulp stream)
 *
 * @function (arg1, arg2)
 * @private
 * @param {String}        the input file,
 * @returns {}            -,
 * @since 0.0.0,
 */
/* eslint-disable no-param-reassign */
function _convertToVinyl(app, transformStream) {
  /**
   * Overloads the _transform stream method.
   *
   * @method (arg1, arg2, arg3)
   * @public
   * @param {Object}        Gulp Stream Object,
   * @param {String}        type of stream encoding (String or Buffer),
   * @param {function}      function to call at completion.
   * @returns {}            -,
   * @since 0.0.0,
   */
  transformStream._transform = function(file, encoding, callback) {
    const vfile = new Vinyl(app);
    vfile.contents = Buffer.from(file, 'utf8');
    vfile.path = app;
    callback(null, vfile);
  };

  // return the new transform stream object:
  return transformStream;
}
/* eslint-enable no-param-reassign */


// -- Public -------------------------------------------------------------------

module.exports = {

  /**
   * Returns the created Transform Stream.
   *
   * @method ()
   * @public
   * @param {}              -,
   * @returns {}            returns the transform stream object,
   * @since 0.0.0,
   */
  getStream() {
    this.transformStream = new Transform({ objectMode: true });
    return this.transformStream;
  },

  /**
   * Inserts the generated output in a Gulp stream.
   *
   * @method (arg1, arg2)
   * @public
   * @param {String}        the input file,
   * @returns {Object}      returns this,
   * @since 0.0.0,
   */
  push(app, buffer) {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(_convertToVinyl(app, this.transformStream));
    return this;
  },
};

/* - */
