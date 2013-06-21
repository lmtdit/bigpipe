'use strict';

/**
 * Portal is a unversal wrapper for real-time frameworks that provides a common
 * interface for server and client interaction.
 *
 * @constructor
 * @param {HTTP.Server} server HTTP or HTTPS server instance.
 * @param {Object} options Configuration
 * @api public
 */
function Portal(server, options) {
  options = options || {};

  this.transporter = null;
  this.encoder = null;
  this.decoder = null;

  this.server = server;
  this.parsers(options.parser);
  this.pathname = options.pathname || '/portal';
  this.initialiase(options.transport);
}

//
// Lazy read the Portal.js JavaScript client.
//
Object.defineProperty(Portal.prototype, 'client', {
  get: function read() {
    return require('fs').readFileSync('./portal.js', 'utf-8');
  }
});

//
// Expose the current version number.
//
Portal.prototype.version = require('./package.json');

/**
 * Initialise the real-time transport that was choosen.
 *
 * @param {String} transport The name of the transport
 * @api private
 */
Portal.prototype.initialise = function initialise(transport) {
  this.transporter = require('./transporters/'+ (transport || 'ws').toLowerCase());
  this.transporter.using(this);
};

/**
 * Install message parsers.
 *
 * @param {String} type Parse name.
 * @api private
 */
Portal.prototype.parsers = function parsers(type) {
  var parser = require('./parsers/'+ (type || 'json').toLowerCase());

  this.encoder = parser.encoder;
  this.decoder = parser.decoder;
};

/**
 * Generate a front-end library.
 *
 * @param {Function} fn Completion callback.
 * @api public
 */
Portal.prototype.library = function library(fn) {
  var encoder = this.encoder.client || this.encoder
    , decoder = this.decoder.client || this.decoder
    , transport = this.transporter.client
    , client = this.client;

  //
  // Replace some basic content.
  //
  client = client
    .replace('= null; // @import {portal::transport}', transport.toString())
    .replace('= null; // @import {portal::encoder}', encoder.toString())
    .replace('= null; // @import {portal::decoder}', decoder.toString())
    .replace('= null; // @import {portal::version}', '"'+ this.version +'"');

  fn(undefined, client);
};