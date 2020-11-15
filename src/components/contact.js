'use strict';

define(function() {

    return {

        view: function(vnode) {
            return m("div.row",
                m("div.col offset-md-2 col-md-8",
                    m("h4", {style:"text-align:center;"}, "Contact"),
                    m("p", "Want to get involved, or help out? Perhaps to discuss improvements or partnerships? Get in contact via the methods below:"),

                    m("div",
                        m("strong", m("i.fas fa-comments", {style:"font-size:30px;margin-right:5px;"}), "BitMessage"),
                        m("pre", "BM-2cXNZhyDtVUSohbLBv4Q2Kk3oZ3T2w72vT")
                    ),
                    m("div",
                        m("strong", m("i.fas fa-comments", {style:"font-size:30px;margin-right:5px;"}), "Matrix"),
                        m("pre", m("a", {href:"https://app.element.io/#/room/#wip2p:matrix.org"}, "#wip2p:matrix.org"))
                    ),
                    m("div",
                        m("strong", m("i.fas fa-comments", {style:"font-size:30px;margin-right:5px;"}), "Reddit"),
                        m("pre", m("a", {href:"https://www.reddit.com/r/wip2p"}, "/r/wip2p"))
                    )

                    /*m("div", {style:"margin-top:20px;"},
                        m("strong", m("i.fas fa-envelope", {style:"font-size:30px;margin-right:5px;"}), "I2P-Bote / SecureMail"),
                        m("pre", {style:'word-wrap:break-word;font-family:"Courier New", Courier, monospace;'}, "knpocS1LuPnRjxqu4j60s-zFgArP~q1Ykcf-h~FvorLvwP0lWTxskmwYK2~nD4K8LDMvVcCo~YWmtdzmYL2f2F")
                    )*/
                )
            )
        }

    }

})
