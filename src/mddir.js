#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const ora = require('ora');
const readline = require('readline');
const _ = require('lodash');
let folders = {}
let outputText = ''
let markdownText = ''
let outputFileName = 'directoryList.md'
let searchPath = path.resolve(process.argv[2] || '.')
let key = searchPath; // .replace(/\//g,'')
let startFolder = searchPath.split('/')[searchPath.split('/').length - 2] || require(path.join(process.cwd(), './package.json')).name
let startDepth = searchPath.split('/').length - 1
let currentWorkingDirectory = process.cwd()
let exported = false
let depth = 0
let spinner = ora('mddir running ...');
spinner.start();
console.time('spend time')
const folderIgnoreList = [
  '.git',
  'node_modules',
  '.vscode',
  'dist',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.idea',
  'dist'
]

const getFolders = function (paths) {
  fs.readdir(paths, function (err, list) {
    if (err) return done(err)

    list.forEach(function (item) {
      if (fs.lstatSync(paths + '/' + item).isDirectory() &&
      folderIgnoreList.indexOf(item)  === -1) {


        const folderDepth = paths.split('/').length
        if (folderDepth > depth) {
          depth = folderDepth
        }
        const uniqueKey = paths + '/' + item.replace(/\//g, '')
        folders[uniqueKey] = {
          depth: folderDepth,
          parentFolder: paths,
          path: paths + '/' + item,
          name: item,
          folders: [],
          files: [],
          logged: false,
          parsed: false,
          marked: false
        }

        getFolders(paths + '/' + item, true)
      }
    })
    getFilesInFolders()
  })
}

const getFiles = function (paths, key) {

  fs.readdir(paths, function (err, list) {
    list.forEach(function (item) {
      if (!fs.lstatSync(paths + '/' + item).isDirectory()) {
        if (folders[key].files.length === 0 || folders[key].files.indexOf(item) === -1 && !folderIgnoreList.some( x => x === path.extname(item))) {
          folders[key].files.push(item);
        }
      } else {
        if (folders[key].folders.indexOf(item) === -1) {
          folders[key].folders.push(item)
        }
      }
    })

    folders[key].parsed = true
    listFolders()
  })
}

const getFilesInFolders = function () {
  for (const key in folders) {
    if (folders.hasOwnProperty(key)) {

      getFiles(folders[key].path, key)
    }
  }
}

const listFolders = function () {
  let allParsed = true
  let numFolders = 0
  for (const key in folders) {

    if (folders.hasOwnProperty(key)) {
      numFolders++
      if (!folders[key].logged || !folders[key].parsed) {
        allParsed = false
      }
      if (folders[key].parsed && !folders[key].logged) {
        folders[key].logged = true
      // console.log(JSON.stringify(folders[key],null,2))
      }
    }
  }
  if (allParsed && !exported) {
    exported = true
    // console.log('Number of folders: ' + numFolders)
    // generateText()
    generateMarkdown()
  }
}

const generateText = function () {
  outputText += 'Files and folders in ' + searchPath + '\n\n'
  for (let i = 0; i < depth + 1; i++) {
    for (const key in folders) {
      if (folders.hasOwnProperty(key)) {
        const folder = folders[key]
        if (folder.depth === i) {
          const name = folder.path.split(searchPath)[1]
          outputText += name + '\n'
          for (const j = 0; j < name.length; j++) {
            outputText += '-'
          }
          outputText += '\n'
          if (folder.files.length === 0) {
            outputText += 'No files in folder' + '\n'
          }
          for (const j = 0; j < folder.files.length; j++) {
            outputText += folder.files[j] + '\n'
          }
          outputText += '\n\n'
        }
      }
    }
  }
  fs.writeFile(outputFileName, outputText, function (err) {
    if (err) throw err
  })
}

const addFileName = function (name, indent, txt) {
  indent = indent + 4
  markdownText += `${''.padEnd(indent, ' ')}|--  ${name}  ${txt}\n`
}
const done = () =>{
  const isDone = _.every(folders, (item)=> item.marked);
  if(isDone){
    addSiblingfolderConnections();
    fs.writeFile(currentWorkingDirectory + '/' + outputFileName, markdownText, function (err) {
      if (err) throw err;
      spinner.succeed('mddirs success √');
      spinner.stop();
      console.timeEnd('spend time')
    })
  }
}
const addFolderName = async (name, index) => {
    try {

      if (folders[name] !== undefined) {
        if (folders[name].marked) {
          return
        }
        const indent = (folders[name].depth - startDepth) * 4;
        markdownText += ''.padEnd(indent, ' ');
        if (index === 1) {
          markdownText += '|-- ' + startFolder + '\n'
        } else {
          markdownText += '|-- ' + folders[name].name + ' \n'
        }
        folders[name].files = folders[name].files.filter(item => !folderIgnoreList.some( x => x === path.extname(item)));
        for(let i = 0; i < folders[name].files.length; i++) {
          const f = folders[name].files[i];
          const txt = await getAnnotation(folders[name].path, f);
          addFileName(f, indent, txt)
        }
        folders[name].marked = true
        for (let i=0; i < folders[name].folders.length; i++){
          const f =  folders[name].folders[i];
          const path = name + '/' + f;
          addFolderName(path, 2);
        }
        done()
      }

    } catch (error) {
      throw error;
    }
}
const getAnnotation = (paths, item) => {

  return new Promise(resolve =>{
    // const stream = fs.createReadStream(path.join(paths, item),
    //                 { start: 0, end: 50, encoding: "utf-8"});

    // const rl = readline.createInterface({  input: stream });
    // rl.on('line', (data) => {
    //   let txt =  data.match(/(?<=\/\*)[\s\S]*(?=\*\/)/ig) || data.match(/^\/\/(.*)/ig);
    //   if (txt) {
    //     resolve(txt[0].replace(/[\/\r\n ]/g, ""));
    //   } else {
    //     resolve('');
    //   }
    //   rl.close();
    //   stream.close();
    //   stream.read(0);

    // })
    const wrap = fs.readFile(path.join(paths, item), 'utf-8', (err, data) => {
      if (err) console.error(err);
      data = data.slice(0, 50);
      let txt =  data.match(/(?<=\/\*)[\s\S]*(?=\*\/)/ig) || data.match(/^\/\/(.*)/ig);
      if (txt) {
        resolve(txt[0].replace(/[\/\r\n ]/g, ""));
      } else {
        resolve('');
      }
    })
  })
}
const generateMarkdown = function () {

  addFolderName(key, 1);
}

String.prototype.replaceAt = function (index, character) {
  return this.substr(0, index) + character + this.substr(index + character.length)
}

const addSiblingfolderConnections = function () {
  let lines = markdownText.split('\n')
  for (let i = 1; i < lines.length; i++) {
    let line1 = lines[i - 1]
    let line2 = lines[i]
    for (let j = 0; j < line2.length; j++) {
      const char1 = line1.charAt(j)
      const char2 = line2.charAt(j)
      // console.log('comparing ' + char1 + ' with ' + char2)
      // Search for folder below to connect to
      let foundSibling = false
      for (let k = i; k < lines.length; k++) {
        const charBelow = lines[k].charAt(j)
        if (charBelow !== '|' && charBelow !== ' ') {
          break
        }
        if (charBelow === '|') {
          foundSibling = true
        }
      }
      if (foundSibling && char1 === '|' && char2 === ' ') {
        line2 = line2.replaceAt(j, '|')
        lines[i] = line2
      }
    }
  }
  markdownText = lines.join('\n')
}

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
}
fs.readdir(searchPath, function (err, list) {
  list.forEach(function (item) {
    if (!fs.lstatSync(searchPath + '/' + item).isDirectory()) {
      if (folders[key].files.indexOf(item) === -1) {
        folders[key].files.push(item)
      }
    }
  })
  folders[key].parsed = true
})

getFolders(searchPath)