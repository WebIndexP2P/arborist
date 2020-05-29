'use strict';

define([
    'components/header',
    'components/latestpastes'
], function(
    Header,
    LatestPastes
) {

    return {

        view: function(vnode) {
          if (window.isPortrait == false) {
            return [
                m(Header),
                m("div.container-fluid",
                    m("div.row",
                        m("div.col-sm-8",
                            vnode.children
                        ),
                        m("div.col-sm-4",
                            m(LatestPastes)
                        )
                    )
                )
            ]
          } else {
            return [
                m(Header),
                m("div.container-fluid",
                    m("div.row",
                        m("div.col-sm-12",
                            vnode.children
                        )
                    )
                )
            ]
          }
        }
    }

})
