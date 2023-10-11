function toggleMobileNav(btn) {
    btn.classList.toggle("bx-x");
    let header = document.getElementsByTagName("header")[0]
    if (!header.style.height || header.style.height == '48px') {
      header.style.height = header.scrollHeight + 'px';
    } else {
      header.style.height = '48px';
    }
}