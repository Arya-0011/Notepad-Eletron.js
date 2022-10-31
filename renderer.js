const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote; 
const Menu = remote.Menu; 
const dialog = remote.dialog;
const fs = require('fs'); 
const shell = require('electron').shell;



var data = fs.readFileSync('./data.json');
var myData = JSON.parse(data);
var themes = myData.theme;
if(themes == 'dark') {
    document.getElementById('theme_css').href = './styleDark.css';
} else {
    document.getElementById('theme_css').href = './style.css';
}
if(myData.isFull) {
    ipcRenderer.send('reqaction', 'win-max');
}


let isSave = true;
let txtEditor = document.getElementById('txtEditor');
let currentFile = null;
let isQuit = true;



const contextMenuTemplate = [
    { label: 'undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
    { label: 'redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
    { type: 'separator' },
    { label: 'cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
    { label: 'copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
    { label: 'paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
    { label: 'delete', accelerator: 'CmdOrCtrl+D', role: 'delete' },
    { type: 'separator' }, 
    { label: 'selectall', accelerator: 'CmdOrCtrl+A', role: 'selectall' },
    { type: 'separator' },
    { label: 'DevTools', accelerator: 'CmdOrCtrl+I', 
        click: function() {
            remote.getCurrentWindow().openDevTools();
      }
    },
    { accelerator: 'CmdOrCtrl+R', role: 'reload' }
];

const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
txtEditor.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    contextMenu.popup(remote.getCurrentWindow());
});


function winCtrlBtn(id) {
    switch(id) {
        case 'win_min': 
            ipcRenderer.send('reqaction', 'win-min');
            break;
        case 'win_max':
            ipcRenderer.send('reqaction', 'win-max');
            break;
        case 'win_close': 
            askSaveNeed(); 
            saveWinData(); 
            if(isQuit) { 
                ipcRenderer.sendSync('reqaction', 'exit');
            }
            isQuit = true; 
            break;
    }
}
window.onresize = function () {
    if(remote.getCurrentWindow().isMaximized()) {
        document.getElementById('win_max').style.background = "url(images/ctrl-btn.png) no-repeat 0 -60px";
    }else {
        document.getElementById('win_max').style.background = "url(images/ctrl-btn.png) no-repeat 0 -30px";
    }
}

txtEditor.oninput = (e) => {
    if (isSave) {
        document.title += ' *';
        document.getElementById("mainTitle").innerHTML = document.title;
    }
    isSave = false;
    wordsCount();
}
ipcRenderer.on('action', (event, arg) => {
    switch(arg) {
        case 'new': 
            askSaveNeed();
            initDoc();
            break;
        case 'open': 
            askSaveNeed();
            openFile();
            wordsCount();
            break;
        case 'save': 
            saveCurrentDoc();
            break;
        case 'save-as': 
            currentFile = null;
            saveCurrentDoc();
            break;
        case 'exit':
            askSaveNeed(); 
            saveWinData(); 
            if(isQuit) { 
                ipcRenderer.sendSync('reqaction', 'exit');
            }
            isQuit = true; 
            break;
    }
});



function initDoc() {
    currentFile = null;
    txtEditor.value = '';
    document.title = 'Notepad - Untitled';
	document.getElementById("mainTitle").innerHTML = document.title;
    isSave = true;
	document.getElementById("txtNum").innerHTML = 0;
}



function askSaveNeed() {
    
    if (isSave) {
        return;
    }
    const options = {
        type: 'question',
        message: 'Would you like to save the current document?',
        buttons: [ 'Yes', 'No', 'Cancel']
    }
    const selection = dialog.showMessageBoxSync(remote.getCurrentWindow(), options);
    if (selection == 0) {
        saveCurrentDoc();
    } else if(selection == 1) {
        console.log('Cancel and Quit!');
    } else {
        console.log('Cancel and Hold On!');
        isQuit = false; 
    }
}



function saveCurrentDoc() {
    
    if(!currentFile) {
        const options = {
            title: 'Save',
            filters: [
                { name: 'Text Files', extensions: ['txt', 'js', 'html', 'md'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        }
        const paths = dialog.showSaveDialogSync(remote.getCurrentWindow(), options);
        if(paths) {
            currentFile = paths;
        }
    }
    
    if(currentFile) {
        const txtSave = txtEditor.value;
        saveText(currentFile, txtSave);
        isSave = true;
        document.title = "Notepad - " + currentFile;
        document.getElementById("mainTitle").innerHTML = document.title;
    }

}



function openFile() {
    
    const options = {
        filters: [
            { name: 'Text Files', extensions: ['txt', 'js', 'html', 'md'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    }
    
    const file = dialog.showOpenDialogSync(remote.getCurrentWindow(), options);
    if(file) {
        currentFile = file[0];
        const txtRead = readText(currentFile);
        txtEditor.value = txtRead;
        document.title = 'Notepad - ' + currentFile;
        document.getElementById("mainTitle").innerHTML = document.title;
        isSave = true;
    }

}



function saveText( file, text ) {
    fs.writeFileSync( file, text );
}



function readText(file) {
    return fs.readFileSync(file, 'utf8');
}



function wordsCount() {
    var str = txtEditor.value;
	sLen = 0;
	try{
		
   		str = str.replace(/(\r\n+|\s+|　+)/g,"reel");
		
		str = str.replace(/[\x00-\xff]/g,"m");	
		str = str.replace(/m+/g,"*");
		str = str.replace(/reel+/g,"");
		sLen = str.length;
	}catch(e){
		console.log(e);
    }
	document.getElementById("txtNum").innerHTML = sLen;
}


const dragContent = document.querySelector('#txtEditor');
dragContent.ondragenter = dragContent.ondragover = dragContent.ondragleave = function() {
    return false;
}
dragContent.ondrop = function(e) {
    e.preventDefault();
    askSaveNeed();
    currentFile = e.dataTransfer.files[0].path; 
    const txtRead = readText(currentFile);
    txtEditor.value = txtRead;
    document.title = 'Notepad - ' + currentFile;
	document.getElementById("mainTitle").innerHTML = document.title;
    isSave = true;
    wordsCount();
}



function showList(o) {
    hideList("dropdown-content" + o.id);
    document.getElementById("dropdown-" + o.id).classList.toggle("show");
    document.getElementById("a").setAttribute("onmousemove","showList(this)");
    document.getElementById("b").setAttribute("onmousemove","showList(this)");
    document.getElementById("c").setAttribute("onmousemove","showList(this)");
    var clickColor;
    if(themes == 'dark') {
        clickColor = '#505050';
    } else {
        clickColor = '#d5e9ff';
    }
    if(o.id == 'a') {
        document.getElementById('a').style.background = clickColor;
        document.getElementById('b').style.background = "";
        document.getElementById('c').style.background = "";
    }
    if(o.id == 'b') {
        document.getElementById('a').style.background = "";
        document.getElementById('b').style.background = clickColor;
        document.getElementById('c').style.background = "";
    }
    if(o.id == 'c') {
        document.getElementById('a').style.background = "";
        document.getElementById('b').style.background = "";
        document.getElementById('c').style.background = clickColor;
    }
}
 
function hideList(option) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.id != option) {
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

window.onclick = function(e) {
    if (!e.target.matches('.dropbtn')) {
        hideList("");
        document.getElementById("a").setAttribute("onmousemove","");
        document.getElementById("b").setAttribute("onmousemove","");
        document.getElementById("c").setAttribute("onmousemove","");
        document.getElementById("a").style.background = "";
        document.getElementById("b").style.background = "";
        document.getElementById("c").style.background = "";
    }
}

function hotkey() {
    var key = window.event.keyCode;
    var keyCtrl;
    if((key == 70)&&(event.altKey)) {
        keyCtrl = document.getElementById("a");
        showList(keyCtrl);
    }
    if((key == 69)&&(event.altKey)) {
        keyCtrl = document.getElementById("b");
        showList(keyCtrl);
    }
    if((key == 72)&&(event.altKey)) {
        keyCtrl = document.getElementById("c");
        showList(keyCtrl);
    }
}
document.onkeydown = hotkey;


function menuClick(arg) {
    switch(arg) {
        case 'new': 
            askSaveNeed();
            initDoc();
            break;
        case 'open': 
            askSaveNeed();
            openFile();
            wordsCount();
            break;
        case 'save': 
            saveCurrentDoc();
            break;
        case 'save-as': 
            currentFile = null;
            saveCurrentDoc();
            break;
    }
}


function docCommand(arg) {
    switch(arg) {
        case 'undo': 
            document.execCommand('Undo');
            break;
        case 'redo': 
            document.execCommand('Redo');
            break;
        case 'cut': 
            document.execCommand('Cut', false, null);
            break;
        case 'copy': 
            document.execCommand('Copy', false, null);
            break;
        case 'paste': 
            document.execCommand('Paste', false, null);
            break;
        case 'delete': 
            document.execCommand('Delete', false, null);
            break;
        case 'seletAll': 
            document.execCommand('selectAll');
            break;
    }
}

function aboutMe() {
    shell.openExternal('www.linkedin.com/in/arya-aniket2001');
}

function theme() {
    if(themes == 'normal') {
        document.getElementById('theme_css').href = './styleDark.css';
        themes = 'dark';
    } else {
        document.getElementById('theme_css').href = './style.css';
        themes = 'normal';
    }
}

function saveWinData() {
    var dF = remote.getCurrentWindow().isMaximized();
    var dX = dF == true ? myData.positionX : remote.getCurrentWindow().getPosition()[0];
    var dY = dF == true ? myData.positionY : remote.getCurrentWindow().getPosition()[1];
    var dWidth = dF == true ? myData.width : remote.getCurrentWindow().getSize()[0];
    var dHeight = dF == true ? myData.height : remote.getCurrentWindow().getSize()[1];
    var obj = {
        "isFull": dF,
        "positionX": dX,
        "positionY": dY,
        "width": dWidth,
        "height": dHeight,
        "theme": themes
    }
    var d = JSON.stringify(obj, null, '\t');
    fs.writeFileSync('./data.json', d);
}
