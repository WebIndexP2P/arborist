'use strict';

define([
  'gx/buffer.js/buffer'
], function(
  Bufferjs
) {

    var onGoClick = function(vnode) {
        vnode.state.errorMessage = null;
        try {
          ethers.utils.getAddress(vnode.state.address);
          m.route.set("/view/:account", {account: vnode.state.address})
        } catch(err) {
          vnode.state.errorMessage = m("div.alert alert-danger", "Invalid address")
        }
    }

    var onInput = function(vnode, e) {
        if (e.keyCode && e.keyCode == 13) {
            onGoClick(vnode);
        } else {
            vnode.state.address = e.target.value;
        }
    }

    return {

        oninit: function(vnode) {
            vnode.state.address = "";
            vnode.state.errorMessage = null;
        },

        view: function(vnode) {
            return m("div.row",
                m("div.col offset-md-1 col-md-10",
                    m("h4", {style:"text-align:center;"}, "View"),
                    m("div.form-group",
                        m("label", "Account address:"),
                        m("div.input-group mb-3",
                            //m("input.form-control", {type:"text", value: vnode.state.address, onchange: onKeyUp.bind(null, vnode), onkeyup: onKeyUp.bind(null, vnode)}),
                            m("input.form-control", {type:"text", value: vnode.state.address, onkeyup: onInput.bind(null, vnode), oninput: onInput.bind(null, vnode)}),
                            m("div.input-group-append",
                                m("button.btn btn-outline-primary", {onclick: onGoClick.bind(null, vnode)}, "Go")
                            )
                        )
                    ),
                    vnode.state.errorMessage
                )
            )
        }

    }
})
