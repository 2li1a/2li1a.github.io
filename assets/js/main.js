(function () {
  const toggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  const closeSidebar = () => {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    document.body.classList.remove("no-scroll");
  };

  const openSidebar = () => {
    if (!sidebar || !overlay) return;
    sidebar.classList.add("open");
    overlay.classList.add("show");
    document.body.classList.add("no-scroll");
  };

  if (toggle && sidebar && overlay) {
    toggle.addEventListener("click", () => {
      if (sidebar.classList.contains("open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    overlay.addEventListener("click", closeSidebar);

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1000) {
        closeSidebar();
      }
    });
  }

  document.querySelectorAll("[data-stagger]").forEach((element, index) => {
    element.style.animationDelay = `${index * 80}ms`;
  });
})();
