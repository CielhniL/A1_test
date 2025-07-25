// letter.js
document.addEventListener('DOMContentLoaded', () => {
  const letters = Array.from(
    document.querySelectorAll('.v72_53, .v72_54, .v72_55, .v72_56, .v72_57')
  );
  const amplitude = 40;
  const speed     = 0.1;
  const eSpeed    = 0.5;
  const sSpeed    = 0.4;

  // inline-block đã có CSS, bây giờ animate bằng requestAnimationFrame
  function animate(t) {
    const time = t / 1000; // ms -> s
    letters.forEach((el, i) => {
      const phase = (i * 2 * Math.PI) / letters.length;
      // up/down
      const y = Math.sin(time * speed * 2 * Math.PI + phase) * amplitude;
      let tf = `translateY(${y}px)`;

      // morph "e" (index 3)
      if (i === 3) {
        const s = 1 + 0.1 * Math.sin(time * eSpeed * 2 * Math.PI + phase);
        tf += ` scale(${s},${1 / s})`;
      }
      // morph "s" (index 4)
      else if (i === 4) {
        const deg = Math.sin(time * sSpeed * 2 * Math.PI + phase) * 5;
        tf += ` rotate(${deg}deg)`;
      }

      el.style.transform = tf;
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
