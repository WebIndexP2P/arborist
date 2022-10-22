'use strict'

define([
    'components/account',
    'lib/refreshlistener',
    'gx/wip2p-settings/src/peeridmodal'
], function(
    Account,
    RefreshListener,
    PeerChangeModal
) {

    var fixDropdowns = function() {
      $('.dropdown-auto-adjust').on('shown.bs.dropdown', function () {
        OffsetDropdown()

        $('.dropdown-auto-adjust').on('resize.bs.dropdown', function () {
          OffsetDropdown()
        })
      })

      $('.dropdown-auto-adjust').on('hide.bs.dropdown', function() {
        $('.dropdown-auto-adjust').off('resize.bs.dropdown')
      })

      var OffsetDropdown = function() {
        var dropdown = $('.dropdown-menu-auto-adjust.show')

        if (dropdown.length == 0)
          return

        var rightOffset = dropdown.offset().left + dropdown.width()
        var browserWidth = $('body').innerWidth()
        var neededLeftOffset = dropdown.position().left - (rightOffset - browserWidth)

        if (neededLeftOffset < 0) {
          dropdown.css({ left: neededLeftOffset - 3 })
        } else {
          dropdown.css({ left: 0 })
        }
      }
    }

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

            vnode.state.onPeerIdChangedHandler = function(endpoint, origPeerId, newPeerId) {
              //console.log('Peer at ' + endpoint + ' has changed Id from ' + origPeerId + ' to ' + newPeerId);
              PeerChangeModal.show(endpoint, origPeerId, newPeerId);
            }
            libwip2p.Peers.events.on('peeridchanged', vnode.state.onPeerIdChangedHandler);
        },

        oncreate: function(vnode) {
          fixDropdowns();
        },

        ondestroy: function(vnode) {
          // does the header ever destroy? don't think so.
          libwip2p.Peers.events.off('peerconnected', vnode.state.peerChangeHandler)
          libwip2p.Peers.events.off('authed', vnode.state.onAuthHandler);
          libwip2p.Following.events.off('update', vnode.state.followingUpdateHandler)
          libwip2p.Peers.events.off('peeridchanged', vnode.state.onPeerIdChangedHandler);
        },

        view: function(vnode) {
            return m("div.d-flex flex-column flex-md-row align-items-center p-2 px-md-4 mb-3 bg-white border-bottom box-shadow",
                m("h4.my-0 mr-md-auto font-weight-normal",
                    m(m.route.Link, {href:"/", style:"outline:none;color: inherit; text-decoration: none;"},
                        m("img", {src:"assets/arborist.svg", style:"height:48px;width:48px;margin-right:10px;"}),
                        "Arborist"
                    )
                ),
                m("nav.navbar my-2 my-md-0 mr-md-3",
                    m(m.route.Link, {class:"p-2 text-dark", href:"/"}, "Edit"),
                    m(m.route.Link, {class:"p-2 text-dark", href:"/view"}, "View"),
                    (function(){
                      if (window.isPortrait) {
                        return m(m.route.Link, {class:"p-2 text-dark", href:"/latest"}, "Latest");
                      }
                    })(),
                    m(m.route.Link, {class:"p-2 text-dark", href:"/following"}, "Following", vnode.state.unreadCountElement),
                    m(m.route.Link, {class:"p-2 text-dark", href:"/invites"}, "Invites"),
                    m("div.dropdown dropdown-auto-adjust",
                        m("a.p-2 text-dark", {href:"#", 'data-toggle':'dropdown'}, "Tools",
                            m("div.dropdown-menu dropdown-menu-auto-adjust",
                                m(m.route.Link, {class:"dropdown-item", href:"/ipfscheck"}, m("i.fas fa-globe"), " IPFS Dist. Checker"),
                                m(m.route.Link, {class:"dropdown-item", href:"/importpaste"}, m("i.fas fa-file-import"), " IPFS Import"),
                                m(m.route.Link, {class:"dropdown-item", href:"/ipldview"}, m("i.fas fa-binoculars"), " IPLD Viewer"),
                                m(m.route.Link, {class:"dropdown-item", href:"/importbundle"}, m("i.fas fa-object-group"), " Signed Bundle Import"),
                                m(m.route.Link, {class:"dropdown-item", href:"/importcar"}, m("i.fas fa-archive"), " Import CAR"),
                                m("div.dropdown-divider"),
                                m(m.route.Link, {class:"dropdown-item", href:"/enslist"}, m("i.fas fa-external-link-alt"), " ENS List"),
                                m(m.route.Link, {class:"dropdown-item", href:"/yggdrasil"}, m("i.fas fa-sitemap"), " Yggdrasil Services"),
                                m(m.route.Link, {class:"dropdown-item", href:"/blogger"}, m("i.fas fa-pen"), " Blogger"),
                                m(m.route.Link, {class:"dropdown-item", href:"/livechat"}, m("i.fas fa-comment"), " Live Chat"),
                                m(m.route.Link, {class:"dropdown-item", href:"/goyacy"}, m("i.fas fa-search"), " GoYacy")
                            )
                        )
                    ),
                    m("div.dropdown dropdown-auto-adjust",
                        m("a.p-2 text-dark", {href:"#", 'data-toggle':'dropdown'}, "Info",
                            m("div.dropdown-menu dropdown-menu-auto-adjust", {'aria-labelledby':'dropdown-info'},
                                m(m.route.Link, {class:"dropdown-item", href:"/about", oncreate:m.route.link}, m("i.fas fa-info-circle"), " About"),
                                m(m.route.Link, {class:"dropdown-item", href:"/faq", oncreate:m.route.link}, m("i.fas fa-question-circle"), " FAQ"),
                                m(m.route.Link, {class:"dropdown-item", href:"/api", oncreate:m.route.link}, m("i.fas fa-project-diagram"), " API")
                            )
                        )
                    ),
                    m(m.route.Link, {class:"p-2 text-dark", href:"/donate"}, "Donate")
                ),
                m(Account)
            )
        }
    }

})
