'use strict';

define(function() {

  var onPublish = function(vnode) {
    console.log('do publish');

    let timestamp = Math.round((new Date()).getTime() / 1000);

    vnode.state.sigBundle = {};
    vnode.state.sigBundle.account = libwip2p.Account.getWallet().address;
    vnode.state.sigBundle.car = vnode.state.carBytes.toString('base64');
    //console.log(Buffer.from(vnode.state.rootCid.multihash.bytes).toString('hex'))
    let bMultihash = Buffer.from(vnode.state.rootCid.multihash.bytes);
    vnode.state.sigBundle.multihash = '0x' + bMultihash.toString('hex');

    libwip2p.Account.sign(timestamp, vnode.state.sigBundle.multihash)
    .then((signature)=>{
      vnode.state.sigBundle.signature = signature;
      //vnode.state.signature = '0x' + vnode.state.sigBundle.bSignature.toString('hex');
      vnode.state.sigBundle.timestamp = timestamp;

      return libwip2p.Peers.getActivePeerSession();
    })
    .then((session)=>{
      return session.sendMessage({method:"bundle_save", params:[vnode.state.sigBundle]})
    })
    .then(function(response) {
      if (response.error) {
        console.error(response.error);
        vnode.state.importError = {message: response.error};
      } else {
        vnode.state.importSuccess = true;
        console.log(response);
      }
      m.redraw();
    })
    .catch((error)=>{
      vnode.state.importError = {message: error};
      console.error(error);
      m.redraw();
    })
  }


  return {

    oninit: function(vnode) {
      vnode.state.fileChooserLabel = "Choose file";
      vnode.state.rootCid = null;
      vnode.state.carSize = null;
      vnode.state.filename = null;
      vnode.state.blockCount = null;
      vnode.state.importError = null;
      vnode.state.importSuccess = null;
      vnode.state.carBytes = null;
    },

    oncreate: function(vnode) {

      var file = document.getElementById("inputCarFile");
      file.onchange = function(e) {

        vnode.state.importError = null;
        vnode.state.rootCid = null;

        const file = e.target.files[0];
        vnode.state.filename = file.name;
        vnode.state.fileChooserLabel = file.name;
        vnode.state.carSize = file.size;
        //console.log(file);
        var reader = new FileReader();
        reader.onloadend = function(e) {
          //vnode.state.carBytes = new Uint8Array(this.result);
          vnode.state.carBytes = Buffer.from(this.result);
          libipfs.car.CarReader.fromBytes(vnode.state.carBytes)
          .then((decoded)=>{
            //console.log(decoded)
            vnode.state.blockCount = decoded._blocks.length;
            return decoded.getRoots();
          })
          .then((roots)=>{
            vnode.state.rootCid = roots[0];
            m.redraw();
          })
          .catch((err)=>{
            vnode.state.importError = err;
            m.redraw();
          })
        }
        reader.readAsArrayBuffer(file);
        m.redraw();
      }

    },

    view: function(vnode) {
      return m("div.row",
        m("div.col offset-md-1 col-md-10",
          m("h4", {style:"text-align:center;"}, "Import IPLD Archive (CAR format)"),
          m("div.form",

            m("div.input-group mt-5 mb-3",
              m("div.custom-file",
                m("input.custom-file-input", {type:"file", id:"inputCarFile"}),
                m("label.custom-file-label", vnode.state.fileChooserLabel)
              ),
              m("div.input-group-append",
                m("button.btn btn-outline-primary", {onclick: onPublish.bind(null, vnode)}, "Publish")
              )
            )

          ),

          (function(){
            if (vnode.state.rootCid != null) {
              return m("div",
                m("div", {style:"font-weight:bold;"}, "Root CID:"),
                m("div", vnode.state.rootCid.toString()),
                m("div", {style:"font-weight:bold;"}, "CAR Size:"),
                m("div", vnode.state.carSize),
                m("div", {style:"font-weight:bold;"}, "Blocks:"),
                m("div", vnode.state.blockCount)
              )
            }
          })(),

          (function(){
            if (vnode.state.importError != null) {
              return m("div", {style:"color:red;"}, vnode.state.importError.message);
            }
          })(),

          (function(){
            if (vnode.state.importSuccess) {
              return m("div", {style:"color:green;"}, "Import successful");
            }
          })()
        )

      )
    }
  }
})
