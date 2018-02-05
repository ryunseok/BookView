var express = require('express');
var router = express.Router();
var fs = require('fs');

var root_path = '/../../book';

var time = new Date();
var j = 0;
var elapsedTime = 0;
var update_list = [];
//var supportedExt = [".gif", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".zip", ".rar", ".cbz", ".cbr", ".bmp", ".pdf", ".cgt", ".webp", "mp4", "smi"];
var supportedExt = [".zip", ".rar", ".pdf"];
var bookCover = [".jpg", ".png"];
var bookCoverPath = "";

function updatedFile(path, file) {
  //console.log(path);
  var parent_path = "";
  var split_path = path.split("/");
  //console.log(split_path);  
  for (var i = 1; i < split_path.length - 1; i++) {
    parent_path += ('/' + split_path[i]);
    // console.log(i + 'th:' + parent_path);
  }
  var updated_title, updated_path, updated_file;
  parent_path += '/';
  if ('완결' == split_path[split_path.length - 2] || '미완' == split_path[split_path.length - 2]) {
    //만화 - 완결 - 파일명
    updated_title = '[' + split_path[split_path.length - 3] + ']' + file;
    updated_file = file;
    updated_path = encodeURIComponent(path).split("%2F").join("/").replace('/../../book', "");
  }
  else if ('라이트노벨' == split_path[split_path.length - 2] || 'SF' == split_path[split_path.length - 2]) {
    // 소설 - 완결 - 분류 - 파일명
    updated_title = '[' + split_path[split_path.length - 4] + ']' + file;
    updated_file = file;
    updated_path = encodeURIComponent(path).split("%2F").join("/").replace('/../../book', "");
  }
  else if ('라이트노벨' == split_path[split_path.length - 3] || 'SF' == split_path[split_path.length - 3]) {
    // 소설 - 완결 - 분류 - 시리즈 - 파일명
    updated_title = '[' + split_path[split_path.length - 5] + ']' + split_path[split_path.length - 2];
    updated_file = split_path[split_path.length - 1];
    updated_file = updated_file.substr(0, updated_file.length - 4);
    updated_path = encodeURIComponent(path).split("%2F").join("/").replace('/../../book', "");
  }
  else {
    // 소설/만화 - 미완 - 시리즈 - 파일명
    updated_title = '[' + split_path[split_path.length - 4] + ']' + split_path[split_path.length - 2];
    updated_file = split_path[split_path.length - 1];
    updated_file = updated_file.substr(0, updated_file.length - 4);
    updated_path = encodeURIComponent(parent_path).split("%2F").join("/").replace('/../../book', "");
  }

  return {
    title: updated_title,
    path: updated_path,
    file: updated_file,
    date: 0

  }
}

function updateList(path) {
  var sub_dir = fs.readdirSync(path);
  var bOverlap = 0;
  //console.log("sub_dir count :" + sub_dir.length + '\n');
  for (var i = 0; i < sub_dir.length; i++) {
    var sub_path = path + "/" + sub_dir[i];
    var file = fs.statSync(sub_path);

    if (file.isDirectory()) {
      //console.log(sub_path + '\n');
      updateList(sub_path);
    }
    else {
      elapsedTime = (time.getTime() - file.mtime.getTime()) / (1000 * 3600 * 24); //conversion ms to day
      //console.log(elapsedTime);
      if (30 > elapsedTime) {
        for (var k = 0; k < supportedExt.length; ++k) {
          if (sub_path.endsWith(supportedExt[k])) {
            var temp = updatedFile(sub_path, sub_dir[i]);
            temp.date = file.mtime.getTime();
            for (var n = 0; n < update_list.length; n++) {
              if (temp.title == update_list[n].title) {
               // console.log(temp.path);
                //console.log(temp.file.substr(temp.file.length - 2, 2));
                update_list[n].file += ',' + temp.file.substr(temp.file.length - 2, 2);
                //update_list[n].file += temp.file;
                bOverlap = true;
              }
            }
            if (!bOverlap) {
              update_list[j++] = temp;
            }
            // console.log(sub_path);
          }
        }
      }
    }
  }
  return;
}

updateList(root_path);

update_list.sort(function (a, b) {
  var x = a.date, y = b.date;
  return x > y ? -1 : x < y ? 1 : 0;

});

// for(var i = 0; i < update_list.length; i++){
//  // console.log(update_list[i].title + ':' + update_list[i].date );
//   console.log(update_list[i].path);

// }


router.get('/*', function (req, res, next) {
  const path = decodeURIComponent(req.path);
  const dir = fs.readdirSync(__dirname + '/../../book' + path);
  console.log(path);
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
        update_date: '\t' + '(' + file.mtime.getFullYear() + '-' + (file.mtime.getMonth() + 1) + '-' + file.mtime.getDate() + ')'
      }
    }
  }

  function matchExt(file) {
    if (file.title.startsWith('.')) {
      return false;
    }
    if (file.isDirectory) return true;
    for (var i = 0; i < supportedExt.length; ++i) {
      if (file.title.endsWith(supportedExt[i])) {
        return true;
      }
      // else if(file.title.endsWith(bookCover[i]))
      // {
      //   bookCoverPath = encodeURIComponent(path + file.title).split("%2F").join("/");
      //   console.log(path+file.title);
      //   return false;
      // }
    }
    return false;
  }


  var book_list = dir.map(mapFile).filter(matchExt);
  book_list.sort(function (a, b) {
    if (!a.isDirectory && !b.isDirectory) {
      var x = a.title.toLowerCase(), y = b.title.toLowerCase();
      return x < y ? -1 : x > y ? 1 : 0;
    }
    else if (a.isDirectory == b.isDirectory) {

        var x = a.title.toLowerCase(), y = b.title.toLowerCase();
        return x < y ? -1 : x > y ? 1 : 0;

    }
    else {
      return a.isDirectory > b.isDirectory ? -1 : a.isDirectory < b.isDirectory ? 1 : 0;
    }

});

  var selected_title = "";
  var parent_path = "";
  var split_path = path.split("/");
  //console.log(split_path);  
  for (var i = 1; i < split_path.length - 2; i++) {
    parent_path += ('/' + split_path[i]);
    // console.log(i + 'th:' + parent_path);
  }
  parent_path += '/';
  selected_title = split_path[split_path.length - 2];
  // console.log(selected_title);


  res.render('index', {
    root_comic: encodeURIComponent("/만화/").split("%2F").join("/"),
    root_novel: encodeURIComponent("/소설/").split("%2F").join("/"),
    parent: encodeURIComponent(parent_path).split("%2F").join("/"),
    path: selected_title,
    files: book_list,
    bookcover: bookCoverPath,
    updateFiles: update_list
  });
});



module.exports = router;