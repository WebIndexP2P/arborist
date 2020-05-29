'use strict';

define(function() {

                        
    var accounts = {
        "btc": "1BqHtGHRsPv28bjfUex73WrcdYL6w5UBw3",
        "bch": "qqlxh5m83lf9jfn56u2l7d9kk0fyt2mskvdx4e6ha3",
        "dsh": "Xc89bN3VhrpewbxuwMMGGuaTRjMUQx1Vvo",
        "eth": "0x183564794ADFCf2962a79Fc831C7567286d9E618",
        "ltc": "LhFaL3Zjf6kqhB9A19it4XckMphrdaViiH",
        "xrp": "rUr9ZKk2SNLnHiGWXW8sAqebZJv3ETVXGF",
        "eos": "dnfugmbae2vj"
    }

    return {

        view: function(vnode) {
            return m("div.row",
                m("div.col offset-md-2 col-md-8",
                    m("h4", {style:"text-align:center;"}, "Donate"),
                    m("p", "Any donations are greatly appreciated. It will ensure continued development of this platform."),
                    Object.keys(accounts).map(function(key) {
                        return m("div", {style:"margin-bottom: 20px;"},
                            m("img", {src:"assets/" + key + "48.png", style:"margin-right:10px;"}),
                            m("span", {style:"word-wrap: break-word;"}, accounts[key])
                        )
                    })

                )
            )
        }

    }

})