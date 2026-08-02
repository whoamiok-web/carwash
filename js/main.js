document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("navToggle");

  navToggle.addEventListener("click", () => {
    header.classList.toggle("open");
  });

  document.querySelectorAll(".nav a, .nav-cta").forEach((link) => {
    link.addEventListener("click", () => header.classList.remove("open"));
  });

  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    note.textContent = `${name}님, 예약 요청이 접수되었습니다. 곧 연락드리겠습니다!`;
    form.reset();
  });
});
