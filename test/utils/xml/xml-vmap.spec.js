var expect = require('chai').expect;
var parseString = require('xml2js').parseString;
describe("VMAP XML", function(){
  var sampleVmapXmlString = '<vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0">' +
    '<vmap:AdBreak breakType="linear" breakId="myid" timeOffset="00:10:23.125">' +
      '<vmap:AdSource allowMultipleAds="true" followRedirects="true" id="2">' +
        '<vmap:VASTAdData>' +
          '<VAST version="3.0" xsi:noNamespaceSchemaLocation="vast.xsd">' +
            '...' +
          '</VAST>' +
        '</vmap:VASTAdData>' +
      '</vmap:AdSource>' +
      '<vmap:TrackingEvents>' +
        '<vmap:Tracking event="breakStart">' +//MyServer.com/breakstart.gif
        '</vmap:Tracking>' +
      '</vmap:TrackingEvents>' +
    '</vmap:AdBreak>' +
    '<vmap:AdBreak timeOffset="start" breakType="linear" breakId="preroll">' +
        '<vmap:AdSource id="preroll-ad" allowMultipleAds="false" followRedirects="true">' +
            '<AdTagURI templateType="vast3">' +
                '<![CDATA[preroll.xml]]>' +
            '</AdTagURI>' +
        '</vmap:AdSource>' +
    '</vmap:AdBreak>' +
    '<vmap:AdBreak timeOffset="50%" breakType="linear" breakId="midroll">' +
        '<vmap:AdSource id="overlay-1-ad" allowMultipleAds="false" followRedirects="true">' +
            '<AdTagURI templateType="vast3">' +
                '<![CDATA[midroll.xml]]>' +
            '</AdTagURI>' +
        '</vmap:AdSource>' +
    '</vmap:AdBreak>' +
    '<vmap:AdBreak timeOffset="end" breakType="linear" breakId="postroll">' +
        '<vmap:AdSource id="postroll-ad" allowMultipleAds="false" followRedirects="true">' +
            '<AdTagURI templateType="vast3">' +
                '<![CDATA[postroll.xml]]>' +
            '</AdTagURI>' +
        '</vmap:AdSource>' +
    '</vmap:AdBreak>' +
  '</vmap:VMAP>';
  
  it("version should be 1.0", function(){
    parseString(sampleVmapXmlString,function (err, result) {
      expect(result["vmap:VMAP"]["$"]["version"]).to.be.equal("1.0");
      //console.dir(result["vmap:VMAP"]["$"]["vmap:AdBreak"]);
    });
  });
});