'use strict';

define(function() {

  var changeLogWebsocket = function(e) {
    window.logWebsocket = e.srcElement.checked;
    localStorage.setItem('logWebsocket', window.logWebsocket);
  }

  var changeLogAppEvents = function(e) {
    window.logAppEvents = e.srcElement.checked;
    localStorage.setItem('logAppEvents', window.logAppEvents);
  }

  return {

    view: function(vnode) {
      return m("form",
        m("h4", {style:"text-align:center;"}, "Debugging"),
        m("div.form-check",
          m("input.form-check-input", {type:"checkbox", onchange: changeLogWebsocket, checked: window.logWebsocket}),
          m("label.form-check-label", "Log websocket to console")
        ),
        m("div.form-check",
          m("input.form-check-input", {type:"checkbox", onchange: changeLogAppEvents, checked: window.logAppEvents}),
          m("label.form-check-label", "Log app events to console")
        )
      )
    }
  }

})
