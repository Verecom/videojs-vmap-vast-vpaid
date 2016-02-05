'use strict';

describe('VMAP Error', function(){
  var VMAPError = require('ads/vmap/VMAPError');
  var expect = require('chai').expect;

  var errorMsg = "There is no ad break";
  var errorCode = 404;
  var vmapError = new VMAPError(errorMsg, errorCode);

  it("error message should be set correctly", function(){
    expect(vmapError.message).to.eql('VMAP Error: '+ errorMsg);
  });

  it("error code should be set correctly", function(){
    expect(vmapError.code).to.eql(errorCode);
  });

});