'use strict';

define(function() {
    var overrideMithrilRouting = function() {
        var setOrig = m.route.set;
        m.route.set = function(path, data, options){
            setOrig(path, data, options);
            window.scrollTo(0,0);
        }
    }

    var restoreScrollPositions = function() {
        window.pageScrollPositions = {};

        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        window.addEventListener('scroll', function() {
            window.pageScrollPositions[window.location.hash] = window.pageYOffset || document.documentElement.scrollTop;
        })

        $(window).on('popstate', function(e) {
            var scrollPos = window.pageScrollPositions[e.target.location.hash];
            if (scrollPos > 0) {
                setTimeout(function(){
                    window.scrollTo(0, scrollPos);
                }, 100);
            }
        })
    }

    return {
        overrideMithrilRouting: overrideMithrilRouting,
        restoreScrollPositions: restoreScrollPositions
    }
    
})