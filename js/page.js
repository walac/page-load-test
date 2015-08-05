function frameLoad() {
  "use strict";
  var SAMPLES_LENGTH = 20;
  var TIMEOUT_VALUE = 5;
  var MAXIMUM_TIMEOUT = TIMEOUT_VALUE * 1.1;
  var stamps = [];
  
  function callback() {
    stamps.push(performance.now());

    if (stamps.length >= SAMPLES_LENGTH) {
      var timeouts = stamps.slice(stamps.length - SAMPLES_LENGTH);

      for (var i = 1; i < timeouts.length; ++i) {
        timeouts[i-1] = timeouts[i] - timeouts[i-1];
      }

      timeouts.pop();

      var averageTimeout = timeouts.reduce(function(a, b) { return a + b; }) / SAMPLES_LENGTH;
      if (averageTimeout <= MAXIMUM_TIMEOUT) {
        window.top.postMessage(stamps[0], '*');
        return;
      }
    }

    setTimeout(callback, TIMEOUT_VALUE);
  }

  setTimeout(callback, TIMEOUT_VALUE);
}

function getDelaySamples() {
  "use strict";
  var N_SAMPLES = 20;

  var count = N_SAMPLES;
  var samples = [];
  var frame = document.getElementById("myframe");

  window.onmessage = function(e) {
    samples.push({"loadTime": parseInt(e.data), "x": N_SAMPLES - count});
    if (--count) {
      frame.src += ''; // reload the frame
    } else {
      MG.data_graphic({
        title: "Page load timings",
        data: samples,
        width: 750,
        height: 150,
        target: "#plot",
        min_x: 0,
        max_x: N_SAMPLES,
        min_y: 0,
        max_y: Math.max.apply(null, samples.map(function(el) { return el.loadTime; })) * 1.1,
        x_accessor: "x",
        y_accessor: "loadTime"
      });
    }
  }
}
