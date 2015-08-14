(function() {
  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function(predicate) {
      if (this === null) {
        throw new TypeError('Array.prototype.findIndex called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return i;
        }
      }
      return -1;
    };
  }
})();

function getParameter(theParameter) {
  "use strict";
  var params = window.location.search.substr(1).split('&');

  for (var i = 0; i < params.length; i++) {
    var p=params[i].split('=');
    if (p[0] == theParameter) {
      return decodeURIComponent(p[1]);
    }
  }
  return false;
}

function getCompleteUrl() {
  "use strict";
  var loc = window.location;
  return loc.protocol + "//" + loc.hostname + loc.pathname
          + "?url="
          + $("#url").val()
          + "&timeout="
          + $("#timeout").val()
          + "&tolerance="
          + $("#itol").val();
}

function samplesToTimeouts(samples) {
  "use strict";
  var timeouts = samples.slice();
  for (var i = 1; i < timeouts.length; ++i) {
    timeouts[i-1] = timeouts[i] - timeouts[i-1];
  }
  timeouts.pop();
  return timeouts;
}

function average(myData) {
  "use strict";
  return myData.reduce(function(a, b) { return a + b; }) / myData.length;
}

function movingAverage(values, windowSize) {
  var side = Math.floor(windowSize/2);
  var newValues = values.slice();
  var i;
  var j;
  var s;

  for (i = 1; i <= side; ++i) {
    s = 0;

    for(j = i-1; j >= 0; --j) {
      s += newValues[j] + newValues[i+j+1];
    }

    newValues[i] = (s + newValues[i]) / (2 * i + 1);
  }

  for (i = side+1; i < newValues.length; ++i) {
    newValues[i] = newValues[i-1] + (newValues[Math.min(i+side, newValues.length-1)] - newValues[i-side-1]) / windowSize;
  }

  return newValues;
}

function findPageLoadedPoint(samples) {
  "use strict";

  var timeouts = samplesToTimeouts(samples);
  var avg = average(timeouts) * 1.5;
  var filtered = movingAverage(timeouts, 23).map(function(v) {return v >= avg;});
  filtered.reverse();

  var mark = filtered.length - 1 - filtered.findIndex(function(val) {return val;});

  if (mark >= filtered.length) {
    mark = filtered.length - 1;
  }

  return mark;
}

function getAverageTimeout(samples, numberOfSamples) {
  "use strict";
  var timeouts = samplesToTimeouts(samples.slice(samples.length - numberOfSamples));
  return average(timeouts);
}

function samplesToData(samples, timeoutValue) {
  var data = [];
  for (var i = 1; i < samples.length; ++i) {
    var jankFactor = Math.abs(samples[i] - samples[i-1] - timeoutValue) / timeoutValue;
    var responsiveness = (1 / (1 + jankFactor)) * 100;
    data.push({
      "x": samples[i],
      "y": responsiveness
    });
  }
  return data;
}

function processSamples(timeoutValue, samples) {

  var mark  = findPageLoadedPoint(samples);
  var data = samplesToData(samples, timeoutValue);

  MG.data_graphic({
    title: "Page load responsiness",
    data: data,
    width: 1000,
    height: 600,
    target: "#plot",
    min_x: 0,
    min_y: 0,
    max_x: samples[samples.length-1],
    max_y: Math.max.apply(null, data.map(function(v) {return v.y;})) * 1.2,
    x_accessor: "x",
    y_accessor: "y",
    xax_format: function(x) {return parseInt(x);},
    x_label: "Time (ms)",
    y_label: "Responsiveness (%)",
    interpolate: "linear",
    markers: [{"x": data[mark].x, "label": parseInt(data[mark].x) + "ms"}]
  });
}

function getSamples(numberOfLastAvgSamples, timeoutValue, tolerance, callback) {
  "use strict";
  var maximumTimeout = timeoutValue * (1 + tolerance/100);
  var startPoint = performance.now();
  var samples = [0];

  function timeoutCallback() {
    samples.push(performance.now() - startPoint);
    if (samples[samples.length-1] >= 3000) {
      callback(samples);
    } else {
      setTimeout(timeoutCallback, timeoutValue);
    }
  }

  setTimeout(timeoutCallback, timeoutValue);
}

function startPageSampling() {
  "use strict";
  var timeoutValue = parseInt($("#timeout").val());
  var tolerance = parseInt($("#itol").val());

  $("#plot").html("");

  getSamples(
    20,
    timeoutValue,
    tolerance,
    function(samples) {
      if (window.opener && getParameter("run")) {
        window.opener.close();
      }

      processSamples(timeoutValue, samples);
    });
}

function onClick() {
  if ($('input[name="open-method"]:checked').val() == "window") {
    window.open(getCompleteUrl() + "&run=1");
  } else {
    $("#content-frame").attr('src', $("#url").val());
    startPageSampling();
  }
}

function onLoad() {
  var url = getParameter("url");
  var timeout = getParameter("timeout");
  var tolerance = getParameter("tolerance");
  var run = getParameter("run");

  if (url) {
    $("#url").val(url);
  }

  if (timeout) {
    $("#timeout").val(timeout);
  }

  if (tolerance) {
    $("#rtol").val(tolerance);
    $("#itol").val(tolerance);
  }

  if (run) {
    window.opener.location.href = $("#url").val();
    startPageSampling();
  }
}

