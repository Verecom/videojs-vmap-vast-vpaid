'use strict';

require('./plugin/components/ads-label_4');
require('./plugin/components/black-poster_4');

var videoJsVAST = require('./plugin/videojs.vast.vpaid');

videojs.plugin('vastClient', videoJsVAST);

var videoJsVMAP = require('./plugin/videojs.vmap');

videojs.plugin('vmapClient', videoJsVMAP);