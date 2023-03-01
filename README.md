## Things to keep in mind from [this guide](https://web.dev/learn/pwa/service-workers/)

- SWs only control code from the directory they are registered in and below
- After installation and activation the service worker will not take control of the page until the next time the page is loaded (or moving to a new tab)
- There is no guarantee that in-memory state will persist (you can use IndexedDB to store data)
- SWs are fully async
- APIs such as synchronous XHR and Web Storage can't be used inside SWs because they are blocking
- In Firefox, service worker APIs are also hidden and cannot be used when the user is in private browsing mode
- By default, a page's fetches won't go through a service worker unless the page request itself went through a service worker. So you'll need to refresh the page to see the effects of the service worker.
- clients.claim() can override this default, and take control of non-controlled pages.
