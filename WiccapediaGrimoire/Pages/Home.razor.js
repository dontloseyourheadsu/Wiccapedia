/**
 * Call lottie animation start function
 *  lottie.loadAnimation({ container: document.getElementById('animation-container'), renderer: 'svg', loop: true, autoplay: true, path: 'YOUR_FREE_FILE.json' // <--- Point this to your file });
 */
export function startLottieAnimation(container, animationPath) {
  if (typeof lottie === "undefined") {
    console.error("Lottie library is not loaded.");
    return;
  }
  lottie.loadAnimation({
    container: container,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: animationPath,
  });
}
