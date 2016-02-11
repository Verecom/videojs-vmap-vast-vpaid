'use strict';
var VMAP = require('vmap');
var chai = require("chai");
var sinon = require('sinon');
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);
require('mocha-sinon');
var vmapSample = require('../ads/vmap/vmapSample');
var VMAPEvent = require('ads/vmap/VMAPEvent');
var VMAPClient = require('ads/vmap/VMAPClient');
var dom = require('utils/dom');
var videoJsVersion = parseInt(videojs.VERSION.split('.')[0], 10);

if(videoJsVersion === 4) {
  require('videojs_4.vmap');
}
if(videoJsVersion === 5) {
  require('videojs_5.vmap');
}

describe("videojs vmap plugin", function(){
  var testDiv, videoEl, player;
  beforeEach(function () {
    window.iPhone = false;
    testDiv = document.createElement("div");
    document.body.appendChild(testDiv);
    videoEl = document.createElement('video');
    player = videojs(videoEl, {});
    videoEl.id = 'testVideoElm';
    testDiv.appendChild(videoEl);
  });

  afterEach(function () {
    dom.remove(testDiv);
  });

  it("vmapClient plugin should be registered", function(){
    expect(player.vmapClient).not.to.be.undefined;
  });

  context("trackAdError", function(){
    it("should trigger event when error happens", function(){
      var spy = sinon.spy();
      var error = new Error("something wrong");
      var functionCluster = player.vmapClient({_unitTest: true , adTagUrl: function(){return "http://fake.url";}});
      player.on(VMAPEvent.CONFIG_ERROR, spy);
      functionCluster.trackAdError(VMAPEvent.CONFIG_ERROR, error);
      expect(spy).to.be.calledOnce;
    });
  });

  context("vmap config error", function(){
    it("should cause error if adTagUrl and adTagXML are both absent", function(){
      var spy = sinon.spy();
      player.on(VMAPEvent.CONFIG_ERROR, spy);
      player.vmapClient();
      expect(spy).to.be.called;
    });

    it("should not cause error if adTagUrl is a string", function(){
      var spy = sinon.spy();
      player.on(VMAPEvent.CONFIG_ERROR, spy);
      player.vmapClient({adTagUrl: "http://fake.url"});
      expect(spy).not.to.be.called;
    });

    it("should not cause error if adTagUrl is a function", function(){
      var spy = sinon.spy();
      player.on(VMAPEvent.CONFIG_ERROR, spy);
      player.vmapClient({adTagUrl: function(){return "http://fake.url";}});
      expect(spy).not.to.be.called;
    });

    it("should cause error if adTagXML is not a function", function(){
      var spy = sinon.spy();
      player.on(VMAPEvent.CONFIG_ERROR, spy);
      player.vmapClient({adTagXML: "<vmap></vmap>"});
      expect(spy).to.be.called;
    });

    it("should not cause error if adTagXML is a function", function(){
      var spy = sinon.spy();
      player.on(VMAPEvent.CONFIG_ERROR, spy);
      player.vmapClient({adTagXML: function(){return "<vmap></vmap>";}});
      expect(spy).not.to.be.called;
    });
  });

  context("getVMAPResponse", function(){

    it("should return a parsed vmap object when specify adTagXML", function(done){
      var spy = sinon.spy();
      var vmapClient = player.vmapClient({
        _unitTest: true, 
        adTagXML: function(callback){
          callback(null, vmapSample.FULL);
        }
      });
      vmapClient.getVMAPResponse(spy);
      setTimeout(function(){
        expect(spy).to.be.called;
        expect(spy.args[0][0]).to.be.null;
        expect(spy.args[0][1]).to.be.an.instanceof(VMAP);
        done();
      }, 1000)
    });
  });

  context("transformAdBreakTimeOffsets", function(){
    it("should transform time offset to time", function(){
      var vmapClient = player.vmapClient({_unitTest: true, adTagUrl: 'http://fake.url'});
      var vmapStub = new VMAPClient();
      vmapStub.adBreaksDict = {
        "start": {}, "50%": {}, "00:00:08.123":{}, "00:00:10":{}
      }
      vmapClient.setVmapClient(vmapStub);
      var timeOffsets = vmapClient.transformAdBreakTimeOffsets(30);
      expect(timeOffsets).to.contain.all.keys(['8', '10', '15']);
    });
  });

  describe("getVastAdTagSource", function(){
    var vmapClient;
    before(function(){
      vmapClient = player.vmapClient({_unitTest: true, adTagUrl: 'http://fake.url'});
    })

    context("adSource adTagURI is specify", function(){
      var adSource;
      beforeEach(function(){
        adSource = {adTagURI: 
          {template: 'vast', uri: 'http://fake.url'}
        };
      });
      it("should set adTagUrl as a function", function(){
        var adTagSource = vmapClient.getVastAdTagSource(adSource);
        expect(adTagSource.adTagUrl).not.to.be.null;
      });
    });

    context("adSource vastAdData is specify", function(){
      it("should set adTagXML", function(){
        var adSource = {vastAdData: '<vast></vast>'};
        var adTagSource = vmapClient.getVastAdTagSource(adSource);
        expect(adTagSource.adTagUrl).to.be.null;
        expect(adTagSource.adTagXML).to.be.an.instanceof(Function);
      })
    });
  });
});