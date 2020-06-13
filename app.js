var sourcePath = "";
var targetPath = "";

function openFolder() {
  var sourcePath = document.getElementById("sourcePath");
  openFolderAll(sourcePath, true);
}

function openTargetFolder() {
  var targetPath = document.getElementById("targetPath");
  openFolderAll(targetPath, false);
}

function openFolderAll(label, source) {
  const electron = require("electron").remote;
  const dialog = electron.dialog;

  var k = dialog.showOpenDialog({ properties: ["openDirectory"] });
  k.then(function (obj) {
    if (obj["filePaths"].length > 0) {
      var path = obj["filePaths"][0];
      label.innerHTML = path;
      if (source) {
        sourcePath = path;
      } else {
        targetPath = path;
      }
    } else {
      label.innerHTML = "";
    }
  });
}

async function convertNow() {
  if (sourcePath == "") {
    alert("Please select source path");
  } else if (targetPath == "") {
    alert("Please select target path");
  } else {
      const { resolve } = require("path");
      const fs = require("fs");
        const { readdir } = require("fs").promises;
        const path = require("path");
    async function getFiles(dir) {
      const dirents = await readdir(dir, { withFileTypes: true });
      const files = await Promise.all(
        dirents.map((dirent) => {
            const res = resolve(dir, dirent.name);

            var full = res.substr(sourcePath.length);

            if (dirent.isDirectory()) {
                console.log("IS DIR");
                console.log(full);
                //create directory
                let realPath = targetPath + full;
                if (!fs.existsSync(realPath)){
                    fs.mkdirSync(realPath);
                }
            }
            else {
                var myfile = path.basename(res);
                if (myfile != ".DS_Store") {
                    console.log("IS FILE");
                    console.log(full);
                   

                    //read file
                    let file = fs.readFileSync(res);
                    let zawgyi = file.toString();

                    let content = Rabbit.zg2uni(zawgyi);

                    let realPath = targetPath + full;
                    fs.writeFileSync(realPath, content, 'utf8');
                }
                
            }
            return dirent.isDirectory() ? getFiles(res) : res;
        })
      );
    }
      
    await getFiles(sourcePath);
    alert('done');
  }
}
