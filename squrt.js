window.onload = init;
var context;
var bufferLoader;

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}


function init() {
  // Fix up prefixing
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();

  bufferLoader = new BufferLoader(
    context,
    [
      'amen.mp3',
    ],
    chopAndPlay
    );

  bufferLoader.load();
}

var sources = [];
var offsetTimes = [];
var loop = {};
var NUM_SLICES = 16;

function createSources(bufferList) {
	for (var i = 0; i < NUM_SLICES; i++) {
		var source = context.createBufferSource();
		source.buffer = bufferList[0];
		source.connect(context.destination);
		sources[i] = source;
	}
}

function setOffsetTimes(bufferList) {
	var sliceDuration = bufferList[0].duration / NUM_SLICES

	for (var i = 0; i < NUM_SLICES; i++) {
		offsetTimes.push(i * sliceDuration);
	}

	var KICK_1 = offsetTimes[0];
	var CYMBAL_KICK = offsetTimes[2];
	var SNARE_1 = offsetTimes[4];
	var SNARE_2 = offsetTimes[12];
	var CYMBAL_1 = offsetTimes[6];
	var CYMBAL_2 = offsetTimes[8];
	var CYMBAL_3 = offsetTimes[14];

	for (var i in offsetTimes) {
		loop[i] = offsetTimes[i];
	}

	loop[0] = CYMBAL_KICK;
	loop[2] = CYMBAL_KICK;
	loop[4] = SNARE_1;
	loop[6] = KICK_1;
	loop[8] = CYMBAL_KICK;
	loop[10] = CYMBAL_KICK;
	loop[12] = SNARE_2;
}

function play(bufferList) {
	var sliceDuration = bufferList[0].duration / NUM_SLICES

	createSources(bufferList);
	for (var i in sources) {
		setTimeout(function(sources, i) {
			var source = sources[i];
			var offsetTime = i * sliceDuration;
			source.start(0, loop[i], sliceDuration);
		}.bind(null, sources, i), i * sliceDuration * 1000);
	}
}

function chopAndPlay(bufferList) {

	var sliceDuration = bufferList[0].duration / NUM_SLICES

	setOffsetTimes(bufferList);

	play(bufferList);

	setInterval(function() {
		play(bufferList);
	}, 16 * sliceDuration * 1000);

}
