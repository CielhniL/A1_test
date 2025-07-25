const wrapper = document.querySelector('.responsive-wrapper');
      wrapper.addEventListener('wheel', e => {
        e.preventDefault();
        wrapper.scrollLeft += e.deltaY;
      }, { passive: false });