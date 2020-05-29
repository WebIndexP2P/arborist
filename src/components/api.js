'use strict';

define(function() {

    var apiMethods = [
        {"name":"bundle_save",           "desc":"Saves a new bundle"},
        {"name":"bundle_get",            "desc":"Gets latest bundle for given account"},
        {"name":"ui_bundleGetRecent",    "desc":"Gets the most recent 8 accounts with some simple stats"},
        {"name":"ui_getAccount",         "desc":"Gets account details"},
        {"name":"ui_getTimestampsBatch", "desc":"Gets the latest timestamps for up to 10 accounts at a time"}
    ]

    return {

        view: function(vnode) {
            return m("div.row",
                m("div.col offset-md-2 col-md-8",
                    m("h4", {style:"text-align:center;"}, "API"),

                    m("p", "API uses JSON-RPC2 calls over a websocket connection. For example ws://<node address>:9000 or wss://ownpaste.com/api"),
                    m("div", {style:"font-weight:bold;"}, "API Methods"),

                    apiMethods.map(function(method, idx) {
                        return m("pre",
                            method.name,
                            m("hr"),
                            method.desc
                        )
                    })

                )
            )
        }

    }

})
