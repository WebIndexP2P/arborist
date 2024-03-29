'use strict'

define(function(){
    var secondsToHuman = function(seconds) {
        if (seconds == 0) return "Just now";
        if (seconds / 60 / 60 / 24 / 365 > 1) {
            var num = Math.round(seconds / 60 / 60 / 24 / 365);
            return num + ' year' + ((num > 1) ? 's': '');
        }
        if (seconds / 60 / 60 / 24 / 30 > 1) {
            var num = Math.round(seconds / 60 / 60 / 24 / 30);
            return num + ' month' + ((num > 1) ? 's': '');
        }
        if (seconds / 60 / 60 / 24 > 1) {
            var num = Math.round(seconds / 60 / 60 / 24);
            return num + ' day' + ((num > 1) ? 's': '');
        }
        if (seconds / 60 / 60 > 1) {
            var num = Math.round(seconds / 60 / 60);
            return num + ' hour' + ((num > 1) ? 's': '');
        }
        else if (seconds / 60 > 1) {
            var num  = Math.round(seconds / 60);
            return num + ' minute' + ((num > 1) ? 's': '');
        }
        else {
            return Math.round(seconds) + ' second' + ((seconds >= 2) ? 's': '');
        }
    }

    var replacer = function(match, pIndent, pKey, pVal, pEnd) {
        var key = '<span class=json-key>';
        var val = '<span class=json-value>';
        var str = '<span class=json-string>';
        var r = pIndent || '';
        if (pKey)
           r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
        if (pVal)
           r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
        return r + (pEnd || '');
    }

    var prettyPrint = function(obj) {
        if (obj == null) return;
        var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
        return JSON.stringify(obj, null, 3)
           .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
           .replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(jsonLine, replacer);
    }

    var dateSimpleFormat = function(date) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        return date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
    }

    var is_IP = function(str) {
      if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(str)) {
        return (true)
      }
      return (false)
    }

    var getReadableFileSizeString = function(fileSizeInBytes) {
      if (fileSizeInBytes < 1024) {
        return  fileSizeInBytes + " bytes";
      }
      var i = -1;
      var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
      do {
        fileSizeInBytes /= 1024;
        i++;
      } while (fileSizeInBytes > 1024);

      return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
    }

    return {
        secondsToHuman: secondsToHuman,
        prettyPrint: prettyPrint,
        dateSimpleFormat: dateSimpleFormat,
        is_IP: is_IP,
        getReadableFileSizeString: getReadableFileSizeString
    }
})
