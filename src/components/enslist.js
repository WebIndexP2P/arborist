'use strict';

define([
  'lib/pastedoc',
  'gx/buffer.js/buffer'
], function(
  PasteDoc,
  Bufferjs
) {

  var showAddModal = function(vnode) {

    var addSite = function() {
      var ensName = $('#ensName').val();
      var ensUrl = $('#ensUrl').val();
      var ensDesc = $('#ensDesc').val();
      var ensTag = $('#ensTag').val();

      if (ensName.length == 0 || ensUrl.length == 0) {
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

          if (pasteDoc.hasOwnProperty('enslist') == false)
            pasteDoc.enslist = [];

          pasteDoc.enslist.push({
            name: ensName,
            ens: ensUrl,
            desc: ensDesc,
            tag: ensTag
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
            m("h5.modal-title","Add site to ENS index"),
            m("button.close", {type:"button", "data-dismiss":"modal"},
                m("span", m.trust("&times;"))
            )
            ),
            m("div.modal-body",
                m("form",
                  m("div.form-group",
                    m("label", "Site name"),
                    m("input.form-control", {id:"ensName", type:"text"})
                  ),
                  m("div.form-group",
                    m("label", "ENS address"),
                    m("input.form-control", {id:"ensUrl", type:"text"})
                  ),
                  m("div.form-group",
                    m("label", "Description"),
                    m("textarea.form-control", {id:"ensDesc"})
                  ),
                  m("div.form-group",
                    m("label", "Tag"),
                    m("select.form-control", {id:"ensTag"},
                      m("option", "blog"),
                      m("option", "blockchain projects"),
                      m("option", "entertainment"),
                      m("option", "personal"),
                      m("option", "services"),
                      m("option", "science"),
                      m("option", "political"),
                      m("option", "adult")
                    )
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
    var linkSuffix = "";
    if (vnode.state.useEthLink)
      linkSuffix = ".link";

    var items = vnode.state.enslist[tag];

    var siteElements = []
    for (var a = 0; a < items.length; a++) {
      siteElements.push(
        m("div", {style:"margin-top:10px"},
          m("div", m("span", {style:"font-weight:bold;"}, items[a].name), " (", m("a", {target: "_blank", href: 'http://' + items[a].ens + linkSuffix}, items[a].ens), ")"),
          m("div", items[a].desc)
        )
      )
    }
    return siteElements;
  }

  var processEnsList = function(vnode, list) {
    for (var a = 0; a < list.length; a++) {
      // index by group/tag
      if (Array.isArray(vnode.state.enslist[list[a].tag])) {
        vnode.state.enslist[list[a].tag].push(list[a]);
      } else {
        vnode.state.enslist[list[a].tag] = [ list[a] ];
      }
    }
  }

  var fetchAndProcessEnsList = function(vnode, account) {
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
      if (pasteDoc.enslist)
        return processEnsList(vnode, pasteDoc.enslist);
    })
  }

  var fetchRoot = function(vnode) {
    vnode.state.enslist = {};
    vnode.state.compilingList = true;

    return libwip2p.Peers.getActivePeerSession()
    .then((session)=>{
      return session.sendMessage({
          method: "bundle_get",
          params: [{account: vnode.state.rootEnsListAccount}]
      })
    })
    .then(function(response){
      PasteDoc.deserialize(response.result.cborData)
      .then(async function(pasteDoc){
        if (pasteDoc.enslist) {
          processEnsList(vnode, pasteDoc.enslist);
        }
        if (pasteDoc.enslist_maintainers) {
          for (var a = 0; a < pasteDoc.enslist_maintainers.length; a++) {
            await fetchAndProcessEnsList(vnode, pasteDoc.enslist_maintainers[a]);
          }
        }

        vnode.state.compilingList = false;
        m.redraw();

      })
    })
  }

  var toggleUseEthLink = function(vnode) {
    if (vnode.state.useEthLink == false) {
      vnode.state.useEthLink = true;
      vnode.state.useEthLinkBtnType = "btn-outline-success";
      vnode.state.useEthLinkBtnIcon = "check";
    } else {
      vnode.state.useEthLink = false;
      vnode.state.useEthLinkBtnType = "btn-outline-secondary";
      vnode.state.useEthLinkBtnIcon = "times";
    }
  }

  return {

    oninit: function(vnode) {
      vnode.state.rootEnsListAccount = '0x8CE45AfABD6Ee397aD8b13A8d97190884a6d421E';
      vnode.state.useEthLink = false;
      vnode.state.useEthLinkBtnType = "btn-outline-secondary";
      vnode.state.useEthLinkBtnIcon = "times";

      vnode.state.onPeerConnectHandler = function() {
        fetchRoot(vnode);
      }
      libwip2p.Peers.events.on('peerconnected', vnode.state.onPeerConnectHandler)
      fetchRoot(vnode);
    },

    onremove: function(vnode) {
      libwip2p.Peers.events.off('peerconnected', vnode.state.onPeerConnectHandler)
    },

    view: function(vnode) {
      var linkSuffix = "";
      if (vnode.state.useEthLink)
        linkSuffix = ".link";

        return m("div.row",
            m("div.col offset-md-1 col-md-10",
                m("h4", {style:"text-align:center;"}, "ENS Index"),
                m("div.float-right",
                  m("button.btn " + vnode.state.useEthLinkBtnType, {onclick: toggleUseEthLink.bind(null, vnode), style:"margin-right:5px;"}, m("i.fa fa-" + vnode.state.useEthLinkBtnIcon), " Use eth.link"),
                  m("button.btn btn-primary", {onclick: showAddModal.bind(null, vnode)}, m("i.fa fa-plus"), " Add site to list")
                ),
                (function(){
                  if (vnode.state.compilingList) {
                    return m("div", "Compiling list...", m("br"), m("div.spinner-border"));
                  }
                  var categories = [];
                  for (var prop in vnode.state.enslist) {
                    categories.push(m("div", {style:"margin-bottom:20px;"},
                      m("div", {style:"font-weight:bold;font-size:20px;"}, prop.toUpperCase()),
                      renderCategory(vnode, prop)
                    ))
                  }
                  return categories;
                })(),
                m("p", {style:"margin-top:50px;"}, "Special thanks to ", m("a", {href:"http://almonit.eth" + linkSuffix}, "http://almonit.eth"), " for compiling the initial contents of this list, and check out for their decentralized search engine.")
            )
        )
    }

  }

})
