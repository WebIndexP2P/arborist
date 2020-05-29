'use strict';

define([
   'components/settings/peers',
   'components/settings/ipfs',
   'components/settings/logging'
], function(
    Peers,
    Ipfs,
    Logging
) {
    return {
        view: function(vnode) {
            return m("div.row",
                m("div.col offset-md-1 col-md-10",
                    m("h4", {style:"text-align:center;"}, "Settings"),
                        m("hr"),
                        m(Peers),
                        m("hr"),
                        m(Ipfs),
                        m("hr"),
                        m(Logging)
                )
            )
        }
    }
})
