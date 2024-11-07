// fabricwrapper.js

// A promise that loads Fabric.js only once
let HammerPromise;

function loadHammer() {
  if (!HammerPromise) {
    HammerPromise = new Promise((resolve, reject) => {
      // If `fabric` is already on `window`, we can resolve immediately
      if (window.fabric) {
        resolve(window.fabric);
        return;
      }

      const script = document.createElement('script');
      script.src = './libraries/hammer.js'; // Adjust the path as necessary
      script.async = false; // Ensure synchronous loading

      script.onload = () => {
        resolve();
      };

      script.onerror = () => reject(new Error('Failed to load Fabric.js'));

      document.head.appendChild(script);
    });
  }
  return HammerPromise;
}

await loadHammer();

// Synchronously exported `fabric` that will be assigned after loading
export let Hammer = window.Hammer;
