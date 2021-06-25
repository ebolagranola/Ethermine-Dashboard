var {ipcRenderer} = require('electron');

// Creates a new window
function newWindowInstance() {
  ipcRenderer.send('create-new-instance');
};

// Save the notes to json
function delay(callback, ms) {
  var timer = 0;
  return function() {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      callback.apply(context, args);
    }, ms || 0);
  };
}
