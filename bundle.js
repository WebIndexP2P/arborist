var path = require('path');
var fs = require('fs');

var exec = require('child_process').exec;
var mkdirp = require('mkdirp');
var ncp = require('ncp');
var mv = require('mv');
var gxDeps = require('./package.json').gxDependencies;

var buildDir = 'build/';

var rName;
if (process.platform == 'win32') {
    rName = "r";
} else {
    rName = "r.js";
}

var filesToCopy = [
    // main app files
    {type:"file", src: "src/index.html", dst: "index.html"},
    {type:"file", src: "src/css/app.css", dst: "css/app.css"},
    {type:"folder", src: "src/assets", dst: "assets/"},

    // GX deps
    {type:"file", src: "/node_modules/bootstrap/dist/css/bootstrap.min.css", dst:"/npm/bootstrap/dist/css/bootstrap.min.css"},
    {type:"file", src: "/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js", dst:"/npm/bootstrap/dist/js/bootstrap.bundle.min.js"},

    {type:"file", src: "/gx/Font.Awesome/css/fontawesome.min.css"},
    {type:"file", src: "/gx/Font.Awesome/css/solid.min.css"},
    {type:"file", src: "/gx/Font.Awesome/webfonts/fa-solid-900.woff2"},

    {type:"file", src: "/gx/jquery-growl/css/jquery.growl.css"},
    {type:"file", src: "/gx/jquery-growl/js/jquery.growl.js"},

    {type:"file", src: "/gx/jQuery/jquery-{ver}.min.js"},

    {type:"file", src: "/node_modules/mithril/mithril.min.js", dst:"/npm/mithril/mithril.min.js"},

    {type:"file", src: "/node_modules/ethers/dist/ethers.umd.min.js", dst:"/npm/ethers/dist/ethers.umd.min.js"},

    {type:"file", src: "/node_modules/requirejs/require.js", dst:"/npm/requirejs/require.js"},

    {type:"file", src: "/gx/ethereum-blockies/blockies.min.js"},

    {type:"file", src: "/node_modules/tweetnacl/nacl.min.js", dst:"/npm/tweetnacl/nacl.min.js"},

    {type:"file", src: "/node_modules/ipfs-unixfs-importer/dist/index.min.js", dst:"/npm/ipfs-unixfs-importer/dist/index.min.js"},
    {type:"file", src: "/node_modules/blockstore-core/dist/index.min.js", dst:"/npm/blockstore-core/dist/index.min.js"},

    {type:"file", src: "/gx/libwip2p/libwip2p.js"},

    {type:"file", src: "/gx/libipfs/libipfs.min.js"}
]


// build the main app AMD file
var results = exec(rName + ' -o amdbuild.js');
results.stdout.on("data", function(data){
    console.log(data);
})
results.on('close', function(){
    console.log('AMD build done.')
    console.log('');

    uglify()
    .then(renameIndex)
    .then(copyFiles)
    .then(modifyIndexFile)
    .catch((err)=>{
        console.log(err)
    })
})

var uglify = function() {
    return new Promise((resolve, reject)=>{
        var results = exec('uglifyjs build/index.js > build/index.min.js');
        results.stdout.on("data", function(data){
            console.log(data);
        })
        results.on('close', function(){
            console.log('Uglify done.')
            console.log('');

            resolve();
        })
    })
}

var renameIndex = function(){
    return new Promise((resolve, reject)=>{
        fs.rename('build/index.min.js', 'build/index.js', function(){
            resolve();
        });
    })
}

// copy the files
var copyFiles = function() {
    return new Promise(async (resolve, reject)=>{
        for (var idx = 0; idx < filesToCopy.length; idx++) {
            var entry = filesToCopy[idx];

            var destFolder;

            // replace any gx refs
            if (entry.src.startsWith('/gx/')) {
                destFolder = entry.src;
                var targetModule = entry.src.substring(4, entry.src.indexOf("/", 4))
                var moduleHash;
                for (var a = 0; a < gxDeps.length; a++) {
                    if (gxDeps[a].name == targetModule) {
                        moduleHash = gxDeps[a].hash;
                        break;
                    }
                }
                if (moduleHash == null) throw new Error('missing gx dep');

                var actualPath = 'vendor/gx/ipfs/' + moduleHash + '/' + targetModule;
                entry.src = entry.src.replace('/gx/' + targetModule, actualPath)

                entry.src = entry.src.replace('{ver}', gxDeps[a].version);
            } else {
                // for regular copy operations (not gx)
                if (entry.dst != null)
                    destFolder = entry.dst;
                else
                    destFolder = entry.src;
            }

            console.log(destFolder)

            var fullSrcPath = path.join(process.cwd(), entry.src);
            var fullDestPath = path.join(process.cwd(), buildDir, destFolder);
            mkdirp.sync(path.dirname(fullDestPath));
            if (entry.type == 'folder' || entry.type == 'file') {
                await new Promise((resolve, reject)=>{
                    ncp(fullSrcPath, fullDestPath, function(err){
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                })
                .catch((err)=>{
                    console.log(err)
                })
            }
        }

        console.log('');
        resolve();
    })
}

var modifyIndexFile = function() {

    // update index file with version tag cache buster
    var vContents = fs.readFileSync("src/lib/version.js").toString();
    var re = /(\d+\.\d+\.\d+)/g
    var m = vContents.match(re);
    var appVer;
    if (m.length == 1) {
        appVer = m[0];
    } else {
        throw new Error("No version number found");
    }
    var indexPath = path.join(buildDir, "index.html");
    var indexHtml = fs.readFileSync(indexPath).toString();
    indexHtml = indexHtml.replace('"css/app.css"', '"css/app.css?v=' + appVer +'"');
    indexHtml = indexHtml.replace("//<!--{REPLACEWITH_APPBUNDLE}-->", '"index.js?v=' + appVer +'"');
    fs.writeFileSync(indexPath, indexHtml);
    console.log('index.html substitutions done')
}
