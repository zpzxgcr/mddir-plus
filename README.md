/*自述文件*/
## 生成项目路径


mddir加强版
#### To install:
```shell
> npm install mddir -g
```
#### Useage
>**在每个文件的首行添加注释 便是该文件的注释
 目前仅识别** **/*** ***/** **以及 // 注释格式**
```shell
mddirs ../relative/path/
```
or project root dir run
```shell
mddirs
```


#### Currently ignores
```javascript
[
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
```

> fork from <a href="https://github.com/JohnByrneRepo/mddir">mddir</a>