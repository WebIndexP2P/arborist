'use strict';

define(function() {


    var saveGateway = function(vnode) {        
        localStorage.setItem('preferedIpfsGateway', vnode.state.preferedIpfsGateway);
        window.preferedIpfsGateway = vnode.state.preferedIpfsGateway;
        return false;
    }

    var saveApi = function(vnode) {

        vnode.state.ipfsApiError = null;

        var preferedIpfsApi = vnode.state.preferedIpfsApi;

        if (window.location.protocol == 'https:' && preferedIpfsApi.startsWith('http:')) {
            if (preferedIpfsApi.indexOf('localhost') == -1 && preferedIpfsApi.indexOf('127.0.0.1') == -1) {
                vnode.state.ipfsApiError = m("div.alert alert-danger", {style:"margin-top:5px;"}, "Can only use http://localhost or http://127.0.0.1 as insecure (HTTP) endpoints from a HTTPS website.")
            }
        }

        localStorage.setItem('preferedIpfsApi', vnode.state.preferedIpfsApi);
        window.preferedIpfsApi = vnode.state.preferedIpfsApi;
        return false;
    }

    var valChangeGateway = function(vnode, e) {
        vnode.state.preferedIpfsGateway = e.target.value;
        return false;
    }

    var valChangeApi = function(vnode, e) {
        vnode.state.preferedIpfsApi = e.target.value;
        return false;
    }

    return {
        oninit: function(vnode) {
            vnode.state.preferedIpfsGateway = window.preferedIpfsGateway;
            vnode.state.preferedIpfsApi = window.preferedIpfsApi;
        },

        view: function(vnode) {
            return m("form",
                m("div.form-group",
                    m("label", "Prefered IPFS Gateway:"),
                    m("div.input-group",
                        m("input.form-control", {type:"text", onchange: valChangeGateway.bind(null, vnode), value: vnode.state.preferedIpfsGateway}),
                        m("div.input-group-append",
                            m("button.btn.btn-outline-secondary", {type:"button", onclick: saveGateway.bind(null, vnode)}, "Save")
                        )
                    )
                ),
                m("div.form-group",
                    m("label", "Prefered IPFS API (write access):"),
                    m("div.input-group",
                        m("input.form-control", {type:"text", onchange: valChangeApi.bind(null, vnode), value: vnode.state.preferedIpfsApi}),
                        m("div.input-group-append",
                            m("button.btn.btn-outline-secondary", {type:"button", onclick: saveApi.bind(null, vnode)}, "Save")
                        )
                    ),
                    vnode.state.ipfsApiError
                )
            )
        }
    }

})