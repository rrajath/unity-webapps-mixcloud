// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
// ==UserScript==
// @include       http://mixcloud.com/*
// @require       utils.js
// ==/UserScript==

/* Testing URL:
 * http://www.youtube.com/watch?v=v1TsCud9QhU&feature=autoplay&list=PLDA83A73D581CEFCC&lf=plpp_play_all&playnext=120
 */

 var Unity = external.getUnityObject(1);
 window.Unity = Unity;

 function isCorrectPage() {
/*    var i, ids = ['page', 'footer-container'];

    for (i = 0; i < ids.length; i++) {
        if (!document.getElementById(ids[i])) {
            return false;
        }
    }
    */
    return true;
  }

  function setLauncherCount() {
    var upload_notif_count = document.evaluate('//*[@id=\"js-upload-notifications-count\"]', document, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;
    var your_mixcloud_notif_count = document.evaluate('//*[@id=\"js-notifications-count\"]', document, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue.innerHTML;

    var total_notif_count = Number(upload_notif_count) + Number(your_mixcloud_notif_count);
    Unity.Launcher.setCount(Number(total_notif_count));
  }

  function changeState(dryRun) {
    var playButton = document.evaluate('//span[@class=\"cc-play-button\"]',
     document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    var pauseButton = document.evaluate('//span[@class=\"cc-pause-button\"]',
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

//    var paused = playButton.data-eventstream.play !== 'none';
    var paused = document.evaluate('//span[@id=\"player-play\"]/@class',
     document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent !== 'playing';

    if (!dryRun) {
      if (paused) {
        launchClickEvent(playButton);
      } else {
        launchClickEvent(pauseButton);
      }
    }

    if (!paused) {
      Unity.MediaPlayer.setPlaybackState(Unity.MediaPlayer.PlaybackState.PLAYING);
    } else {
      Unity.MediaPlayer.setPlaybackState(Unity.MediaPlayer.PlaybackState.PAUSED);
    }
  }

  function getTrackInfo() {
    var title = null;
    var artLocation = null;
    var album = null;
    var artist = null;
    try {
/*      artLocation = document.evaluate('//li[@class=\"cloudcast-now-playing\"]/@style',
        document, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue.textContent;*/
        artLocation = document.evaluate('//img[@id=\"cloudcast-image\"]/@src',
          document, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue.textContent;
      // //images-mix.netdna-ssl.com/w/300/h/300/q/85/upload/images/extaudio/9a5e19a7-6389-4a4b-b75c-0e41784dc962.jpg
      artLocation = 'http://' + artLocation.substring(('//').length);
      
      title = document.evaluate('//h1[@id="cloudcast-name"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;
      album = null;
      artist = document.evaluate('//a[@id="cloudcast-owner-link"]',
        document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.textContent;
    } catch (x) {}

if (!artist) {
  return null;
}

return {
  title: title,
  album: album,
  artist: artist,
  artLocation: artLocation
};
}

function musicPlayerSetup() {

  Unity.MediaPlayer.init('mixcloud.com');
  Unity.MediaPlayer.setCanGoPrevious(false);

  setInterval(wrapCallback(function retry() {
    var trackInfo = getTrackInfo(), i;

    if (trackInfo) {
      Unity.MediaPlayer.setTrack(trackInfo);
    }
    changeState(true);

    }), 1000);

  Unity.MediaPlayer.onPlayPause(wrapCallback(function () {
    changeState(false);
  }));

  Unity.MediaPlayer.onNext(wrapCallback(function () {
    var node = document.evaluate('//li[@data-p-ref="up_next"]',
     document,
     null,
     XPathResult.FIRST_ORDERED_NODE_TYPE,
     null)
    .singleNodeValue;
    launchClickEvent(node);
  }));

  setInterval(wrapCallback(setLauncherCount), 5000);
  setLauncherCount();

  Unity.Launcher.addAction(_("Play"), playSong);
}

if (isCorrectPage()) {
  Unity.init({ name: "MixCloud",
   domain: 'mixcloud.com',
   homepage: 'http://www.mixcloud.com',
   iconUrl: "icon://mixcloud",
   onInit: musicPlayerSetup });
}