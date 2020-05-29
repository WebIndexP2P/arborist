'use strict';

define([
    'lib/utils'
], function(
    Utils
) {

    return {

        view: function(vnode) {

          var sizeLimit;
          var remainingBytesElement;
          var nextUpgradeElement;
          var activeLvlElement;
          var activeLvl;

          if (vnode.attrs.accountDetails == null) {
            return m("div","...");
          } else if (vnode.attrs.accountDetails == 'account not found') {
            sizeLimit = 32;
          } else {
            sizeLimit = vnode.attrs.accountDetails.activeSizeLimit;
            activeLvl = vnode.attrs.accountDetails.activeLevel;
            activeLvlElement = m("div", "Account hierarchy level: ", activeLvl);
            var daysHeadstartAsSeconds = vnode.attrs.accountDetails.daysHeadstart * 24 * 60 * 60;
            var nextUpgradeDaysAsSeconds = vnode.attrs.accountDetails.nextUpgradeDays * 24 * 60 * 60;
            var adjustedNextUpgrade = nextUpgradeDaysAsSeconds - daysHeadstartAsSeconds;
            var upgradeTarget = vnode.attrs.accountDetails.activeInviteTimestamp + adjustedNextUpgrade;
            var timeUntilTarget = upgradeTarget - Math.round((new Date()).getTime() / 1000);
            if (timeUntilTarget <= 0)
              nextUpgradeElement = m("div", "Size restriction increase on next paste");
            else {
              nextUpgradeElement = m("div", "Size restriction increase available in ", Utils.secondsToHuman(timeUntilTarget));
            }
          }

          if (vnode.attrs.byteSize == 'recalc') {
            remainingBytesElement = m("button.btn btn-warning btn-sm", {style:"margin-top:5px;", onclick: vnode.attrs.pasteRecalcCallback},
              m("i.fas fa-save"), " ",
              "Calculate remaining bytes"
            );
          } else {
            var remainingBytes = sizeLimit - vnode.attrs.byteSize;
            var oversizedClass = "";
            if (remainingBytes < 0) {
              oversizedClass = "color: red;";
            }
            remainingBytesElement = m("div", {style: oversizedClass}, remainingBytes, " byte", (remainingBytes==1)?"":"s", " remaining");
          }


            return m("div",
                // remainingBytes
                remainingBytesElement,
                // next upgrade
                //nextUpgradeElement,
                // Account level
                activeLvlElement
            )
        }
    }
})
