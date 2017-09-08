var express = require('express');
var router = express.Router();
var fs = require('fs');

router.get('/*', function(req, res, next) {
  const path = decodeURIComponent(req.path);
  const dir = fs.readdirSync(__dirname + '/../../book' + path);
console.log(req.path);  
  function mapFile(filename) {
    const file = fs.statSync(__dirname + '/../../book' + path + filename);
    if (file.isDirectory()) {      
      return {
        isDirectory: true,
        title: filename,
        path: encodeURIComponent(path + filename).split("%2F").join("/"),
        date: (file.mtime.getTime() / 1000)      
      }
    } else {
      return {
        isDirectory: false,
        title: filename,
        path: encodeURIComponent(path + filename).split("%2F").join("/"),
        size: file.size,
        date: (file.mtime.getTime() / 1000),
        update_date: '\t' + '(' + file.mtime.getFullYear() + '-' + (file.mtime.getMonth()+1) + '-' + file.mtime.getDate() + ')' 
      }
    }
  }
  
  function matchExt(file) {
    if (file.title.startsWith('.')) {
      return false;
    }
    if (file.isDirectory) return true;
    const supportedExt = [".gif", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".zip", ".rar", ".cbz", ".cbr", ".bmp", ".pdf", ".cgt", ".webp","mp4","smi"];
    for (var i = 0; i < supportedExt.length; ++i) {
      if (file.title.endsWith(supportedExt[i])) {
        return true;
      }
    }
    return false;
  }
  var book_list = dir.map(mapFile).filter(matchExt);
  book_list.sort(function(a,b){
    if(!a.isDirectory && !b.isDirectory){
      var x = a.title.toLowerCase(), y = b.title.toLowerCase();       
         return x > y ? -1 : x  < y ? 1 : 0;
    }
    else{
    if(a.isDirectory == b.isDirectory){
      if(a.date == b.date){
        var x = a.title.toLowerCase(), y = b.title.toLowerCase();       
         return x > y ? -1 : x  < y ? 1 : 0;
      }
      else{
        return a.date > b.date ? -1 : a.date < b.date ? 1: 0;
      }
    }
    else{
      return a.isDirectory > b.isDirectory ? -1 : a.isDirectory < b.isDirectory ? 1 : 0;
    }
  }});

  var selected_title="";
  var parent_path = "";
  var split_path = path.split("/");  
  //console.log(split_path);  
  for(var i =1; i < split_path.length - 2; i++)
  {
    parent_path += ('/' + split_path[i]);
   // console.log(i + 'th:' + parent_path);
  }
  parent_path += '/';
  selected_title = split_path[split_path.length - 2];
 // console.log(selected_title);

  
  res.render('index', {    
    root_comic : encodeURIComponent("/만화/").split("%2F").join("/"),
    root_novel : encodeURIComponent("/소설/").split("%2F").join("/"),
    parent : encodeURIComponent(parent_path).split("%2F").join("/"), 
    path: selected_title,
    files: book_list
  });
});



module.exports = router;