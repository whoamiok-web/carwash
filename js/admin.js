document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const loginView = document.getElementById("loginView");
  const dashboardView = document.getElementById("dashboardView");
  const loginForm = document.getElementById("loginForm");
  const loginNote = document.getElementById("loginNote");
  const logoutBtn = document.getElementById("logoutBtn");
  const whoami = document.getElementById("whoami");
  const bookingCount = document.getElementById("bookingCount");
  const bookingGroups = document.getElementById("bookingGroups");

  let unsubscribeBookings = null;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    loginNote.textContent = "로그인 중...";
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      loginNote.textContent = "로그인 실패: 이메일 또는 비밀번호를 확인해주세요.";
    }
  });

  logoutBtn.addEventListener("click", () => auth.signOut());

  auth.onAuthStateChanged((user) => {
    if (user) {
      loginView.classList.add("admin-hidden");
      dashboardView.classList.remove("admin-hidden");
      logoutBtn.classList.remove("admin-hidden");
      whoami.textContent = user.email;
      loginForm.reset();
      loginNote.textContent = "";
      subscribeBookings();
    } else {
      loginView.classList.remove("admin-hidden");
      dashboardView.classList.add("admin-hidden");
      logoutBtn.classList.add("admin-hidden");
      whoami.textContent = "";
      if (unsubscribeBookings) {
        unsubscribeBookings();
        unsubscribeBookings = null;
      }
    }
  });

  function subscribeBookings() {
    if (unsubscribeBookings) return;
    unsubscribeBookings = db
      .collection("bookings")
      .orderBy("date")
      .onSnapshot(
        (snapshot) => {
          const bookings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          bookings.sort((a, b) =>
            a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)
          );
          renderBookings(bookings);
        },
        (err) => {
          console.error("bookings watch failed", err);
          bookingCount.textContent = "예약 목록을 불러오지 못했습니다.";
        }
      );
  }

  function renderBookings(bookings) {
    const today = new Date().toISOString().split("T")[0];
    const upcoming = bookings.filter((b) => b.date >= today);

    bookingCount.textContent = upcoming.length
      ? `예정된 예약 ${upcoming.length}건`
      : "예정된 예약이 없습니다.";

    const groups = new Map();
    upcoming.forEach((b) => {
      if (!groups.has(b.date)) groups.set(b.date, []);
      groups.get(b.date).push(b);
    });

    bookingGroups.innerHTML = "";
    groups.forEach((rows, date) => {
      const group = document.createElement("div");
      group.className = "booking-group";

      const heading = document.createElement("p");
      heading.className = "rate-group-title";
      heading.textContent = date;
      group.appendChild(heading);

      rows.forEach((b) => {
        const row = document.createElement("div");
        row.className = "booking-row";
        row.innerHTML = `
          <div class="booking-row-time">${b.time}</div>
          <div class="booking-row-info">
            <p class="booking-row-name">${escapeHtml(b.name)} · ${escapeHtml(b.service || "")}</p>
            <p class="booking-row-meta">${escapeHtml(b.phone)}${b.message ? " · " + escapeHtml(b.message) : ""}</p>
          </div>
          <button type="button" class="btn btn-outline booking-cancel-btn">취소</button>
        `;
        row.querySelector(".booking-cancel-btn").addEventListener("click", () => cancelBooking(b));
        group.appendChild(row);
      });

      bookingGroups.appendChild(group);
    });
  }

  async function cancelBooking(booking) {
    if (!confirm(`${booking.date} ${booking.time} · ${booking.name}님 예약을 취소할까요?`)) return;
    try {
      await Promise.all([
        db.collection("bookings").doc(booking.id).delete(),
        db
          .collection("availability")
          .doc(booking.date)
          .update({ times: firebase.firestore.FieldValue.arrayRemove(booking.time) }),
      ]);
    } catch (err) {
      console.error("cancel failed", err);
      alert("취소 중 오류가 발생했습니다.");
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }
});
