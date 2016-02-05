var async = require('async');
var VMAP = require('vmap');
var XmlParser = require('xmldom').DOMParser;
var http = require('../../utils/http').http;
var utilities = require('../../utils/utilityFunctions');
var VMAPError = require('./VMAPError');

function VMAPClient(){
  this.adBreaksDict = {};
}

VMAPClient.prototype._requestVMAP = function(adTagUrl, callback){
  try {
    if (utilities.isFunction(adTagUrl)) {
      adTagUrl(requestHandler);
    } else {
      http.get(adTagUrl, requestHandler, {
        withCredentials: true
      });
    }
  } catch (e) {
    callback(e);
  }

  function requestHandler(error, response, status) {
    if (error) {
      var errMsg = utilities.isDefined(status) ?
      "on VMAPClient.requestVMAPXML, HTTP request error with status '" + status + "'" :
        "on VMAPClient.requestVMAPXML, Error getting the the VMAP XML with he passed adTagXML fn";
      return callback(new VMAPError(errMsg, 301), null);
    }
    callback(null, response);
  }
};

VMAPClient.prototype._parseVMAP = function(xmlStr, callback){
  try{
    var xmlDoc = (typeof xmlStr == 'string') ? new XmlParser().parseFromString(xmlStr) : xmlStr;
    var vmap = new VMAP(xmlDoc);
    callback(null, vmap);
  }catch (e){
    callback(e);
  }
};

VMAPClient.prototype.getResponse = function(adTagUrl, callback){
  async.waterfall([
    function(cb){
      cb(null, adTagUrl, callback);
    },
    this._requestVMAP,
    this._parseVMAP
  ], callback);
};

VMAPClient.prototype.buildAdBreakTimeLine = function(vmapObj, callback){
  if (!vmapObj || !vmapObj.adBreaks || vmapObj.adBreaks.length === 0){
    callback(new Error('No ad breaks'));
  }else{
    var result = {};
    vmapObj.adBreaks.forEach(function(ele){
      result[ele.timeOffset] = ele;
    });
    this.adBreaksDict = result;
    callback(null, result);
  }
};

module.exports = VMAPClient;