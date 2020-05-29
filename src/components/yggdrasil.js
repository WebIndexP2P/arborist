'use strict';

define([
  'lib/pastedoc'
], function(
  PasteDoc
) {

  var showAddModal = function(vnode) {

    var addSite = function() {
      var name = $('#yggName').val();
      var desc = $('#yggDesc').val();
      var tag = $('#yggTag').val();

      if (name.length == 0 || desc.length == 0) {
        $.growl.error({message: "details cannot be empty"});
        return;
      }

      libwip2p.Peers.sendMessage({
          method: "bundle_get",
          params: [{account: Account.getWallet().address}]
      })
      .then(function(response){
        if (response.error) {
          $.growl.error({message: response.error});
          return;
        }
        return PasteDoc.deserialize(response.result.cborData)
        .then(function(pasteDoc){
          if (pasteDoc == '') {
            console.log('creating empty root doc');
            pasteDoc = {}
          }
          if (typeof pasteDoc != 'object' || Array.isArray(pasteDoc) == true) {
            $.growl.error({message: "Your root document needs to be an object e.g. {}"});
            return;
          }

          if (pasteDoc.hasOwnProperty('yggservices') == false)
            pasteDoc.yggservices = [];

          pasteDoc.yggservices.push({
            name: name,
            desc: desc,
            tags: [ tag ]
          })

          return pasteDoc;
        })
      })
      .then((newDoc)=>{
        if (newDoc == null)
          return;

        var timestamp = Math.round((new Date()).getTime() / 1000);
        var multihashHex;
        var signatureHex;
        var cborBufferAsBase64;

        return PasteDoc.serializeToBuffer(newDoc)
        .then(function(_cborBuffer){
          cborBufferAsBase64 = _cborBuffer.toString('base64');
          return PasteDoc.getCid(_cborBuffer);
        })
        .then(function(cid) {
          multihashHex = '0x' + cid.multihash.toString('hex');
          return Account.sign(timestamp, '0x' + cid.multihash.toString('hex'));
        })
        .then(function(_signatureHex) {
          signatureHex = _signatureHex;
        })
        .then(()=>{
          return PasteDoc.post({
              account: Account.getWallet().address,
              timestamp: timestamp,
              multihash: multihashHex,
              signature: signatureHex,
              cborData: [ cborBufferAsBase64 ]
          })
        })
        .then(function(response) {
          if (response.error) {
            $.growl.error(response.error);
          } else {
            if (response.result == 'ok') {
              $('#modal').modal('hide');
              fetchRoot(vnode);
            }
            else {
              $.growl.error(response.error);
            }
          }
        })
      })
    }

    var modalContent = {view: function(){
        return [
            m("div.modal-header",
            m("h5.modal-title","Add ygg service to index"),
            m("button.close", {type:"button", "data-dismiss":"modal"},
                m("span", m.trust("&times;"))
            )
            ),
            m("div.modal-body",
                m("form",
                  m("div.form-group",
                    m("label", "Site name"),
                    m("input.form-control", {id:"yggName", type:"text"})
                  ),
                  m("div.form-group",
                    m("label", "Description"),
                    m("textarea.form-control", {id:"yggDesc"})
                  ),
                  m("div.form-group",
                    m("label", "Tag"),
                    m("input.form-control", {id:"yggTag", type:"text"})
                  )
                )
            ),
            m("div.modal-footer",
              m("button.btn btn-secondary", {type:"button", "data-dismiss":"modal"},"Cancel"),
              m("button.btn btn-primary", {type:"button", onclick: addSite},"Add")
            )
        ]
    }}

    m.mount($('.modal-content').get(0), modalContent);
    $('#modal').modal('show');
  }

  var renderCategory = function(vnode, tag) {

    var items = vnode.state.list[tag];

    var siteElements = []
    for (var a = 0; a < items.length; a++) {
      siteElements.push(
        m("div", {style:"margin-top:10px"},
          m("div", m("span", {style:"font-weight:bold;"}, items[a].name)),
          m("pre", items[a].desc)
        )
      )
    }
    return siteElements;
  }

  var processList = function(vnode, list) {
    for (var a = 0; a < list.length; a++) {
      if (list[a].tags.length > 1)
        console.log(list[a])
      var tag = list[a].tags[0];
      // index by group/tag
      if (Array.isArray(vnode.state.list[tag])) {
        vnode.state.list[tag].push(list[a]);
      } else {
        vnode.state.list[tag] = [ list[a] ];
      }
    }
  }

  var fetchAndProcessList = function(vnode, account) {
    return libwip2p.Peers.getActivePeerSession()
    .then((session)=>{
      return session.sendMessage({
          method: "bundle_get",
          params: [{account: account}]
      })
    })
    .then(function(response){
      return PasteDoc.deserialize(response.result.cborData);
    })
    .then(async function(pasteDoc){
      if (pasteDoc.yggservices)
        return processList(vnode, pasteDoc.yggservices);
    })
  }

  var fetchRoot = function(vnode) {
    vnode.state.list = {};
    vnode.state.compilingList = true;

    return libwip2p.Peers.getActivePeerSession()
    .then((session)=>{
      return session.sendMessage({
          method: "bundle_get",
          params: [{account: vnode.state.rootYggServicesAccount}]
      })
    })
    .then(function(response){
      PasteDoc.deserialize(response.result.cborData)
      .then(async function(pasteDoc){
        if (pasteDoc.yggservices) {
          processList(vnode, pasteDoc.yggservices);
        }
        if (pasteDoc.yggservices_maintainers) {
          for (var a = 0; a < pasteDoc.yggservices_maintainers.length; a++) {
            await fetchAndProcessList(vnode, pasteDoc.yggservices_maintainers[a]);
          }
        }

        vnode.state.compilingList = false;
        m.redraw();

      })
    })
  }

  return {

    oninit: function(vnode) {
      vnode.state.rootYggServicesAccount = '0x36d50566017C7F441DC4DD8890bD01268f8486AB';

      vnode.state.onPeerConnectHandler = function(){
        fetchRoot(vnode);
      }
      libwip2p.Peers.events.on('peerconnected', vnode.state.onPeerConnectHandler)

      fetchRoot(vnode);
    },

    onremove: function(vnode) {
      libwip2p.Peers.events.off('peerconnected', vnode.state.onPeerConnectHandler)
    },

    view: function(vnode) {

        return m("div.row",
            m("div.col offset-md-1 col-md-10",
                m("h4", {style:"text-align:center;"}, "Yggdrasil services"),
                m("div.float-right",
                  m("button.btn btn-primary", {onclick: showAddModal.bind(null, vnode)}, m("i.fa fa-plus"), " Add service to list")
                ),
                (function(){
                  if (vnode.state.compilingList) {
                    return m("div", "Compiling list...", m("br"), m("div.spinner-border"));
                  }
                  var categories = [];
                  for (var prop in vnode.state.list) {
                    categories.push(m("div", {style:"margin-bottom:20px;"},
                      m("div", {style:"font-weight:bold;font-size:20px;"}, prop.toUpperCase()),
                      renderCategory(vnode, prop)
                    ))
                  }
                  return categories;
                })()
            )
        )
    }

  }

})
