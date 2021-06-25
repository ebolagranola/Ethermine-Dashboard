const {app, BrowserWindow} = require('electron');
const {ipcMain} = require('electron');

function createWindow() {
  let win = new BrowserWindow({
    width: 1180,
    height: 925,
    'minWidth': 1180,
    'minHeight': 925,
    'maxWidth': 1180,
    'maxHeight': 925,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // win.webContents.openDevTools();
  win.setMenu(null);
  win.loadFile('./src/views/index.html');
}

ipcMain.on('create-new-instance',()=>{
  createWindow();
})

app.whenReady().then(createWindow);
