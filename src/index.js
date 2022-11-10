'use strict'

define([
    'lib/mithrilnav',
    'lib/version',

    'components/pagelayout',
    'components/header',
    'components/edit',
    'components/view_form',
    'components/view',
    'components/faq',
    'components/api',
    'components/donate',
    'gx/wip2p-settings/src/settings',
    'components/following',
    'components/ipfscheck',
    'components/importpaste',
    'components/ipldview',
    'components/enslist',
    'components/yggdrasil',
    'components/blogger/manage',
    'components/blogger/view',
    'components/livechat',
    'components/importbundle',
    'components/latestpastes',
    'components/goyacy',
    'components/importcar'
], function(
    MithrilNav,
    Version,

    PageLayout,
    Header,
    PageEdit,
    PageViewForm,
    PageView,
    PageFAQ,
    PageAPI,
    PageDonate,
    PageSettings,
    PageFollowing,
    PageIpfsCheck,
    PageImportPaste,
    PageIpldView,
    PageEnsList,
    PageYggdrasil,
    PageBloggerManage,
    PageBloggerView,
    PageLiveChat,
    PageImportBundle,
    PageLatestPastes,
    PageGoYacy,
    PageImportCar
){

    MithrilNav.overrideMithrilRouting();
    MithrilNav.restoreScrollPositions();

    var libwip2p = window.libwip2p;
    window.Buffer = libipfs.buffer.Buffer;
    window.Cid = libipfs.multiformats.CID;

    libwip2p.useLocalStorage(true);

    libwip2p.Peers.init()
    .then(()=>{
      return libwip2p.Peers.addPeer("wss://tulip.wip2p.com");
    })
    .then(()=>{
      libwip2p.Account.initWallet();
      libwip2p.Following.init();
      stage2();
    })

    function stage2() {
      window.isPortrait = false;
      if (window.innerWidth < window.innerHeight) {
        window.isPortrait = true;
      }

      // if on following page, query instantly, otherwise wait a second
      new Promise(function(resolve, reject) {
          if (window.location.hash == "#!/following")
              resolve();
          else
              setTimeout(resolve, 1000);
      })
      .catch((err)=>{
        console.log(err)
      })

      window.preferedIpfsGateway = localStorage.getItem('preferedIpfsGateway');
      if (window.preferedIpfsGateway == null || window.preferedIpfsGateway.length == 0)
          window.preferedIpfsGateway = 'https://ipfs.io';
      window.preferedIpfsApi = localStorage.getItem('preferedIpfsApi');
      if (window.preferedIpfsApi == null || window.preferedIpfsApi.length == 0)
          window.preferedIpfsApi = 'http://127.0.0.1:5001';
      window.logWebsocket = localStorage.getItem('logWebsocket');
      if (window.logWebsocket == "true")
        window.logWebsocket = true;
      else
        window.logWebsocket = false;
      window.logAppEvents = localStorage.getItem('logAppEvents');
      if (window.logAppEvents == "true")
        window.logAppEvents = true;
      else
        window.logAppEvents = false;

      let settingsComponent = {view: (vnode)=> m(
        PageSettings, {
          name:"Arborist",
          version: "v" + Version,
          description: m("span", " is the default UI for interacting with WebIndexP2P tree's. It's primary focus is to provide users with an easy to use interface for managing their data, especially where certain dapps may restrict what sort of changes a user can make to their data bundle, Arborist has no restrictions.",
            m("p", {style:"margin-top:20px;"}, "If you'd like to financially support the project, head over to the ", m(m.route.Link, {href:"/donate"}, "donate"), " page to see if there is an option you'd be interested in.")
          ),
          icon:"assets/arborist.svg",
          startTab: vnode.attrs.startTab
        }
      )}

      var a = document.getElementById('app');
      m.route(a, "/", {
          "/": {render: function() {
              return m(PageLayout, {}, m(PageEdit))
          }},
          "/view": {render: function(vnode) {
              return m(PageLayout, {}, m(PageViewForm))
          }},
          "/view/:account": {render: function(vnode) {
              return m(PageLayout, {}, m(PageView))
          }},
          "/api": {render: function() {
              return m(PageLayout, {}, m(PageAPI))
          }},
          "/about": {render: function() {
              return m(PageLayout, {}, m(settingsComponent, {startTab: "about"}));
          }},
          "/faq": {render: function() {
              return m(PageLayout, {}, m(PageFAQ))
          }},
          "/donate": {render: function() {
              return m(PageLayout, {}, m(PageDonate))
          }},
          "/settings": {render: function() {
              return m(PageLayout, {}, m(settingsComponent));
          }},
          "/following": {render: function() {
              return m(PageLayout, {}, m(PageFollowing))
          }},
          "/ipfscheck": {render: function() {
              return m(PageLayout, {}, m(PageIpfsCheck))
          }},
          "/ipfscheck/:cid": {render: function() {
              return m(PageLayout, {}, m(PageIpfsCheck))
          }},
          "/ipldview": {render: function() {
              return m(PageLayout, {}, m(PageIpldView))
          }},
          "/ipldview/:cid": {render: function() {
              return m(PageLayout, {}, m(PageIpldView))
          }},
          "/importpaste": {render: function() {
              return m(PageLayout, {}, m(PageImportPaste))
          }},
          "/enslist": {render: function() {
              return m(PageLayout, {}, m(PageEnsList))
          }},
          "/yggdrasil": {render: function() {
              return m(PageLayout, {}, m(PageYggdrasil))
          }},
          "/blogger": {render: function() {
              return m(PageLayout, {}, m(PageBloggerManage))
          }},
          "/blogger/:account": {render: function() {
              return m(PageLayout, {}, m(PageBloggerView))
          }},
          "/blogger/:account/:id": {render: function() {
              return m(PageLayout, {}, m(PageBloggerView))
          }},
          "/livechat": {render: function() {
              return m(PageLayout, {}, m(PageLiveChat))
          }},
          "/importbundle": {render: function() {
              return m(PageLayout, {}, m(PageImportBundle))
          }},
          "/invites": {render: function() {
            return m(PageLayout, {}, m(settingsComponent, {startTab: "invites"}));
          }},
          "/invites/:account": {render: function() {
              return m(PageLayout, {}, m(PageInvites))
          }},
          "/latest": {render: function() {
              return m(PageLayout, {}, m(PageLatestPastes))
          }},
          "/goyacy": {render: function() {
              return m(PageLayout, {}, m(PageGoYacy))
          }},
          "/importcar": {render: function() {
              return m(PageLayout, {}, m(PageImportCar))
          }}
      })

      $(".loader").fadeOut('slow')
    }
})
