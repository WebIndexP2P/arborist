'use strict';

define(function() {

  let Buffer = libipfs.buffer.Buffer;

  var onPublish = function(vnode) {

    if (!vnode.state.publishPath.startsWith("/")) {
      vnode.state.publishPath = "/" + vnode.state.publishPath
    }

    let ls = new libwip2p.LinkedSet();
    ls.address = libwip2p.Account.getWallet().address
    ls.fetch(libwip2p.Account.getWallet().address)
    .then(async ()=>{
      let iter = vnode.state.blockstore._all();
      let done = false;
      while (!done) {
        await iter.next().then((result)=>{
          if (result.done) {
            done = true;
          } else {
            ls.addCachedDoc(Buffer.from(result.value.value))
          }
        })
      }
    })
    .then(()=>{      
      ls.update(vnode.state.publishPath, vnode.state.rootCid, {createMissing: true, createPathsAsLinks: true})
      return ls.sign();
    })
    .then(()=>{
      //console.log(ls)
      //throw 'stop'
      return ls.publish()
    })        
    .then((response)=>{
      if (response.error) {
        console.error(response.error);
        vnode.state.importError = {message: response.error};
      } else {
        vnode.state.importSuccess = true;
      }
      m.redraw();
    })
    .catch((error)=>{
      vnode.state.importError = {message: error};
      console.error(error);
      m.redraw();
    })
  }

  var loadDeps = function(scriptPath) {
    if (window.dynamicLoader == null) {
      window.dynamicLoader = {}
    }
    if (window.dynamicLoader.hasOwnProperty(scriptPath)) {
      return;
    } else {
      window.dynamicLoader[scriptPath] = true;
    }
    return new Promise((resolve, reject)=>{
      var head= document.getElementsByTagName('head')[0];
      var script= document.createElement('script');
      script.type= 'text/javascript';
      script.src = scriptPath;
      script.onload = resolve;
      head.appendChild(script);
    })
  }


  return {

    oninit: function(vnode) {      
      vnode.state.blockCount = null;
      vnode.state.totalSize = 0;
      vnode.state.rootCid = null;
      vnode.state.blockstore = null;
      vnode.state.publishPath = "";
      vnode.state.sigBundle = {};

      loadDeps("/npm/ipfs-unixfs-importer/dist/index.min.js")
      loadDeps("/npm/blockstore-core/dist/index.min.js")
    },

    oncreate: function(vnode) {
      let fileInput = document.getElementById("inputFolder")
      let source = [];

      fileInput.addEventListener('change', async function(e){
          let totalSize = 0;
          for (let a = 0; a < fileInput.files.length; a++) {
              totalSize += fileInput.files[a].size;

              await new Promise((resolve, reject)=>{
                  const reader = new FileReader();
                  reader.onload = function(){
                      let buf = libipfs.buffer.Buffer.from(reader.result);
                      source.push({
                          path: fileInput.files[a].webkitRelativePath, 
                          content: buf
                      })
                      resolve();
                  }
                  reader.readAsArrayBuffer(fileInput.files[a])
              })
          }

          vnode.state.totalSize = totalSize;

          vnode.state.blockstore = new BlockstoreCore.MemoryBlockstore()

          // import all the files in "source" array
          let iter = IpfsUnixfsImporter.importer(source, vnode.state.blockstore, {rawLeaves: true});
          let done = false;
          while (!done) {
            await iter.next().then((result)=>{
              if (result.done) {
                done = true;
              } else {
                vnode.state.rootCid = result.value.cid;
              }
            })
          }
          vnode.state.blockCount = Object.keys(vnode.state.blockstore.data).length;
          m.redraw();              
      })
    },

    view: function(vnode) {
      return m("div.row",
        m("div.col offset-md-1 col-md-10",
          m("h4", {style:"text-align:center;"}, "Upload Folder (as UnixFS)"),
          m("div.form",

            m("div.input-group mt-5 mb-3",
                m("input.form-control", {type:"file", id:"inputFolder", multiple: true, webkitdirectory: true})
            )

          ),

          (function(){

            let importForm;
            if (!vnode.state.importSuccess) {
              importForm = [
                m("input.form-control mt-2 mb-2", {type:"text", placeholder:"e.g. linked/path", oninput:(e)=>{
                  vnode.state.publishPath = e.target.value;
                }}, vnode.state.publishPath),
                m("button.btn btn-outline-primary", {onclick: onPublish.bind(null, vnode)}, "Publish")
              ]
            }

            if (vnode.state.rootCid != null) {
              return m("div",
                m("div", {style:"font-weight:bold;"}, "Root CID:"),
                m("div", vnode.state.rootCid.toString()),
                m("div", {style:"font-weight:bold;"}, "Total Size:"),
                m("div", vnode.state.totalSize),
                m("div", {style:"font-weight:bold;"}, "Blocks:"),
                m("div", vnode.state.blockCount),
                importForm 
              )
            }
          })(),

          (function(){
            if (vnode.state.importSuccess) {
              return m("span.valid-feedback", {style:"display:block;"} ,"Import successful")
            }
          })()
        )

      )
    }
  }
})
