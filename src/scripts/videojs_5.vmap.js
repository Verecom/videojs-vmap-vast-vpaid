'use strict';

require('./plugin/components/ads-label_5');
require('./plugin/components/black-poster_5');

var videoJsVAST = require('./plugin/videojs.vast.vpaid');

videojs.plugin('vastClient', videoJsVAST);

var videoJsVMAP = require('./plugin/videojs.vmap');

videojs.plugin('vmapClient', videoJsVMAP);