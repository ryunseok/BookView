var fs = require('fs');
var supportedExt = [".zip", ".rar", ".pdf"];
var j = 0;
var time = new Date();
var update_list = [];
// 파일의 절대 경로를 title/uri로 변환하는 함수
function ExtractBookLink(path, file) {
    //console.log(path);
    //console.log(file);

    var parent_path = "";
    var split_path = path.split("/");
    //console.log(split_path);  
    for (var i = 1; i < split_path.length - 1; i++) {
        parent_path += ('/' + split_path[i]);
        // console.log(i + 'th:' + parent_path);
    }
    var book_title, book_path, book_file;
    parent_path += '/';
    if ('완결' == split_path[split_path.length - 2] || '미완' == split_path[split_path.length - 2]) {
        //만화 - 완결 - 파일명
        book_title = '[' + split_path[split_path.length - 3] + ']' + file;
        book_file = file;
        book_path = encodeURIComponent(path).split("%2F").join("/").replace('/../../book', "");
    }
    else if ('라이트노벨' == split_path[split_path.length - 2] || 'SF' == split_path[split_path.length - 2]) {
        // 소설 - 완결 - 분류 - 파일명
        book_title = '[' + split_path[split_path.length - 4] + ']' + file;
        book_file = file;
        book_path = encodeURIComponent(path).split("%2F").join("/").replace('/../../book', "");
    }
    else if ('라이트노벨' == split_path[split_path.length - 3] || 'SF' == split_path[split_path.length - 3]) {
        // 소설 - 완결 - 분류 - 시리즈 - 파일명
        book_title = '[' + split_path[split_path.length - 5] + ']' + split_path[split_path.length - 2];
        book_file = split_path[split_path.length - 1];
        book_file = book_file.substr(0, book_file.length - 4);
        book_path = encodeURIComponent(path).split("%2F").join("/").replace('/../../book', "");
    }
    else {
        // 소설/만화 - 미완 - 시리즈 - 파일명
        book_title = '[' + split_path[split_path.length - 4] + ']' + split_path[split_path.length - 2];
        book_file = split_path[split_path.length - 1];
        book_file = book_file.substr(0, book_file.length - 4);
        book_path = encodeURIComponent(parent_path).split("%2F").join("/").replace('/../../book', "");
    }

    return {
        title: book_title,
        path: book_path,
        file: book_file,
        date: 0

    }
}

function extract_updatedList(path) {
    var sub_dir = fs.readdirSync(path);
    var bOverlap = 0;
    //console.log("sub_dir count :" + sub_dir.length + '\n');
    for (var i = 0; i < sub_dir.length; i++) {
        var sub_path = path + "/" + sub_dir[i];
        var file = fs.statSync(sub_path);

        if (file.isDirectory()) {
            //console.log(sub_path + '\n');
            extract_updatedList(sub_path);
        }
        else {
            elapsedTime = (time.getTime() - file.mtime.getTime()) / (1000 * 3600 * 24); //conversion ms to day
            //console.log(elapsedTime);
            if (30 > elapsedTime) {
                for (var k = 0; k < supportedExt.length; ++k) {
                    if (sub_path.endsWith(supportedExt[k])) {
                        var temp = ExtractBookLink(sub_path, sub_dir[i]);
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
                        // console.log(j)
                        // console.log(update_list.length);
                    }
                }
            }
        }
    }
    return update_list;
}




// mapping list
function mapFile(path) {

    const dir = fs.readdirSync(__dirname + '/../../book' + path);

    // console.log(path);
    // console.log(dir);

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

    //check this extension is support
    function matchExt(file) {
        if (file.title.startsWith('.')) {
            return false;
        }
        if (file.isDirectory) return true;
        for (var i = 0; i < supportedExt.length; ++i) {
            if (file.title.endsWith(supportedExt[i])) {
                return true;
            }
        }
        return false;
    }
    return dir.map(mapFile).filter(matchExt);
}

module.exports = {

    extract: ExtractBookLink,
    update: extract_updatedList,
    mapFile: mapFile   
}




