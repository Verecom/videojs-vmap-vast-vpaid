var async = require('async');
var utilities = require('../utils/utilityFunctions');
var VMAPError = require('../ads/vmap/VMAPError');
var VMAPEvent = require('../ads/vmap/VMAPEvent');
var VMAPClient = require('../ads/vmap/VMAPClient');

module.exports = function VMAPPlugin(options) {
  var player = this;
  var vmap = new VMAPClient();
  var timeOffsets = {}; 
  var adBreakPlayRecord = {};
  var videoLength = 0;
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

  function run(){
    async.waterfall([
      getVMAPResponse,
      buildAdBreakTimeLine, 
      touchPlayerEvents
      ], function(error, result){
        if (error) trackAdError(VMAPEvent.OTHER_ERROR, error);
        console.log(result);
      }
    );
  }

  function getVMAPResponse(callback){
    vmap.getResponse(settings.adTagUrl ? settings.adTagUrl() : settings.adTagXML, callback);
  }

  function touchPlayerEvents(_ , callback){
    player.on('loadedmetadata', scheduleTimeOffsets); // loadedmetadata sometimes doesn't load video duration
    player.on('timeupdate', scheduleTimeOffsets);
    player.on('timeupdate', timeupdateEventHandler);
    if (vmap.adBreaksDict.hasOwnProperty("start")){
      initVastClient(vmap.adBreaksDict["start"]);
    }
    if (vmap.adBreaksDict.hasOwnProperty("end")){
      player.on("ended", playEndAdBreak);
    }
    callback(null);
  }

  function scheduleTimeOffsets(event){
    console.log(event.type);
    if (!isAdPlaying()){
      videoLength = player.duration();
      console.log(videoLength);
      var isProperTime = videoLength > 0;
      if (event.type === "timeupdate") 
        isProperTime =  isProperTime && player.currentTime() > 0;
      if (isProperTime) {
        timeOffsets = transformAdBreakTimeOffsets(videoLength);
        player.off('loadedmetadata', scheduleTimeOffsets);
        player.off('timeupdate', scheduleTimeOffsets);
        console.log(timeOffsets);
      }
    } 
    return timeOffsets;
  }

  function transformAdBreakTimeOffsets(videoLength){
    var timeOffsets = {};
    Object.keys(vmap.adBreaksDict).forEach(function(timeOffset){
      var secs;
      if (/^\d{2}:\d{2}:\d{2}(\.\d{1,3})?$/.test(timeOffset)){
        var components = timeOffset.split(':');
        secs = components[0]*3600 + components[1]*60 + parseInt(components[2]);
        timeOffsets[secs] = timeOffset;
      }else if (/^\d{1,3}%$/.test(timeOffset)){
        secs = (timeOffset.replace("%", '') * videoLength)/100;
        timeOffsets[secs] = timeOffset;
      }
    });
    return timeOffsets;
  }


  function timeupdateEventHandler(){
    var currentPlayerTime = player.currentTime();
    if(!isAdPlaying()){
      var adBreak = getAdBreak(currentPlayerTime);
      if (adBreak && !isAdBreakPlayed(adBreak)){
        console.log("adBreak", adBreak);
        playAd(adBreak);
      }
    }
  }

  function isAdBreakPlayed(adBreak){
    if (adBreakPlayRecord[adBreak.timeOffset] === true){
      return true;
    }else{
      return false;
    }
  }

  function isAdPlaying(){
    return player.vast && player.vast.adUnit;
  }

  function getAdBreak(currentPlayerTime){
    var keys = Object.keys(timeOffsets);
    for(var i = 0, len = keys.length; i < len; i++){
      if (Math.round(keys[i]) == Math.round(currentPlayerTime)){
        console.log("current player time: ", currentPlayerTime);
        console.log("adBreak time: ", Math.round(keys[i]));
        return vmap.adBreaksDict[timeOffsets[keys[i]]];
      }
    }
    return null;
  }

  function buildAdBreakTimeLine(vmapObj, callback){
    vmap.buildAdBreakTimeLine(vmapObj, callback);
  }

  function playAd(adBreak){
    if (!player.vast){
      initVastClient(adBreak);
    }
    if (!player.vast.adUnit && adBreak && adBreak.breakType === 'linear'){
      var adSource = adBreak.adSource;
      if (adSource){
        player.trigger("vast.reset");
        var vastAdTagSource = getVastAdTagSource(adSource);
        player.vast.resetSettings(vastAdTagSource);
        addAdBreakPlayRecord(adBreak, true);
        player.trigger('vast.playAd');
      }
    }
  }

  function playEndAdBreak(){
    var adBreak = vmap.adBreaksDict['end'];
    if (!isAdBreakPlayed(adBreak)){
      playAd(adBreak);
    }
  }

  function addAdBreakPlayRecord(adBreak, isPlayed){
    adBreakPlayRecord[adBreak.timeOffset] = isPlayed;
  }

  function getVastAdTagSource(adSource){
    var result = {};
    if (adSource.adTagURI){
       result = {
          adTagXML: function(){

          },
          adTagUrl: function(){
            return adSource.adTagURI.uri;
          }
        };
    }else if(adSource.vastAdData){
        result = {
          adTagXML: function(callback){
            callback(null, adSource.vastAdData); 
          },
          adTagUrl: null
        };
    }
    return result;
  }

  function initVastClient(adBreak){
    var vastAdTagSource = getVastAdTagSource(adBreak.adSource); 
    settings = utilities.extend({}, options || {}, vastAdTagSource);
    player.vastClient(settings);
  }

  function trackAdError(type, error, vmapResponse) {
    player.trigger({type: type, error: error});
    if (console && console.log) {
      console.log('AD ERROR:', error.message, error, vmapResponse);
    }
  }

// make it easy for unit test
  if (settings._unitTest !== true){
    run();
  }else{
    // for unit test, return all the function require test
    return {
      getVMAPResponse: getVMAPResponse,
      touchPlayerEvents: touchPlayerEvents,
      scheduleTimeOffsets: scheduleTimeOffsets,
      transformAdBreakTimeOffsets: transformAdBreakTimeOffsets,
      timeupdateEventHandler: timeupdateEventHandler,
      isAdBreakPlayed: isAdBreakPlayed,
      isAdPlaying: isAdPlaying,
      getAdBreak: getAdBreak,
      playAd: playAd,
      playEndAdBreak: playEndAdBreak,
      addAdBreakPlayRecord: addAdBreakPlayRecord,
      getVastAdTagSource: getVastAdTagSource,
      initVastClient: initVastClient,
      trackAdError: trackAdError,
      setVmapClient: function(vmapClient){
        vmap = vmapClient;
      }
    };
  }
  
};