'use strict';

define([
    'gx/js-cid/cids.min',
    'lib/ipldwalk',
    'components/ipldbreadcrumbs',
    'components/prettyjson'
], function(
    Cid,
    IpldWalk,
    IpldBreadcrumbs,
    PrettyJson
) {

    var onGoClick = function(vnode) {
        vnode.state.errorMessage = null;
        vnode.state.btnGoEnabled = false;
        vnode.state.dagContent = null;
        vnode.state.breadcrumbsElement = null;

        //update the components
        renderBtnGoElement(vnode);

        var tmpCid;
        try {
            tmpCid = new Cid(vnode.state.cid);
        } catch(err) {
            vnode.state.errorMessage = m("div.alert alert-danger", "Invalid CID")
            vnode.state.btnGoEnabled = true;
            renderBtnGoElement(vnode);
            return;
        }

        vnode.state.ipldwalk = new IpldWalk();
        vnode.state.ipldwalk.setFetchSource('wip2p');
        vnode.state.ipldwalk.navigateDown("/", vnode.state.cid.toString())
        .then(function() {
            vnode.state.btnGoEnabled = true;
            renderBtnGoElement(vnode);

            renderBreadcrumbs(vnode);
            renderDagContent(vnode);

            m.redraw();
        })
        .catch(function(err){
            vnode.state.btnGoEnabled = true;
            renderBtnGoElement(vnode);
            vnode.state.errorMessage = m("div.alert alert-danger", err);
            m.redraw();
        })
    }

    var renderBreadcrumbs = function(vnode) {
        vnode.state.breadcrumbsElement = m(IpldBreadcrumbs, {path: vnode.state.ipldwalk.getPath(), onLinkClick: onBreadcrumbClick.bind(null, vnode)});
    }

    var renderDagContent = function(vnode) {
        vnode.state.dagContent = [ m(PrettyJson, {key: Math.round(), iplddoc: vnode.state.ipldwalk.getContentRaw(), onLinkClick: onLinkClick.bind(null, vnode)}) ]
    }

    var onBreadcrumbClick = function(vnode, depth) {
        vnode.state.ipldwalk.navigateUp(depth)
        .then(function() {
            renderBreadcrumbs(vnode);
            renderDagContent(vnode);
            m.redraw();
        })
        return false;
    }

    var onLinkClick = function(vnode, path, cid) {

        if (vnode.state.linkClicked)
            return false;

        vnode.state.linkClicked = true;

        vnode.state.ipldwalk.navigateDown(path, cid)
        .then(function() {
            renderBreadcrumbs(vnode);
            renderDagContent(vnode);
            vnode.state.linkClicked = false;
            m.redraw();
        })

        return false;
    }

    var onInput = function(vnode, e) {
        if (e.keyCode && e.keyCode == 13) {
            onGoClick(vnode);
        } else {
            vnode.state.cid = e.target.value;
        }
    }

    var onTryMerkleHeadClick = function(vnode, e) {
        libwip2p.Peers.getActivePeerSession()
        .then((session)=>{
          return session.sendMessage({
              method: "peer_info"
          })
        })
        .then(function(response){
          if (response.error) {
              $.growl.error({message: response.error.message});
              return;
          }

          vnode.state.cid = response.result.merklehead;
          m.redraw();
        })

        return false;
    }

    var renderBtnGoElement = function(vnode) {
        if (vnode.state.btnGoEnabled)
            vnode.state.btnGoElement = m("button.btn btn-outline-primary", {onclick: onGoClick.bind(null, vnode)}, "Go");
        else
            vnode.state.btnGoElement = m("button.btn btn-outline-primary disabled", "Searching...");
    }

    return {

        oninit: function(vnode) {
            vnode.state.cid = "";
            vnode.state.curPath = null;
            vnode.state.btnGoElement = null;
            vnode.state.btnGoEnabled = true;
            vnode.state.breadcrumbsElement = null;
            vnode.state.errorMessage = null;
            vnode.state.linkClicked = false;

            if (m.route.param().cid)
                vnode.state.cid = m.route.param().cid;

            renderBtnGoElement(vnode);
        },

        view: function(vnode) {
            return m("div.row",
                m("div.col offset-md-1 col-md-10",
                    m("h4", {style:"text-align:center;"}, "IPLD Viewer"),
                    m("div.form-group",
                        m("div",
                            m("label", "CID:"),
                            m("div.float-right", m("a", {href:"#", onclick: onTryMerkleHeadClick.bind(null, vnode)}, "try merklehead"))
                        ),
                        m("div.input-group mb-3",
                            m("input.form-control", {type:"text", value: vnode.state.cid, onkeyup: onInput.bind(null, vnode), oninput: onInput.bind(null, vnode)}),
                            m("div.input-group-append",
                                vnode.state.btnGoElement
                            )
                        )
                    ),
                    vnode.state.errorMessage,
                    vnode.state.breadcrumbsElement,
                    vnode.state.dagContent
                )
            )
        }

    }
})
