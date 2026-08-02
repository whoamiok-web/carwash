document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("navToggle");

  navToggle.addEventListener("click", () => {
    header.classList.toggle("open");
  });

  document.querySelectorAll(".nav a, .nav-cta").forEach((link) => {
    link.addEventListener("click", () => header.classList.remove("open"));
  });

  const KAKAO_CHAT_URL = "https://open.kakao.com/o/sCly4WGi";

  const dateInput = document.getElementById("date");
  if (dateInput) {
    dateInput.min = new Date().toISOString().split("T")[0];
  }

  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const service = document.getElementById("service").value;
    const message = document.getElementById("message").value.trim();

    const summary = [
      "[전일 손세차 예약 문의]",
      `이름: ${name}`,
      `연락처: ${phone}`,
      `방문 희망일시: ${date} ${time}`,
      `희망 서비스: ${service}`,
      message ? `요청사항: ${message}` : null,
    ].filter(Boolean).join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      note.textContent = "예약 내용이 복사되었습니다. 열린 카카오톡 채팅창에 붙여넣어 보내주세요.";
    } catch (err) {
      note.textContent = "카카오톡 채팅창에 아래 내용을 직접 입력해 보내주세요: " + summary;
    }

    window.open(KAKAO_CHAT_URL, "_blank", "noopener");
    form.reset();
  });
});
