const ResultScreen = (() => {
  const R = 84;
  const CIRC = 2 * Math.PI * R;

  const TIERS = [
    {
      min: 100,
      c: "--rs-green",
      t: "Xuất sắc",
      l: "Điểm tuyệt đối!.",
      mood: "happy",
    },
    {
      min: 90,
      c: "--rs-green",
      t: "Giỏi",
      l: "Gần như hoàn hảo, rất xuất sắc.",
      mood: "happy",
    },
    {
      min: 70,
      c: "--rs-yellow",
      on: "#1d1b4b",
      t: "Khá",
      l: "Xem lại vài câu là sẽ làm bài tốt.",
      mood: "happy",
    },
    {
      min: 50,
      c: "--rs-amber",
      t: "Ổn",
      l: "Đang tiến bộ. Ôn lại các câu đỏ nhé.",
      mood: "calm",
    },
    {
      min: 0,
      c: "--rs-red",
      t: "Cần cố gắn",
      l: "Không sao cả, hãy thử lại nào!",
      mood: "calm",
    },
  ];

  let token = 0; // cancels an older animation when show() is called again
  let settle = null; // resolves the coin-save outcome

  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fmtTime = (s) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  function countTo(el, from, to, dur, fmt) {
    return new Promise((res) => {
      if (dur <= 1) {
        el.textContent = fmt(to);
        return res();
      }
      const t0 = performance.now();
      (function f(t) {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(Math.round(from + (to - from) * ease(k)));
        k < 1 ? requestAnimationFrame(f) : res();
      })(t0);
    });
  }

  function flyCoins(fromEl, toEl, n) {
    const from = fromEl.getBoundingClientRect();
    const to = toEl.getBoundingClientRect();
    return Promise.all(
      Array.from(
        { length: n },
        (_, i) =>
          new Promise((res) => {
            const c = document.createElement("div");
            c.className = "rs-coinfx";
            document.body.appendChild(c);
            const x0 = from.left + from.width / 2 - 9;
            const y0 = from.top + from.height / 2 - 9;
            const x1 = to.left + 12;
            const y1 = to.top + to.height / 2 - 9;
            const a = c.animate(
              [
                {
                  transform: `translate(${x0}px,${y0}px) scale(.6)`,
                  opacity: 0,
                },
                {
                  transform: `translate(${x0 + (Math.random() - 0.5) * 60}px,${y0 - 40 - Math.random() * 30}px) scale(1)`,
                  opacity: 1,
                  offset: 0.3,
                },
                {
                  transform: `translate(${x1}px,${y1}px) scale(.7)`,
                  opacity: 0.9,
                },
              ],
              { duration: 750, delay: i * 70, easing: "ease-in", fill: "both" },
            );
            a.onfinish = () => {
              c.remove();
              res();
            };
          }),
      ),
    );
  }

  function confetti(el) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const cols = ["#f5a400", "#1fa85a", "#e8405f", "#6c5ce7"];
    for (let i = 0; i < 40; i++) {
      const p = document.createElement("div");
      p.className = "rs-conf";
      p.style.background = cols[i % 4];
      document.body.appendChild(p);
      const ang = Math.random() * Math.PI * 2;
      const d = 90 + Math.random() * 130;
      p.animate(
        [
          { transform: `translate(${cx}px,${cy}px) rotate(0)`, opacity: 1 },
          {
            transform: `translate(${cx + Math.cos(ang) * d}px,${cy + Math.sin(ang) * d + 80}px) rotate(${Math.random() * 720}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 1100 + Math.random() * 600,
          easing: "cubic-bezier(.1,.7,.4,1)",
        },
      ).onfinish = () => p.remove();
    }
  }

  function show(o) {
    const host =
      typeof o.host === "string"
        ? document.querySelector(o.host)
        : o.host || document.getElementById("resultHost");
    if (!host) {
      console.warn("ResultScreen: #resultHost not found");
      return;
    }

    const my = ++token;
    const total = Number(o.total) || 0;
    const correct = Number(o.correct) || 0;
    const wrong = Math.max(0, total - correct);
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const tier = TIERS.find((t) => pct >= t.min);
    const hasCoins = typeof o.coins === "number";
    const hasTime = typeof o.seconds === "number";
    const results = Array.isArray(o.results) ? o.results : [];
    const fast = o.animate === false || reducedMotion();
    const waitForSave = hasCoins && !o.saved;

    // keep the old text element in sync if the page still has it
    const legacy = document.getElementById("scoreText");
    if (legacy) legacy.innerText = `${correct} / ${total} Câu Đúng`;

    const nodes = results
      .map(
        (ok, i) =>
          `<button class="rs-node ${ok ? "ok" : "bad"}" role="listitem" data-n="${i + 1}" aria-label="Câu ${i + 1}: ${ok ? "đúng" : "sai"}">${i + 1}</button>`,
      )
      .join("");

    host.innerHTML = `
<div class="rs" style="--rs-tier:var(${tier.c});--rs-on:${tier.on || "#fff"}">
  <div class="rs-card" aria-live="polite">
    <div class="rs-gauge">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle class="rs-track" cx="100" cy="100" r="${R}"/>
        <circle class="rs-ticks" cx="100" cy="100" r="${R}"/>
        <circle class="rs-arc" cx="100" cy="100" r="${R}"/>
      </svg>
      <div class="rs-center">
        <div class="rs-score"><b class="rs-num">0</b><span>/${total}</span></div>
        <div class="rs-pct">0%</div>
      </div>
    </div>
    <div class="rs-rank"><h2>${tier.t}</h2><p>${tier.l}</p></div>
    <div class="rs-chips">
      <div class="rs-chip ok"><b class="rs-c-ok">0</b><span>Đúng</span></div>
      <div class="rs-chip bad"><b class="rs-c-bad">0</b><span>Sai</span></div>
      ${hasTime ? `<div class="rs-chip"><b class="rs-c-time">0:00</b><span>Thời gian</span></div>` : ""}
      ${hasCoins ? `<div class="rs-chip rs-chip-coin coin" style="display: none";><b class="rs-c-coin">+0</b><span>Xu</span></div>` : ""}
    </div>
    ${
      results.length
        ? `<div class="rs-strip" role="list">${nodes}</div>
    <div class="rs-legend"><span><i style="background:var(--rs-green)"></i>Đúng</span><span><i style="background:var(--rs-red)"></i>Sai</span></div>`
        : ""
    }
  </div>
</div>`;

    const root = host.firstElementChild;
    const $ = (s) => root.querySelector(s);

    root.querySelectorAll(".rs-node").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const n = Number.parseInt(btn.dataset.n, 10);
        if (!Number.isFinite(n)) return;
        if (typeof o.onJump === "function") o.onJump(n);
      });
    });

    const saved = waitForSave
      ? new Promise((res) => {
          settle = res;
        })
      : null;

    (async () => {
      try {
        // 1. ring + score
        const arc = $(".rs-arc");
        arc.style.strokeDasharray = CIRC;
        arc.style.strokeDashoffset = CIRC;
        const dur = fast ? 1 : 1600;
        const t0 = performance.now();
        await new Promise((res) => {
          (function f(t) {
            if (my !== token) return res();
            const k = Math.min(1, (t - t0) / dur);
            const e = ease(k);
            arc.style.strokeDashoffset = CIRC * (1 - (pct / 100) * e);
            $(".rs-num").textContent = Math.round(correct * e);
            $(".rs-pct").textContent = Math.round(pct * e) + "%";
            k < 1 ? requestAnimationFrame(f) : res();
          })(t0);
        });
        if (my !== token) return;

        // 2. rank + chips
        $(".rs-rank").classList.add("rs-go");
        $(".rs-chips").classList.add("rs-go");
        if (pct >= 90 && !fast) confetti($(".rs-gauge"));
        const cd = fast ? 1 : 500;
        countTo($(".rs-c-ok"), 0, correct, cd, (v) => String(v));
        countTo($(".rs-c-bad"), 0, wrong, cd, (v) => String(v));
        if (hasTime) $(".rs-c-time").textContent = fmtTime(o.seconds);
        if (hasCoins) {
          await countTo(
            $(".rs-c-coin"),
            0,
            o.coins,
            fast ? 1 : 700,
            (v) => "+" + v,
          );
        } else if (!fast) {
          await sleep(500);
        }
        if (my !== token) return;

        // 3. question strip
        root
          .querySelectorAll(".rs-node")
          .forEach((n, i) =>
            setTimeout(() => n.classList.add("rs-in"), fast ? 0 : i * 28),
          );
        if (!fast) await sleep(results.length * 28 + 200);
        if (my !== token) return;

        // 4. coins -> wallet (only when the save is still pending)
        if (waitForSave) {
          const r = await saved;
          if (my !== token) return;
          const w = $(".rs-wallet");
          const wb = w ? w.querySelector("b") : null;

          if (!w || !wb) {
            return;
          }

          if (!r.ok) {
            w.classList.remove("rs-pending");
            w.classList.add("rs-fail");
            wb.textContent = "Chưa lưu được xu";
            return;
          }
          if (typeof r.balance === "number") {
            if (!fast && o.coins > 0) {
              await flyCoins(
                $(".rs-chip-coin"),
                w,
                Math.min(10, Math.max(3, Math.ceil(o.coins / 8))),
              );
              if (my !== token) return;
            }
            const from = Math.max(0, r.balance - o.coins);
            await countTo(wb, from, r.balance, fast ? 1 : 600, (v) =>
              String(v),
            );
          } else {
            wb.textContent = "Đã lưu xu";
          }
          w.classList.remove("rs-pending");
        }
      } catch (err) {
        console.error("ResultScreen error:", err);
      }
    })();
  }

  function coinsSaved(newBalance) {
    if (settle) settle({ ok: true, balance: newBalance });
  }
  function coinsFailed() {
    if (settle) settle({ ok: false });
  }

  return { show, coinsSaved, coinsFailed };
})();
