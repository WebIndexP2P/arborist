'use strict';

define(function() {

    var refreshListeners = {};

    var subscribe = function(name, callback) {
        var bFound = false;
        var idx;

        if (refreshListeners.hasOwnProperty(name) == false) {
            refreshListeners[name] = [];
        }
        var listeners = refreshListeners[name];

        for (var a = 0; a < listeners.length; a++) {
            if (listeners[a] == null) {
                idx = a;
                bFound = true;
                break;
            }
        }
        if (bFound)
            listeners[a] = callback;
        else
            var idx = listeners.push(callback) - 1;

        return idx;
    }

    var unsubscribe = function(name, idx) {
        refreshListeners[name][idx] = null;
    }

    var trigger = function(name, data) {

        if (window.logAppEvents) {
          var output = "AppEvent Trigger: [" + name + "]";
          if (data != null)
            output += " " + JSON.stringify(data);
          console.log(output)
        }

        if (refreshListeners.hasOwnProperty(name) == false)
          return;

        for (var a = 0; a < refreshListeners[name].length; a++) {
            if (refreshListeners[name][a] != null)
                refreshListeners[name][a](data);
        }
    }

    return {
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        trigger: trigger
    }


})
