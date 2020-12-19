const path = require('path')

var sourcePath = "";
var targetPath = "";

function setPath(path, isSource = true) {
    isSource ? sourcePath = path : targetPath = path
}

function getPath(isSource = true) {
    return isSource ? sourcePath : targetPath
}

let ui = new UI({
    setPath, getPath,
    openFolder: openFolderAll,
    getBaseName: path.basename,
    convert: convertNow,
    openSponsorLink: openWeb
})

function openFolder() {
    openFolderAll(sourcePath, true);
}

function openTargetFolder() {
    var targetPath = document.getElementById("targetPath");
    openFolderAll(targetPath, false);
}

function openWeb() {
    const shell = require('electron').shell;
    shell.openExternal("https://www.comquas.com");
}

  
async function openFolderAll() {
    const electron = require("electron").remote;
    const dialog = electron.dialog;

    let result = await dialog.showOpenDialog({ properties: ["openDirectory"] });

    if (result.filePaths.length > 0) {
        return result.filePaths[0]
    }

    return null
}

function convertDocx(source, dest,docx) {
    const fs = require("fs");
    var zipper = require('zip-local');

    if (!fs.existsSync(dest)){
        fs.mkdirSync(dest);
    }

    zipper.sync.unzip(source).save(dest);

    var docXMLPath = dest + "/word/document.xml";
    docXML = fs.readFileSync(docXMLPath).toString();
    docXML = docXML.replace(/=\"Zawgyi-One\"/g, "=\"Myanmar Text\"")
    let content = Rabbit.zg2uni(docXML);
    fs.writeFileSync(docXMLPath, content, 'utf8');
    zipper.sync.zip(dest).compress().save(docx);
    fs.rmdirSync(dest,{ recursive: true });
}

function convertXlsx(source, dest,xlsx) {
    const fs = require("fs");
    var zipper = require('zip-local');

    if (!fs.existsSync(dest)){
        fs.mkdirSync(dest);
    }

    zipper.sync.unzip(source).save(dest);

    var docXMLPath = dest + "/xl/sharedStrings.xml";
    docXML = fs.readFileSync(docXMLPath).toString();
    let content = Rabbit.zg2uni(docXML);
    
    fs.writeFileSync(docXMLPath, content, 'utf8');

    var stylePath = dest + "/xl/styles.xml";
    docXML = fs.readFileSync(stylePath).toString();
    content = docXML.replace(/val\=\"Zawgyi-One\"/g, "val\=\"Myanmar Text\"")
    fs.writeFileSync(stylePath, content, 'utf8');

    zipper.sync.zip(dest).compress().save(xlsx);
    fs.rmdirSync(dest,{ recursive: true });
}

function convertPptx(source, dest,xlsx) {
    const fs = require("fs");
    var zipper = require('zip-local');
    const path = require("path");
    
    

    if (!fs.existsSync(dest)){
        fs.mkdirSync(dest);
    }

    zipper.sync.unzip(source).save(dest);

    slides = dest + "/ppt/slides";

    let filenames = fs.readdirSync(slides);

    filenames.forEach(file => { 
        var fullSlides = slides + "/" + file;

        let extension = path.extname(fullSlides);
        if (extension == ".xml") {
            docXML = fs.readFileSync(fullSlides).toString();
            let content = Rabbit.zg2uni(docXML);
            content = content.replace(/\stypeface\=\"Zawgyi-One\"\s/g, " typeface=\"Myanmar Text\" ")
            fs.writeFileSync(fullSlides, content, 'utf8');
        }
    }); 
    
    zipper.sync.zip(dest).compress().save(xlsx);
    fs.rmdirSync(dest,{ recursive: true });
}

async function convertNow() {
    if (!!!sourcePath) {
        ui.error = UI.Errors.SOURCE_EMPTY
    } else if (!!!targetPath) {
        ui.error = UI.Errors.TARGET_EMPTY
    } else if (targetPath === sourcePath) {
        ui.error = UI.Errors.SOURCE_EQ_TARGET
    }
    else {
        ui.conversionInProgress = true
        const { shell } = require('electron')
        const { resolve } = require("path");
        const fs = require("fs");
        const { readdir } = require("fs").promises;
        const path = require("path");
        const { isText, isBinary, getEncoding } = require('istextorbinary')
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

                        if (extension == ".docx") {
                            let realPath = targetPath + full;
                            let folder = realPath.substring(0, realPath.length-5);
                            convertDocx(res, folder, realPath);
                        }
                        else if (extension == ".xlsx") {
                            let realPath = targetPath + full;
                            let folder = realPath.substring(0, realPath.length-5);
                            convertXlsx(res, folder, realPath);
                        }
                        else if (extension == ".pptx") {
                            let realPath = targetPath + full;
                            let folder = realPath.substring(0, realPath.length-5);
                            convertPptx(res, folder, realPath);
                        }
                        else if (myfile != ".DS_Store") {
                            //read file
                            if (!isText(res)) {
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

        shell.openPath(targetPath)
        ui.showSuccessStatus()
    }
}