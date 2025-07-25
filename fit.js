// fit.js
(function(){
  const wrapper = document.querySelector('.responsive-wrapper');
  // kích thước gốc thiết kế
  const origW = 1920;
  const origH = 1080;

  function fit() {
    if (!wrapper) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // scale sao cho vừa cả chiều ngang và dọc
    const scale = Math.min(vw / origW, vh / origH);

    // apply lên wrapper (chứa .v72_2 + .footer)
    wrapper.style.transform       = `scale(${scale})`;
    wrapper.style.transformOrigin = 'top left';
    // để wrapper không tạo scroll nào
    wrapper.style.width  = `${origW}px`;
    wrapper.style.height = `${origH}px`;
  }

  window.addEventListener('load',  fit);
  window.addEventListener('resize', fit);
})();


