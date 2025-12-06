/**
 * Call lottie animation start function
 *  lottie.loadAnimation({ container: document.getElementById('animation-container'), renderer: 'svg', loop: true, autoplay: true, path: 'YOUR_FREE_FILE.json' // <--- Point this to your file });
 */
export function startLottieAnimation(container, animationData) {
  if (typeof lottie === "undefined") {
    console.error("Lottie library is not loaded.");
    return;
  }

  // Parse if it's a string, otherwise use as object
  const animData =
    typeof animationData === "string"
      ? JSON.parse(animationData)
      : animationData;

  const anim = lottie.loadAnimation({
    container: container,
    renderer: "svg",
    loop: false,
    autoplay: true,
    animationData: animData, // Use animationData instead of path
  });
  anim.setSpeed(0.5);
}
