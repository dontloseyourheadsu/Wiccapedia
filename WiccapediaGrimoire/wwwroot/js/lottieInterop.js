const instances = new WeakMap();

export function renderLottie(container, animationData) {
  if (!container || typeof lottie === "undefined") {
    return;
  }

  const existing = instances.get(container);
  if (existing) {
    existing.destroy();
    instances.delete(container);
  }

  if (!animationData) {
    container.innerHTML = "";
    return;
  }

  try {
    const parsed =
      typeof animationData === "string"
        ? JSON.parse(animationData)
        : animationData;
    const anim = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: parsed,
    });

    anim.setSpeed(0.9);
    instances.set(container, anim);
  } catch {
    container.innerHTML = "";
  }
}
