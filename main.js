const {app, BrowserWindow, ipcMain, Menu} = require('electron');
const path = require('path');
const fs = require('fs');


const menuTemplate = [
  {
    label: ' document ',
    submenu: [
      { 
        label: 'new', 
        accelerator: 'CmdOrCtrl+N', 
        click: function() {
          mainWindow.webContents.send('action', 'new') 
        } 
      },
      { 
        label: 'Open', 
        accelerator: 'CmdOrCtrl+O', 
        click: function() {
          mainWindow.webContents.send('action', 'open') 
        } 
      },
      { 
        label: 'keep', 
        accelerator: 'CmdOrCtrl+S', 
        click: function() {
          mainWindow.webContents.send('action', 'save') 
        } 
      },
      { 
        label: 'Save as...  ', 
        accelerator: 'CmdOrCtrl+Shift+S', 
        click: function() {
          mainWindow.webContents.send('action', 'save-as') 
        } 
      },
      { 
        type: 'separator' 
      },
      {
        label: 'quit',
        click: function() {
          mainWindow.webContents.send('action', 'exit') 
        }
      }
    ]
  },
  {
    label: ' edit ',
    submenu: [
      { label: 'return', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
      { label: 'redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
      { type: 'separator' }, 
      { label: 'cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
      { label: 'copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
      { label: 'paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      { label: 'delete', accelerator: 'CmdOrCtrl+D', role: 'delete' },
      { type: 'separator' },
      { label: 'selectall', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
      { label: 'DevTools', accelerator: 'CmdOrCtrl+I', 
          click: function() {
            mainWindow.webContents.openDevTools();
        }
      },
      { accelerator: 'CmdOrCtrl+R', role: 'reload' }
    ]
  }
];

let mainWindow;
let safeExit = false;


let menu = Menu.buildFromTemplate (menuTemplate);
Menu.setApplicationMenu (menu);

var data = fs.readFileSync('./data.json');
var myData = JSON.parse(data);

function createWindow() {
  mainWindow = new BrowserWindow({
    x: myData.positionX,
    y: myData.positionY,
    width: myData.width,
    height: myData.height,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('close', (e) => {
    if(!safeExit) {
      e.preventDefault();
    }
    mainWindow.webContents.send('action', 'exit');
  });
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', function() {
  if (mainWindow === null) createWindow();
});



ipcMain.on('reqaction', (event, arg) => {
  switch(arg) {
    case 'exit': 
      safeExit = true;
      app.quit();
      break;
    case 'win-min': 
      mainWindow.minimize();
      break;
    case 'win-max': 
      if(mainWindow.isMaximized()) {
        mainWindow.restore();  
      } else {
        mainWindow.maximize(); 
      }
      break;
  }
});