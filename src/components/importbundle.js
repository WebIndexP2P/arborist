'use strict';

define(function() {

  var onGoClick = function(vnode, e) {
    e.preventDefault()

    var data = $('#frm-data').val()
    var obj;
    try {
      obj = JSON.parse(data)
    } catch(err) {
      $.growl.error({message: "Invalid JSON"});
      return;
    }

    if (obj.hasOwnProperty('account') == false) {
      $.growl.error({message: "Missing account"})
      return;
    }

    if (obj.hasOwnProperty('timestamp') == false) {
      $.growl.error({message: "Missing timestamp"})
      return;
    }

    if (obj.hasOwnProperty('rootCid') == false) {
      $.growl.error({message: "Missing rootCid"})
      return;
    }

    if (obj.hasOwnProperty('signature') == false) {
      $.growl.error({message: "Missing signature"})
      return;
    }

    if (obj.hasOwnProperty('cborData') == false) {
      $.growl.error({message: "Missing pastedata"})
      return;
    }

    if (Array.isArray(obj.cborData) == false) {
      $.growl.error({message: "pastedata expects array"})
      return;
    }

    if (obj.cborData[0].startsWith("0x")) {
      obj.cborData[0] = buffer.Buffer.from(obj.cborData[0].substr(2), 'hex').toString('base64')
    }

    libwip2p.Peers.getActivePeerSession()
    .then((session)=>{
      return session.doBundlePublish(obj);
    })
    .then((response)=>{
      if (response.result == 'ok')
        $.growl.notice({message: "Submitted"})
      else
        $.growl.error({message: result.error})
    })
    .catch((err)=>{
      console.error(err)
    })

    return false;
  }

  return {

    oninit: function(vnode) {
    },

    view: function(vnode) {

      return m("div.row",
        m("div.col offset-md-1 col-md-10",
          m("h4", {style:"text-align:center;"}, "Signed Bundle Import"),
          m("div.alert.alert-primary", "Expects:",
            m("ul",
              m("li", "account (e.g. \"0x1234...\")"),
              m("li", "timestamp (e.g. 1234567890)"),
              m("li", "multihash (must match pastedata[0] e.g. \"0x1234...\")"),
              m("li", "signature (e.g. \"0x1234...\")"),
              m("li", "cborData [] (array of docs hex or base64 encoded e.g. [\"0x1234\",\"AbC==\"])")
            )
          ),
          m("form",
            m("textarea.form-control", {
                id:"frm-data", style:"height:300px;"
            }),
            m("button.btn.btn-primary", {style:"margin-top: 10px;margin-bottom:5px;", onclick: onGoClick.bind(this, vnode)}, "Submit")
          )
        )
      )
    }
  }

})
