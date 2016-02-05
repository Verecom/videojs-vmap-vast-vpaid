'use strict';

var chai = require("chai");
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
var expect = chai.expect();
chai.use(sinonChai);
require('mocha-sinon');
var VMAPClient = require('ads/vmap/VMAPClient');
var vmapSample = require('./vmapSample');

var vmapClient = new VMAPClient();

describe("VMAPClient", function(){

  describe("#_requestVMAP", function(){
    var xhr, requests, callback;
    beforeEach(function(){
      xhr = sinon.useFakeXMLHttpRequest();
      requests = [];
      xhr.onCreate = function (req) { requests.push(req); };
      callback = sinon.spy();
    });
    context("adTagUrl is a string", function(){
      beforeEach(function(){
        vmapClient._requestVMAP("http://fake.url", callback);
      });
      it("should make http call", function(){
        expect(requests.length).to.eqls(1);
      });
    });
  });

  describe("#_parseVMAP", function(){
    context("valid vmap xml", function(){
      var callback, emptyVMAPXml;
      before(function(){
        emptyVMAPXml = '<vmap:VMAP xmlns:vmap="http://www.iab.net/vmap-1.0" version="1.0"><a>hello</a></vmap:VMAP>';
        callback = sinon.spy();
        vmapClient._parseVMAP(emptyVMAPXml, callback);
      });

      it("should call callback once", function(){
        expect(callback).to.have.been.calledOnce;
      });

      it("callback should be call with first arg null", function(){
        expect(callback).to.have.been.calledWith(null);
      });
    });

    context("invalid xml", function(){
      it("should throw error", function(){
        var callback = sinon.spy();
        vmapClient._parseVMAP("<vast></vast>", callback);
        expect(callback).not.to.have.been.calledWith(null);
      });
    });
  });

  describe("#buildAdBreakTimeLine", function(){
    var callback;
    beforeEach(function(){
      callback = sinon.spy();
    });

    context("no ad break", function(){
      it("should return error", function(done){
        vmapClient._parseVMAP(vmapSample.EMPTY, function(error, xmlDom){
          vmapClient.buildAdBreakTimeLine(xmlDom, callback);
          expect(callback).to.have.been.calledWith(new Error('No ad breaks'));
          done();
        });
      });
    });

    context("with ad break", function(){
      it("should contain at least 3 ad breaks", function(done){
        vmapClient._parseVMAP(vmapSample.FULL, function(error, xmlDom){
          vmapClient.buildAdBreakTimeLine(xmlDom, callback);
          expect(callback.args[0].length).to.eql(2);
          expect(callback.args[0][0]).to.eql(null);
          expect(callback.args[0][1]).to.be.an.instanceof(Object);
          expect(Object.keys(callback.args[0][1])).to.have.length.above(3);
          done();
        });
      });
    });

  });
});