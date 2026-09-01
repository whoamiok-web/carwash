const NTFY_TOPIC = "jeonil-cw-4271";

function encodeHeaderText(text) {
  const base64 = btoa(unescape(encodeURIComponent(text)));
  return `=?UTF-8?B?${base64}?=`;
}

function notifyOwner(date, time) {
  fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: "POST",
    headers: {
      Title: encodeHeaderText("전일 손세차 - 새 예약"),
      Priority: "high",
    },
    body: `새 예약이 들어왔습니다 (${date} ${time}). 예약현황에서 확인하세요.`,
  }).catch((err) => console.error("owner notify failed", err));
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form || typeof firebase === "undefined") return;

  const db = firebase.firestore();
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  const note = document.getElementById("formNote");
  const submitBtn = form.querySelector('button[type="submit"]');

  const baseLabels = Array.from(timeSelect.options).map((opt) => opt.value);

  function renderTimes(takenTimes) {
    Array.from(timeSelect.options).forEach((opt, i) => {
      const taken = takenTimes.includes(opt.value);
      opt.disabled = taken;
      opt.textContent = taken ? `${baseLabels[i]} (마감)` : baseLabels[i];
    });
    if (timeSelect.selectedOptions[0] && timeSelect.selectedOptions[0].disabled) {
      const firstOpen = Array.from(timeSelect.options).find((o) => !o.disabled);
      if (firstOpen) timeSelect.value = firstOpen.value;
    }
  }

  let unsubscribe = null;

  function watchDate(date) {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (!date) {
      renderTimes([]);
      return;
    }
    unsubscribe = db
      .collection("availability")
      .doc(date)
      .onSnapshot(
        (snap) => renderTimes(snap.exists ? snap.data().times || [] : []),
        (err) => console.error("availability watch failed", err)
      );
  }

  dateInput.addEventListener("change", () => watchDate(dateInput.value));
  if (dateInput.value) watchDate(dateInput.value);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = dateInput.value;
    const time = timeSelect.value;
    const service = document.getElementById("service").value;
    const message = document.getElementById("message").value.trim();

    if (!date) {
      note.textContent = "방문 희망일을 선택해주세요.";
      return;
    }

    submitBtn.disabled = true;
    note.textContent = "예약 처리 중...";

    const availRef = db.collection("availability").doc(date);
    const bookingRef = db.collection("bookings").doc(`${date}_${time}`);

    try {
      await db.runTransaction(async (tx) => {
        const availSnap = await tx.get(availRef);
        const takenTimes = availSnap.exists ? availSnap.data().times || [] : [];
        if (takenTimes.includes(time)) {
          throw new Error("ALREADY_BOOKED");
        }
        tx.set(availRef, { times: [...takenTimes, time] }, { merge: true });
        tx.set(bookingRef, {
          name,
          phone,
          date,
          time,
          service,
          message,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      });

      note.textContent = `${name}님, ${date} ${time} 예약이 확정되었습니다!`;
      notifyOwner(date, time);
      form.reset();
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      renderTimes([]);
    } catch (err) {
      if (err.message === "ALREADY_BOOKED") {
        note.textContent = "방금 다른 손님이 먼저 예약한 시간입니다. 다른 시간을 선택해주세요.";
        watchDate(date);
      } else {
        console.error("booking failed", err);
        note.textContent = "예약 중 오류가 발생했습니다. 카카오톡으로 문의해주세요.";
      }
    } finally {
      submitBtn.disabled = false;
    }
  });
});
