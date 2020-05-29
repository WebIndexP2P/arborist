'use strict';

define([
  'lib/refreshlistener',
  'lib/pastedoc',
  'gx/ethereum-blockies/blockies.min'
], function(
  RefreshListener,
  PasteDoc,
  MakeBlockies
) {

  var saveMsg = function(vnode) {

    var msg = $('#livechatmsg').val();
    if (msg.length == 0)
      return;

    var timestamp = Math.round((new Date()).getTime() / 1000);
    var chatMsg;
    var session;

    return libwip2p.Peers.getActivePeerSession()
    .then((_session)=>{
      session = _session;
      return session.sendMessage({
          method: "bundle_get",
          params: [{account: libwip2p.Account.getWallet().address}]
      })
    })
    .then(function(response){
      return new Promise((resolve, reject)=>{

        if (response.error) {
          if (response.error != 'no paste found') {
            $.growl.error({message: response.error});
            return reject();
          } else {
            return resolve({});
          }
        }

        return PasteDoc.deserialize(response.result.cborData)
        .then(function(pasteDoc){
          if (pasteDoc == '' || pasteDoc == null) {
            console.log('creating empty root doc');
            pasteDoc = {}
          }
          if (typeof pasteDoc != 'object' || Array.isArray(pasteDoc) == true) {
            $.growl.error({message: "Your root document needs to be an object e.g. {}"});
            return;
          }

          resolve(pasteDoc);
        })
      })
    })
    .then((newDoc)=>{
      if (newDoc == null)
        return;

      chatMsg = {
        m: msg,
        t: timestamp
      }

      newDoc.livechat = [ chatMsg ];

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
        return libwip2p.Account.sign(timestamp, '0x' + cid.multihash.toString('hex'));
      })
      .then(function(_signatureHex) {
        signatureHex = _signatureHex;
      })
      .then(()=>{
        return session.sendMessage({
            method: "bundle_save",
            params: [{
              account: libwip2p.Account.getWallet().address.toLowerCase(),
              timestamp: timestamp,
              multihash: multihashHex,
              signature: signatureHex,
              cborData: [ cborBufferAsBase64 ]
            }]
        })
      })
      .then(function(response) {
        if (response.error) {
          $.growl.error({message: response.error});
        } else {
          if (response.result == 'ok') {
            $('#livechatmsg').val('');

            chatMsg.account = libwip2p.Account.getWallet().address.toLowerCase();
            insertChatLog(vnode, chatMsg);
          }
          else {
            $.growl.error({message: result.response});
          }
        }
      })
      .catch((err)=>{
        console.log(err);
      })
    })
    .catch((err)=>{
      console.log(err);
      $.growl.error({message: err})
    })
  }

  var checkPaste = function(vnode, signedPasteDetails) {
    var pastedata = signedPasteDetails.pastedata[0];
    var data = buffer.Buffer.from(pastedata, 'base64');
    PasteDoc.deserialize(data)
    .then((doc)=>{
      if (doc.livechat) {
        var latestMsg = doc.livechat[doc.livechat.length - 1];
        if (latestMsg.t > doc.timestamp) {
          console.log('msgtime is more recent than doc timestamp');
          return;
        }

        latestMsg.account = signedPasteDetails.account.toLowerCase();
        insertChatLog(vnode, latestMsg);
      }
    })
  }

  var handleKeyPress = function(vnode, e) {
    if (e.keyCode == 13) {
      saveMsg(vnode);
      return false;
    }
  }

  var insertChatLog = function(vnode, log) {
    var bInserted = false;
    for (var a = 0; a < vnode.state.chatLog.length; a++) {
      if (log.t == vnode.state.chatLog[a].t && log.account == vnode.state.chatLog[a].account) {
        vnode.state.chatLog[a] = log;
        bInserted = true;
        break;
      }
      if (log.t < vnode.state.chatLog[a].t) {
        vnode.state.chatLog.splice(a,0,log);
        bInserted = true;
        break;
      }
    }
    if (bInserted == false) {
      vnode.state.chatLog.push(log);
    }
    m.redraw();
    $('#livechatinputbox').get(0).scrollIntoView(false);
  }

  var fetchAccountChats = function(vnode, account) {
    return libwip2p.Peers.getActivePeerSession()
    .then((session)=>{
      return session.sendMessage({
          method: "bundle_get",
          params: [{account: account}]
      })
    })
    .then(function(response){
      if (response.error) {
        //$.growl.error({message: response.error});
        console.log('error fetching ' + account);
        return;
      }
      return PasteDoc.deserialize(response.result.cborData)
      .then(function(pasteDoc){
        if (pasteDoc.livechat == null)
          return;

        for (var a = 0; a < pasteDoc.livechat.length; a++) {
          var log = pasteDoc.livechat[a];
          log.account = account;
          insertChatLog(vnode, log);
        }
      })
    })
  }

  var fetchHistory = function(vnode) {
    return libwip2p.Peers.getActivePeerSession()
    .then((session)=>{
      return session.sendMessage({
          method: "bundle_get",
          params: [{account: vnode.state.defaultHistoryBot}]
      })
    })
    .then(function(response){
      return PasteDoc.deserialize(response.result.cborData)
      .then(async function(pasteDoc){

        // load in the chats from the history bot
        if (pasteDoc.livechat) {
          for (var a = 0; a < pasteDoc.livechat.length; a++) {
            var log = pasteDoc.livechat[a];
            log.account = vnode.state.defaultHistoryBot;
            insertChatLog(vnode, log);
          }
        }

        if (pasteDoc.livechathistory) {
          for (var a = 0; a < pasteDoc.livechathistory.length; a++) {
            await fetchAccountChats(vnode, pasteDoc.livechathistory[a].toLowerCase())
            .catch((err)=>{
              console.log(err);
            });
          }
        }

      })
    })
    .catch((err)=>{
      if (err != 'peerSession not ready')
        console.error(err)
    })
  }

  return {

    oninit: function(vnode) {

      vnode.state.defaultHistoryBot = "0xFff0575C77d9C3af45cD33eA47B8AAC7E967b8e2".toLowerCase();
      vnode.state.chatLog = [];
      fetchHistory(vnode);

      vnode.state.peerConnectHandler = function() {
        vnode.state.chatLog = [];
        fetchHistory(vnode);
      }
      libwip2p.Peers.events.on('peerconnected', vnode.state.peerConnectHandler)

      vnode.state.newPasteHandler = function(pasteDetails) {
        checkPaste(vnode, pasteDetails);
      }
      libwip2p.Peers.events.on('bundlereceived', vnode.state.newPasteHandler)
    },

    onremove: function(vnode) {
        libwip2p.Peers.events.off('peerconnected', vnode.state.peerConnectHandler)
        libwip2p.Peers.events.off('bundlereceived', vnode.state.newPasteHandler)
    },

    view: function(vnode) {
      return m("div.row",
        m("div.col offset-md-1 col-md-10",
          m("h4", {style:"text-align:center;"}, "Live Chat"),
          vnode.state.chatLog.map(function(msg){
            var displayTime = new Date(msg.t * 1000);
            var displayHours = displayTime.getHours();
            if (displayHours < 10)
              displayHours = '0' + displayHours;
            var displayMinutes = displayTime.getMinutes();
            if (displayMinutes < 10)
              displayMinutes = '0' + displayMinutes;
            return m("div.chatcontainer",
              m("img", {src: MakeBlockies(msg.account), style:"float:left;height:40px;width:40px;border-radius:15%;"}),
              m("p", msg.m),
              m("span.chattime-right", displayHours, ":", displayMinutes)
            );
          }),
          m("div", {id:"livechatinputbox", style:"padding-bottom:10px;"}, m("input.form-control", {id: "livechatmsg", type:"text", placeholder:"Send message...", onkeypress: handleKeyPress.bind(null, vnode), autocomplete:"off"})),
        )
      )
    }

  }

})
