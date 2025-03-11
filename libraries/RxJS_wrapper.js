// fabricwrapper.js

// A promise that loads Fabric.js only once
let RxJSPromise;

function loadRxJS() {
  if (!RxJSPromise) {
    RxJSPromise = new Promise((resolve, reject) => {
      // If `fabric` is already on `window`, we can resolve immediately
      if (window.fabric) {
        resolve(window.fabric);
        return;
      }

      const script = document.createElement('script');
      script.src = './libraries/RxJS.js'; // Adjust the path as necessary
      script.async = false; // Ensure synchronous loading

      script.onload = () => {
        resolve();
      };

      script.onerror = () => reject(new Error('Failed to load RxJS.js'));

      document.head.appendChild(script);
    });
  }
  return RxJSPromise;
}

await loadRxJS();

// Synchronously exported `fabric` that will be assigned after loading
export let RxJS = window.rxjs;
export let Subject = window.rxjs.Subject;