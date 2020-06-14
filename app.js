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
    k.then(function(obj) {
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
    } else if (targetPath == sourcePath) {
        alert("Source and Target cannot be same");
    }
    else {
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
                        //create directory
                        let realPath = targetPath + full;
                        if (!fs.existsSync(realPath)) {
                            fs.mkdirSync(realPath);
                        }
                    } else {
                        var myfile = path.basename(res);
                        let extension = path.extname(res);
                        let notconvert = [".png", ".jpg", ".docx", ".xlsx", ".doc", ".pdf", ".mp3", ".mp4",".mov"];
                        if (myfile != ".DS_Store") {
                            //read file
                            if (notconvert.includes(extension)) {
                                //copy file
                                let realPath = targetPath + full;
                                fs.copyFileSync(res, realPath);
                            }
                            else {
                                let file = fs.readFileSync(res);
                                let zawgyi = file.toString();
                            
                                let content = Rabbit.zg2uni(zawgyi);

                                let realPath = targetPath + full;
                                fs.writeFileSync(realPath, content, 'utf8');
                            }
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