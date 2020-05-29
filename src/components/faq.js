'use strict';

/*
m("strong", "Q. ?"),
m("p", "A. "),
*/

define(function() {

    return {

        view: function(vnode) {
            return m("div.row",
                m("div.col offset-md-2 col-md-8",
                    m("h4", {style:"text-align:center;"}, "FAQ"),

                    m("strong", "Q. How do I sign up / log in?"),
                    m("p", "A. You can't, at least not in the traditional sense. Instead your browser will automatically generate a unique account when you first visit the website, this is essentially your account. Just make sure to backup the seed phrase to a safe place to restore your account if need be."),

                    m("strong", "Q. Why is there in invite system?"),
                    m("p", "A. The invite system is used to obtain p2p consensus on the state of the data. It also supports punishing abusers, which helps the platform scale."),

                    m("strong", "Q. How does the invite system work?"),
                    m("p", "A. The invite system is hierarchical, with one root node being level 0, and each invite being at least one level below the parent. There are a maximum of 10 levels currently. Each account level can invite a limited number of children, with level one allowed roughly 45 invites and level 9 just five. Level 10 invites are not allowed to invite."),
                    m("p", "If you lose your invite then all your child invites are also removed. Thankfully child accounts can have many invites to protect against being removed in a cascade removal event. It is recommended you obtain several invites across the hierarchy. It's also important to note that each invite starts out with a byte restriction of just 32 bytes and slowly increases over time, however it will not increase higher than your inviters limit."),
                    m("p", "By default the platform will assign your \"active inviter\" to the highest level account that has invited you. You are able to explicitely choose the invite you wish to use, and this is required if you want to invite others."),

                    m("strong", "Q. How do I backup my seed phrase?"),
                    m("p", "A. Click on the colored icon in the top right hand corner. A dropdown will appear with options relating to your account. Click on \"Show seed phrase\". Write down the 24 random words in the blue box."),

                    m("strong", "Q. How do I run my own node?"),
                    m("p", "A. P2P data replication has not been implemented, you can either volunteer to help write it or sit tight until its ready."),

                    m("strong", "Q. How is this P2P if its hosted at https://arborist.wip2p.eth.link?"),
                    m("p", "A. All .eth.link domains are aliases to IPFS content, the ENS team provide this aliasing service for people who don't use a decentralized browser."),

                    m("strong", "Q. What do the donations go towards?"),
                    m("p", "A. All donations will fund future development of this project, if you want to see it grow and improve, consider sending a donation."),

                    m("strong", "Q. Why does the bytes remaining count not appear to coincide with the data typed?"),
                    m("p", "A. All the data entered is converted into a IPLD document before being uploaded. If your data is a valid JSON document you will use less bytes than standard text. Similarily, if your JSON document is formatted incorrectly, it will save as the larger text format."),

                    m("strong", "Q. Where can I find the source code?"),
                    m("p", "A. The UI source can be viewed in your browser by right clicking and \"View page source\". The backend source code will be published once the P2P replication is working correctly."),

                    m("p", "Got more questions? Send them via the ", m("a", {href:"/contact", oncreate:m.route.link}, "contact"), " page and we'll add them to the FAQ.")
                )
            )
        }

    }

})
