#!/usr/bin/env node

const fs = require('fs'),
    path = require('path');

let folders = {};
let outputText = '';
let markdownText = '';
let outputFileName = 'directoryList.md';
let searchPath = path.resolve(process.argv[2] || '.');
let key = searchPath;//.replace(/\//g,'');
let startFolder = searchPath.split('/')[searchPath.split('/').length - 2] || require(path.join(process.cwd(),'./package.json')).name;
let startDepth = searchPath.split('/').length - 1;
let currentWorkingDirectory = process.cwd();
let exported = false;
let depth = 0;

const folderIgnoreList = [
  '.git',
  'node_modules'
];

const getFolders = function(path){
  fs.readdir(path, function(err, list){
    if (err) return done(err);
    list.forEach(function(item){
      if(fs.lstatSync(path + '/' + item).isDirectory() &&
        folderIgnoreList.indexOf(item) === -1){
        const folderDepth = path.split('/').length;
        if(folderDepth > depth){
          depth = folderDepth;
        }
        const uniqueKey = path + '/' + item.replace(/\//g,'');
        folders[uniqueKey] = {
          depth: folderDepth,
          parentFolder: path,
          path: path + '/' + item,
          name: item,
          folders: [],
          files: [],
          logged: false,
          parsed: false,
          marked: false
        };
        getFolders(path + '/' + item, true);
      }
    });
    getFilesInFolders();
  });
};

const getFiles = function(path, key){
  fs.readdir(path, function(err, list){
    list.forEach(function(item){
      if(!fs.lstatSync(path + '/' + item).isDirectory()){
        if(folders[key].files.length === 0 || folders[key].files.indexOf(item) === -1){
          folders[key].files.push(item);
        }
      } else {
        if(folders[key].folders.indexOf(item) === -1){
          folders[key].folders.push(item);
        }
      }
    });

    folders[key].parsed = true;
    listFolders();
  });
};

const getFilesInFolders = function(){
  for (const key in folders) {
    if (folders.hasOwnProperty(key)) {
      getFiles(folders[key].path, key);
    }
  }
};

const listFolders = function(){
  let allParsed = true;
  let numFolders = 0;
  for(const key in folders){
    if(folders.hasOwnProperty(key)){
      numFolders++;
      if(!folders[key].logged || !folders[key].parsed){
        allParsed = false;
      }
      if(folders[key].parsed && !folders[key].logged){
        folders[key].logged = true;
        // console.log(JSON.stringify(folders[key],null,2));
      }
    }
  }
  if(allParsed && !exported){
    exported = true;
    // console.log('Number of folders: ' + numFolders);
    // generateText();
    generateMarkdown();
    console.log(JSON.stringify(folders,null,2));
  }
};

const generateText = function(){
  outputText += 'Files and folders in ' + searchPath + '\n\n';
  for(let i = 0; i < depth + 1; i++){
    for(const key in folders) {
      if(folders.hasOwnProperty(key)){
        const folder = folders[key];
        if(folder.depth === i){
          const name = folder.path.split(searchPath)[1];
          outputText += name + '\n';
          for(const j = 0; j < name.length; j++){
            outputText += '-';
          }
          outputText += '\n';
          if(folder.files.length === 0){
            outputText += 'No files in folder' + '\n';
          }
          for(const j = 0; j < folder.files.length; j++){
            outputText += folder.files[j] + '\n';
          }
          outputText += '\n\n';
        }
      }
    }
  }

  fs.writeFile(outputFileName, outputText, function(err){
    if (err) return;
    // console.log(outputFileName +  '>' + outputText);
  });
};

const addFileName = function(name, indent){
  indent = indent + 4;
  markdownText += '';
  for(let i = 0; i < indent; i++){
    // if(i % 3 === 0){
      // markdownText += '|';
    // } else {
      markdownText += ' ';
    // }
  }

  markdownText += `|--  name  测试\n`;

};

const addFolderName = function(name, index){
  if(folders[name] !== undefined){
    if(folders[name].marked){
      return;
    }
    const indent = (folders[name].depth - startDepth) * 4;
    markdownText += '';
    for(let i = 0; i < indent; i++){
      markdownText += ' ';
    }
    if(index === 1){
      markdownText += '|-- ' + startFolder + '\n';
    } else {
      console.log(folders[name].name, '二级根路径'');
      markdownText += '|-- ' + folders[name].name + '\n';
    }
    // console.log('Folders[name]:');
    // console.log(folders[name]);
    folders[name].files.forEach(function(f){
      addFileName(f, indent);
    });
    folders[name].marked = true;
    folders[name].folders.forEach(function(f){
      const path = name + '/' + f;
      addFolderName(path, 2);
    });
  }
};

const generateMarkdown = function(){
  addFolderName(key, 1);

  addSiblingfolderConnections();

  fs.writeFile(currentWorkingDirectory + '/' + outputFileName, markdownText, function(err){
    if (err) return;
    // console.log(outputFileName +  '>' + outputText);
  });
};

String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
}

const addSiblingfolderConnections = function(){
  const lines = markdownText.split('\n');
  for(let i=1; i<lines.length; i++){
    const line1 = lines[i-1];
    const line2 = lines[i];
    for(let j=0; j<line2.length; j++){
      const char1 = line1.charAt(j);
      const char2 = line2.charAt(j);
      // console.log('comparing ' + char1 + ' with ' + char2);
      // Search for folder below to connect to
      let foundSibling = false;
      for(let k=i; k<lines.length; k++){
        const charBelow = lines[k].charAt(j);
        if(charBelow !== '|' && charBelow !== ' '){
          break;
        }
        if(charBelow === '|'){
          foundSibling = true;
        }
      }
      if(foundSibling && char1 === '|' && char2 === ' '){
        line2 = line2.replaceAt(j, '|');
        lines[i] = line2;
      }
    }
  }
  console.log('lines');
  console.log(lines);
  markdownText = lines.join('\n');
};

folders[key] = {
  depth: searchPath.split('/').length - 1,
  parentFolder: null,
  path: searchPath,
  name: searchPath.split('/')[searchPath.split('/').length - 1],
  folders: [],
  files: [],
  logged: false,
  parsed: false,
  marked: false
};
fs.readdir(searchPath, function(err, list){

  list.forEach(function(item){

    if(!fs.lstatSync(searchPath + '/' + item).isDirectory()){
      if(folders[key].files.indexOf(item) === -1){
        folders[key].files.push(item);
      }
    }
  });
  folders[key].parsed = true;
});
getFolders(searchPath);