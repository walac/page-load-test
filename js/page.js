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
  var loc = window.location;
  return loc.protocol + "//" + loc.hostname + loc.pathname
          + "?url="
          + $("#url").val()
          + "&nsamples="
          + $("#nsamples").val()
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

function getAverageTimeout(samples, numberOfSamples) {
  "use strict";
  var timeouts = samplesToTimeouts(samples.slice(samples.length - numberOfSamples));
  return timeouts.reduce(function(a, b) { return a + b; }) / timeouts.length;
}

function onClick() {
  window.open(getCompleteUrl() + "&run=1");
}

function onLoad() {
  var url = getParameter("url");
  var nsamples = getParameter("nsamples");
  var timeout = getParameter("timeout");
  var tolerance = getParameter("tolerance");
  var run = getParameter("run");

  if (url) {
    $("#url").val(url);
  }

  if (nsamples) {
    $("#nsamples").val(nsamples);
  }

  if (timeout) {
    $("#timeout").val(timeout);
  }

  if (tolerance) {
    $("#rtol").val(tolerance);
    $("#itol").val(tolerance);
  }

  if (run) {
    getDelaySamples();
  }
}

function getDelaySamples() {
  "use strict";
  var N_SAMPLES = parseInt($("#nsamples").val());
  var TIMEOUT_VALUE = parseInt($("#timeout").val());
  var TOLERANCE = parseInt($("#itol").val());
  var MAXIMUM_TIMEOUT = TIMEOUT_VALUE * (1 + TOLERANCE/100);
  var samples = [];

  var startPoint = performance.now();
  samples.push(0);

  var callback = function() {
    samples.push(performance.now() - startPoint);
    if (samples.length >= N_SAMPLES && getAverageTimeout(samples, N_SAMPLES) <= MAXIMUM_TIMEOUT) {
      var marker = samples.length - N_SAMPLES;
      var timeouts = samplesToTimeouts(samples);
      var data = [];

      window.opener.close();
      samples = samples.slice(1);

      for (var i = 0; i < samples.length; ++i) {
        data.push({"x": i, "timeout": Math.abs(timeouts[i] - TIMEOUT_VALUE)});
      }

      MG.data_graphic({
        title: "Page load timings",
        data: data,
        width: 1000,
        height: 600,
        target: "#plot",
        min_x: 0,
        max_x: samples.length * 1.2,
        min_y: 0,
        max_y: Math.max.apply(null, timeouts) * 1.2,
        x_accessor: "x",
        y_accessor: "timeout",
        yax_format: function(v){return v + "ms";},
        markers: [{"x": marker, "label": samples[marker].toFixed(2) + "ms"}],
      });

      var link = document.getElementById("link");

      link.href = getCompleteUrl();

      link.innerText = link.href;
    } else {
      setTimeout(callback, TIMEOUT_VALUE);
    }
  }

  window.opener.location.href = $("#url").val();
  setTimeout(callback, TIMEOUT_VALUE);
}
