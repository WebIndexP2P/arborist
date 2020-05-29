define(function(){

    return {

        view: function(vnode){
            return m("div.border rounded", {style:"padding:10px;"},
            m("form",
              m("div.form-group",
                m("label", "Title"),
                m("input.form-control", {id:"blogTitle", type:"text", autocomplete:"off"})
              ),
              m("div.form-group",
                m("label", "Author (optional)"),
                m("input.form-control", {style:"max-width:400px;", id:"blogAuthor", type:"text"})
              ),
              m("div.form-group",
                m("label", "Body"),
                m("textarea.form-control", {id:"blogBody", style:"height:300px;"})
              ),
              m("button.btn btn-outline-secondary", {onclick: vnode.attrs.onCancel, style:"margin-right:5px;"}, m("i.fa fa-times"), " Cancel"),
              m("button.btn btn-primary", {onclick: vnode.attrs.onPublish}, m("i.fa fa-save"), " Publish")
            )
          )
        }
    }
})