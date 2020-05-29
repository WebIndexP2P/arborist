define(function(){

    var onInput = function(vnode, e) {

        vnode.state.errorMessage = null;

        if (e.keyCode && e.keyCode == 13) {
            onGoClick(vnode);
        } else {
            vnode.state.address = e.target.value;
        }
    }
    
    var onGoClick = function(vnode) {
        try {
          ethers.utils.getAddress(vnode.state.address);
          vnode.attrs.onGo(vnode.state.address);
        } catch(err) {
          vnode.state.errorMessage = m("div.alert alert-danger", "Invalid address")
        }
    }

    return {

        oninit: function(vnode) {
            vnode.state.address = "";
            vnode.state.label = "Account address:";
            if (vnode.attrs.label)
                vnode.state.label = vnode.attrs.label;
        },

        view: function(vnode){
            return m("div.form-group",
                m("label", vnode.state.label),
                m("div.input-group mb-3",
                    m("input.form-control", {type:"text", value: vnode.state.address, onkeyup: onInput.bind(null, vnode), oninput: onInput.bind(null, vnode)}),
                    m("div.input-group-append",
                        m("button.btn btn-outline-primary", {onclick: onGoClick.bind(null, vnode)}, "Go")
                    )
                ),
                vnode.state.errorMessage
            )
        }
    }

})