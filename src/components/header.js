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


    var OffsetDropdown = function() {
      var dropdown = $('.dropdown-menu-auto-adjust.show')

      if (dropdown.length == 0)
        return

      var rightOffset = dropdown.offset().left + dropdown.width()
      var browserWidth = $('body').innerWidth()
      var neededLeftOffset = dropdown.position().left - (rightOffset - browserWidth)

      if (neededLeftOffset < 0) {
        dropdown.css({ left: neededLeftOffset - 10 })
      } else {
        dropdown.css({ left: 0 })
      }
    }

    var checkScreenWidth = function(vnode) {
      let newValue;
      if (window.innerWidth < 768) {
        newValue = true;
      } else {
        newValue = false;
      }
      if (newValue != vnode.state.smallScreen) {
        vnode.state.smallScreen = newValue;
        m.redraw();
      }
    }

    return {

        oninit: function(vnode) {

            if (window.appHasInit) {
              throw 'header should not init more than once'
            }
            window.appHasInit = true;

            vnode.state.smallScreen = true;
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
          vnode.state.dropdownListener = document.addEventListener('shown.bs.dropdown', function(event){
            if (event.target.classList.contains('dropdown-event-catcher')) {
              OffsetDropdown();
            }
          })

          checkScreenWidth(vnode);

          window.addEventListener('resize', function() {
            checkScreenWidth(vnode);
          })
        },

        ondestroy: function(vnode) {
          // does the header ever destroy? don't think so.
          libwip2p.Peers.events.off('peerconnected', vnode.state.peerChangeHandler)
          libwip2p.Peers.events.off('authed', vnode.state.onAuthHandler);
          libwip2p.Following.events.off('update', vnode.state.followingUpdateHandler)
          libwip2p.Peers.events.off('peeridchanged', vnode.state.onPeerIdChangedHandler);
          document.removeEventListener(vnode.state.dropdownListener);
        },

        view: function(vnode) {

          let navType = "navbar-nav me-3 justify-content-end";
          if (vnode.state.smallScreen) {
            navType = "nav justify-content-center";
          }
          let mainNavItems = m("ul." + navType, {style:"width:100%"},
            m("li.nav-item", m(m.route.Link, {class:"p-2x text-dark nav-link", href:"/"}, "Edit")),
            m("li.nav-item", m(m.route.Link, {class:"p-2x text-dark nav-link", href:"/view"}, "View")),
            (function(){
              if (window.isPortrait) {
                return m("li.nav-item", m(m.route.Link, {class:"p-2 text-dark nav-link", href:"/latest"}, "Latest"));
              }
            })(),
            m("li.nav-item", m(m.route.Link, {class:"p-2 text-dark nav-link", href:"/following"}, "Following", vnode.state.unreadCountElement)),
            m("li.nav-item", m(m.route.Link, {class:"p-2 text-dark nav-link", href:"/invites"}, "Invites")),
            m("li.nav-item dropdown",
              m("a.p-2 text-dark nav-link dropdown-event-catcher dropdown-toggle", {href:"#", 'data-bs-toggle':'dropdown'}, "Tools"),
              m("div.dropdown-menu dropdown-menu-auto-adjust",
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/ipfscheck"}, m("i.fas fa-globe"), " IPFS Dist. Checker")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/importpaste"}, m("i.fas fa-file-import"), " IPFS Import")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/ipldview"}, m("i.fas fa-binoculars"), " IPLD Viewer")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/importbundle"}, m("i.fas fa-object-group"), " Signed Bundle Import")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/importcar"}, m("i.fas fa-archive"), " Import CAR")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/uploadfolder"}, m("i.fas fa-folder"), " Upload Folder")),
                m("div.dropdown-divider"),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/enslist"}, m("i.fas fa-external-link-alt"), " ENS List")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/yggdrasil"}, m("i.fas fa-sitemap"), " Yggdrasil Services")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/blogger"}, m("i.fas fa-pen"), " Blogger")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/livechat"}, m("i.fas fa-comment"), " Live Chat")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/goyacy"}, m("i.fas fa-search"), " GoYacy"))
              )
            ),
            m("li.nav-item dropdown",
              m("a.p-2 text-dark nav-link dropdown-event-catcher dropdown-toggle", {href:"#", 'data-bs-toggle':'dropdown'}, "Info"),
              m("ul.dropdown-menu dropdown-menu-auto-adjust", {'aria-labelledby':'dropdown-info'},
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/about"}, m("i.fas fa-info-circle"), " About")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/faq"}, m("i.fas fa-question-circle"), " FAQ")),
                m("li", m(m.route.Link, {class:"dropdown-item", href:"/api"}, m("i.fas fa-project-diagram"), " API"))
              )
            ),
            m("li.nav-item", m(m.route.Link, {class:"p-2 text-dark nav-link", href:"/donate"}, "Donate"))
          )

          return m("nav.navbar navbar-expand-md ps-3", {style:"padding:0px;"},
            m("div.container-fluid",
              m(m.route.Link, {class:"navbar-brand", href:"/", style:"outline:none;color: inherit; text-decoration: none;"},
                m("img", {src:"assets/arborist.svg", style:"height:48px;width:48px;margin-right:10px;"}),
                "Arborist"
              ),
              (function(){
                if (!vnode.state.smallScreen) {
                  return mainNavItems;
                }
              })(),
              m("div.me-2 mb-2 mt-2", {style:"display:inline-block;"},
                m(Account)
              )
            ),
            (function(){
              if (vnode.state.smallScreen) {
                return mainNavItems;
              }
            })()
          )
        }
    }

})
