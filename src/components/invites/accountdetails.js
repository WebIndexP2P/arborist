'use strict';

define(function() {

    var queryDetails = function(vnode) {
        vnode.state.loading = m("div", m("i.icon loading"));
        m.request({
            method: "POST",
            url: window.apiUrl,
            data: {"jsonrpc":"2.0", method:"getAccountDetails", params:[vnode.attrs.account], id: window.getNextRpcId()},
            responseType:"application/json"
        })
        .then((response)=>{

            if (response.hasOwnProperty('error')) {
                $.growl.error({message: response.error.message});
            } else {
                vnode.state.accountDetails = response.result;
            }
            vnode.state.loading = null;
        })
    }

    return {

        oninit: function(vnode) {
            vnode.state.accountDetails = [];
            queryDetails(vnode);
        },

        view: function(vnode) {
            if (vnode.state.loading)
                return vnode.state.loading;
            else if (vnode.state.accountDetails.length == 0)
                return m("div", "No account details");
            else {
                return m("table.ui table very basic compact",
                    vnode.state.accountDetails.map((kvpair) => {
                        return m("tr", m("td", m("b", kvpair.key)), m("td", kvpair.value));
                    })
                )
            }
        }

    }

})
