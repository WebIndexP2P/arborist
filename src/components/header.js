'use strict'

define([
    'components/account',
    'lib/refreshlistener'
], function(
    Account,
    RefreshListener
) {

    return {

        oninit: function(vnode) {

            vnode.state.peerChangeHandler = function() {
              libwip2p.Following.checkAllForUpdates()
            }
            libwip2p.Peers.events.on('peerconnected', vnode.state.peerChangeHandler)

            vnode.state.followingUpdateHandler = function() {
              var unreadCount = libwip2p.Following.getTotalUnread();
              if (unreadCount > 0)
                  vnode.state.unreadCountElement = m("span.badge badge-pill badge-danger", {style:"margin-left:1px;"}, unreadCount);
              else
                  vnode.state.unreadCountElement = null;
              m.redraw();
            }
            libwip2p.Following.events.on('update', vnode.state.followingUpdateHandler)

            vnode.state.onAuthHandler = function(remotePeerId) {
              var part1 = remotePeerId.substr(0,22);
              var part2 = remotePeerId.substr(22);
              $.growl.notice({message: ' Peer authenticated as ' + part1 + "\n" + part2});
            }
            libwip2p.Peers.events.on('authed', vnode.state.onAuthHandler);

            vnode.state.onPeerIdChangedHandler = function(newPeerId) {
              var origPeerId = libwip2p.Peers.getActive().peerId;
              console.log('PeerId has changed from ' + origPeerId + ' to ' + newPeerId);
              $.growl.error({message: 'PeerId has changed'});
            }
            libwip2p.Peers.events.on('peeridchanged', vnode.state.onPeerIdChangedHandler);

        },

        ondestroy: function(vnode) {
            libwip2p.Peers.events.off('peerconnected', vnode.state.peerChangeHandler)
            libwip2p.Peers.events.off('authed', vnode.state.onAuthHandler);
            libwip2p.Following.events.off('update', vnode.state.followingUpdateHandler)
            libwip2p.Peers.events.off('peeridchanged', vnode.state.onPeerIdChangedHandler);
        },

        view: function(vnode) {
            return m("div.d-flex flex-column flex-md-row align-items-center p-2 px-md-4 mb-3 bg-white border-bottom box-shadow",
                m("h4.my-0 mr-md-auto font-weight-normal",
                    m("a", {href:"/", oncreate: m.route.link, style:"outline:none;color: inherit; text-decoration: none;"},
                        m("img", {src:"assets/arborist.svg", style:"height:48px;width:48px;margin-right:10px;"}),
                        "Arborist"
                    )
                ),
                m("nav.navbar my-2 my-md-0 mr-md-3",
                    m("a.p-2 text-dark", {href:"/", oncreate: m.route.link}, "Edit"),
                    m("a.p-2 text-dark", {href:"/view", oncreate: m.route.link}, "View"),
                    (function(){
                      if (window.isPortrait) {
                        return m("a.p-2 text-dark", {href:"/latest", oncreate: m.route.link}, "Latest");
                      }
                    })(),
                    m("a.p-2 text-dark", {href:"/following", oncreate: m.route.link}, "Following", vnode.state.unreadCountElement),
                    m("a.p-2 text-dark", {href:"/invites", oncreate: m.route.link}, "Invites"),
                    m("div.dropdown",
                        m("a.p-2 text-dark", {href:"#", onclick:function(){return false;}, 'data-toggle':'dropdown'}, "Tools",
                            m("div.dropdown-menu dropdown-menu-left",
                                m("a.dropdown-item", {href:"/ipfscheck", oncreate:m.route.link}, m("i.fas fa-globe"), " IPFS Dist. Checker"),
                                m("a.dropdown-item", {href:"/importpaste", oncreate:m.route.link}, m("i.fas fa-file-import"), " IPFS Import"),
                                m("a.dropdown-item", {href:"/ipldview", oncreate:m.route.link}, m("i.fas fa-binoculars"), " IPLD Viewer"),
                                m("a.dropdown-item", {href:"/importbundle", oncreate:m.route.link}, m("i.fas fa-object-group"), " Signed Bundle Import"),
                                m("div.dropdown-divider"),
                                m("a.dropdown-item", {href:"/enslist", oncreate:m.route.link}, m("i.fas fa-external-link-alt"), " ENS List"),
                                m("a.dropdown-item", {href:"/yggdrasil", oncreate:m.route.link}, m("i.fas fa-sitemap"), " Yggdrasil Services"),
                                m("a.dropdown-item", {href:"/blogger", oncreate:m.route.link}, m("i.fas fa-pen"), " Blogger"),
                                m("a.dropdown-item", {href:"/livechat", oncreate:m.route.link}, m("i.fas fa-comment"), " Live Chat")
                            )
                        )
                    ),
                    m("div.dropdown",
                        m("a.p-2 text-dark", {href:"#", onclick:function(){return false;}, 'data-toggle':'dropdown'}, "Info",
                            m("div.dropdown-menu dropdown-menu-left", {'aria-labelledby':'dropdown-info'},
                                m("a.dropdown-item", {href:"/about", oncreate:m.route.link}, m("i.fas fa-info-circle"), " About"),
                                m("a.dropdown-item", {href:"/faq", oncreate:m.route.link}, m("i.fas fa-question-circle"), " FAQ"),
                                m("a.dropdown-item", {href:"/api", oncreate:m.route.link}, m("i.fas fa-project-diagram"), " API"),
                                m("a.dropdown-item", {href:"/contact", oncreate:m.route.link}, m("i.fas fa-envelope"), " Contact")
                            )
                        )
                    ),
                    m("a.p-2 text-dark", {href:"/donate",    oncreate: m.route.link}, "Donate")
                ),
                m(Account)
            )
        }
    }

})
