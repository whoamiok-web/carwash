document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("navToggle");

  navToggle.addEventListener("click", () => {
    header.classList.toggle("open");
  });

  document.querySelectorAll(".nav a, .nav-cta").forEach((link) => {
    link.addEventListener("click", () => header.classList.remove("open"));
  });

  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.min = new Date().toISOString().split("T")[0];
  }
});
