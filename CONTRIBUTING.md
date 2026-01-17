# Contribute to Npm Userscript

At the moment, this document only contains debugging notes and is not complete.

## How to debug network requests

Since the userscript uses `GM.xmlHttpRequest()` and not `fetch()` (to bypass CSP restrictions in Chrome Tampermonkey, because of Manifest V3), network requests are being logged from the browser extension context rather than the page context.

To access the network tab:

- [Safari Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887): Develop Menu > Web Extension Background Content > Userscripts > Network Tab
- [Chrome Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo): `chrome://extensions` > Enable Developer mode > Tampermonkey details > Inspect views: offscreen.html > Network Tab (You may need to refresh an npm page with the userscript active for offscreen.html to appear)
