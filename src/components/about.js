'use strict';

define([
    'lib/version'
], function(
    Version
) {

    return {

        view: function(vnode) {
            return m("div.row",
              m("div.col offset-md-2 col-md-8",
                m("h4", {style:"text-align:center;"}, "About"),
                m("p", {style:"margin-top:20px;"}, "Arborist is the default UI for interacting with WebIndexP2P tree's. It's primary focus is to provide users with an easy to use interface for managing their data, especially where certain dapps may restrict what sort of changes a user can make to their data bundle, Arborist has no restrictions."),
                m("p", "If you'd like to get involved get in contact using any of the methods listed on the ", m("a", {href:"/contact", oncreate:m.route.link}, "contact"), " page, if you'd like to financially support the project, head over to the ", m("a", {href:"/donate", oncreate:m.route.link}, "donate"), " page to see if there is an option you'd be interested in."),
                m("div.row",
                  m("div.col col-md-2", "arborist"),
                  m("div.col col-md-2", m("span.badge badge-primary", "v", Version))
                ),
                m("div.row",
                  m("div.col col-md-2", "libwip2p"),
                  m("div.col col-md-2", m("span.badge badge-primary", "v", libwip2p.version))
                )
              )
            )
        }

    }

})
