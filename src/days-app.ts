// src/days-app.ts

type DaysResponse = { days: number; error?: string };

const form = document.getElementById("dateForm") as HTMLFormElement | null;
const output = document.getElementById("output") as HTMLDivElement | null;

if (form && output) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dateInput = document.getElementById("date") as HTMLInputElement | null;
    const date = dateInput?.value;

    if (!date) {
      output.innerHTML = `<div class="result error">Введите дату</div>`;
      return;
    }

    output.innerHTML = "Считаем...";

    try {
      const res = await fetch("/api/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });

      const data: DaysResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");

      const days = Math.abs(data.days);
      const text = data.days >= 0 ? "Прошло" : "Осталось";
      const word =
        days === 1
          ? "день"
          : days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)
          ? "дня"
          : "дней";

      output.innerHTML = `<div class="result">${text} <span class="highlight">${days}</span> ${word}</div>`;
    } catch (err: any) {
      output.innerHTML = `<div class="result error">Ошибка: ${err.message}</div>`;
    }
  });
}
