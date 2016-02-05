var async = require('async');
var utilities = require('../utils/utilityFunctions');
var VMAPError = require('../ads/vmap/VMAPError');
var VMAPEvent = require('../ads/vmap/VMAPEvent');
var VMAPClient = require('../ads/vmap/VMAPClient');

module.exports = function VMAPPlugin(options) {
  var player = this;
  var vmap = new VMAPClient();
  var defaultOpts = {
    //request adTagUrl timeout 
    timeout: 500
  };
  var settings = utilities.extend({}, defaultOpts, options || {});

  if(utilities.isUndefined(settings.adTagUrl) && utilities.isDefined(settings.url)){
    settings.adTagUrl = settings.url;
  }

  if (utilities.isString(settings.adTagUrl)) {
    settings.adTagUrl = utilities.echoFn(settings.adTagUrl);
  }

  if (utilities.isDefined(settings.adTagXML) && !utilities.isFunction(settings.adTagXML)) {
    return trackAdError(VMAPEvent.CONFIG_ERROR, new VMAPError('on VideoJS VAST plugin, the passed adTagXML option does not contain a function'));
  }

  if (!utilities.isDefined(settings.adTagUrl) && !utilities.isFunction(settings.adTagXML)) {
    return trackAdError(VMAPEvent.CONFIG_ERROR, new VMAPError('on VideoJS VAST plugin, missing adTagUrl on options object'));
  }

  async.waterfall([
    getVMAPResponse,
    buildAdBreakTimeLine, 
    touchPlayerEvents
    ], function(error, result){
      if (error) trackAdError(VMAPEvent.OTHER_ERROR, error);
      console.log(result);
    }
  );

  function getVMAPResponse(callback){
    vmap.getResponse(settings.adTagUrl, callback);
  }

  function touchPlayerEvents(callback){
    player.on('loadedmetadata', loadedmetadataEventHandler);
    player.on('timeupdate', timeupdateEventHnadler);
    callback(null);
  }

  function loadedmetadataEventHandler(){

  }

  function timeupdateEventHnadler(){

  }

  function buildAdBreakTimeLine(vmapObj, callback){
    vmap.buildAdBreakTimeLine(vmapObj, callback);
  }

  function trackAdError(type, error, vmapResponse) {
    player.trigger({type: type, error: error});
    if (console && console.log) {
      console.log('AD ERROR:', error.message, error, vmapResponse);
    }
  }
  
};