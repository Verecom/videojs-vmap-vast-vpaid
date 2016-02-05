'use strict';

function VMAPError(message, code) {
  this.message = 'VMAP Error: ' + (message || '');
  if (code) {
    this.code = code;
  }
}

VMAPError.prototype = new Error();
VMAPError.prototype.name = "VMAP Error";

module.exports = VMAPError;