(() => {
	"use strict";

	if (window.__ZSHOP_SKIN_ASSISTANT__) return;
	window.__ZSHOP_SKIN_ASSISTANT__ = true;

	const currentScript = document.currentScript;
	const WORKER_BASE = currentScript?.src
		? new URL(currentScript.src).origin
		: "https://llm-chat-app-template.zshopnajafabad.workers.dev";
	const STORAGE_KEY = "zshop_skin_assistant_history_v1";
	const MAX_HISTORY = 12;

	const host = document.createElement("div");
	host.id = "zshop-skin-assistant-host";
	document.body.appendChild(host);
	const root = host.attachShadow({ mode: "open" });

	root.innerHTML = `
		<style>
			:host { all: initial; }
			*, *::before, *::after { box-sizing: border-box; }
			.zs-wrap {
				--green: #034f3f;
				--green-2: #0b6653;
				--cream: #fbf8f1;
				--gold: #efd596;
				--text: #17332c;
				--muted: #718078;
				--line: #e4e8e3;
				font-family: Tahoma, Arial, sans-serif;
				direction: rtl;
				color: var(--text);
			}
			.zs-launcher {
				position: fixed;
				right: max(18px, env(safe-area-inset-right));
				bottom: max(22px, env(safe-area-inset-bottom));
				z-index: 2147483000;
				width: 62px;
				height: 62px;
				border: 2px solid rgba(255,255,255,.75);
				border-radius: 22px;
				background: var(--green);
				color: #fff;
				box-shadow: 0 14px 35px rgba(3,79,63,.3);
				cursor: pointer;
				display: grid;
				place-items: center;
				transition: transform .2s ease, box-shadow .2s ease;
				-webkit-tap-highlight-color: transparent;
			}
			.zs-launcher:hover { transform: translateY(-2px); box-shadow: 0 18px 42px rgba(3,79,63,.36); }
			.zs-launcher:focus-visible { outline: 3px solid var(--gold); outline-offset: 3px; }
			.zs-launcher svg { width: 29px; height: 29px; }
			.zs-pulse {
				position: absolute;
				top: -5px;
				left: -5px;
				min-width: 24px;
				height: 24px;
				padding: 0 6px;
				border-radius: 999px;
				background: var(--gold);
				color: var(--green);
				font: 700 12px/24px Tahoma, sans-serif;
				border: 2px solid #fff;
			}
			.zs-panel {
				position: fixed;
				right: max(18px, env(safe-area-inset-right));
				bottom: calc(max(22px, env(safe-area-inset-bottom)) + 76px);
				z-index: 2147483001;
				width: min(392px, calc(100vw - 36px));
				height: min(650px, calc(100dvh - 130px));
				min-height: 470px;
				border-radius: 28px;
				background: #fff;
				box-shadow: 0 26px 80px rgba(15,49,40,.27);
				border: 1px solid rgba(3,79,63,.12);
				overflow: hidden;
				display: flex;
				flex-direction: column;
				transform-origin: bottom right;
				transition: opacity .2s ease, transform .2s ease, visibility .2s;
			}
			.zs-panel[hidden] { display: flex; opacity: 0; visibility: hidden; transform: translateY(14px) scale(.96); pointer-events: none; }
			.zs-header {
				background: linear-gradient(145deg, var(--green), #073f35);
				color: #fff;
				padding: 18px 18px 16px;
				display: flex;
				align-items: center;
				gap: 12px;
			}
			.zs-avatar {
				width: 48px;
				height: 48px;
				border-radius: 17px;
				background: var(--gold);
				color: var(--green);
				display: grid;
				place-items: center;
				font-size: 23px;
				flex: 0 0 auto;
			}
			.zs-heading { min-width: 0; flex: 1; }
			.zs-title { margin: 0; font-size: 17px; font-weight: 800; line-height: 1.5; }
			.zs-status { margin: 2px 0 0; font-size: 11px; color: rgba(255,255,255,.78); }
			.zs-status::before { content: ""; display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #76d7a5; margin-left: 6px; }
			.zs-close {
				width: 38px;
				height: 38px;
				border: 1px solid rgba(255,255,255,.22);
				border-radius: 13px;
				background: rgba(255,255,255,.08);
				color: #fff;
				font-size: 24px;
				line-height: 1;
				cursor: pointer;
			}
			.zs-messages {
				flex: 1;
				overflow-y: auto;
				overflow-x: hidden;
				background: var(--cream);
				padding: 16px;
				scroll-behavior: smooth;
				overscroll-behavior: contain;
			}
			.zs-message { display: flex; margin: 0 0 12px; }
			.zs-message.user { justify-content: flex-start; }
			.zs-bubble {
				max-width: 86%;
				padding: 11px 13px;
				border-radius: 17px;
				font-size: 14px;
				line-height: 1.9;
				white-space: pre-wrap;
				word-break: break-word;
			}
			.zs-message.assistant .zs-bubble { background: #fff; border: 1px solid var(--line); border-top-right-radius: 6px; }
			.zs-message.user .zs-bubble { background: var(--green); color: #fff; border-top-left-radius: 6px; }
			.zs-bubble a { color: var(--green-2); font-weight: 700; text-underline-offset: 3px; }
			.zs-products { display: grid; gap: 9px; margin: -2px 0 14px; }
			.zs-product {
				display: grid;
				grid-template-columns: 66px 1fr;
				gap: 10px;
				align-items: center;
				padding: 9px;
				border: 1px solid var(--line);
				border-radius: 17px;
				background: #fff;
				text-decoration: none;
				color: var(--text);
				transition: border-color .2s, transform .2s;
			}
			.zs-product:hover { border-color: var(--green-2); transform: translateY(-1px); }
			.zs-product img { width: 66px; height: 66px; object-fit: cover; border-radius: 13px; background: #f3f2ed; }
			.zs-product-name { display: block; font-size: 12px; font-weight: 800; line-height: 1.7; }
			.zs-product-price { display: block; margin-top: 4px; color: var(--green); font-size: 12px; font-weight: 800; }
			.zs-product-cta { display: inline-block; margin-top: 5px; color: var(--green-2); font-size: 10px; }
			.zs-chips {
				display: flex;
				gap: 7px;
				overflow-x: auto;
				padding: 10px 13px 7px;
				background: #fff;
				scrollbar-width: none;
			}
			.zs-chips::-webkit-scrollbar { display: none; }
			.zs-chip {
				border: 1px solid #dbe3de;
				border-radius: 999px;
				background: #fff;
				color: var(--green);
				font: 700 11px/1.4 Tahoma, sans-serif;
				padding: 8px 11px;
				white-space: nowrap;
				cursor: pointer;
			}
			.zs-compose { background: #fff; border-top: 1px solid var(--line); padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); }
			.zs-input-row { display: flex; gap: 8px; align-items: flex-end; }
			.zs-input {
				flex: 1;
				min-width: 0;
				min-height: 46px;
				max-height: 112px;
				resize: none;
				border: 1px solid #d8dfda;
				border-radius: 16px;
				background: #fcfdfc;
				padding: 11px 13px;
				font: 400 16px/1.6 Tahoma, Arial, sans-serif;
				direction: rtl;
				color: var(--text);
				outline: none;
			}
			.zs-input:focus { border-color: var(--green-2); box-shadow: 0 0 0 3px rgba(11,102,83,.10); }
			.zs-send {
				width: 46px;
				height: 46px;
				border: 0;
				border-radius: 16px;
				background: var(--green);
				color: #fff;
				cursor: pointer;
				display: grid;
				place-items: center;
				flex: 0 0 auto;
			}
			.zs-send:disabled { opacity: .55; cursor: wait; }
			.zs-send svg { width: 21px; height: 21px; transform: rotate(180deg); }
			.zs-note { margin: 7px 2px 0; text-align: center; font-size: 9px; line-height: 1.6; color: var(--muted); }
			.zs-typing { display: inline-flex; gap: 4px; align-items: center; min-height: 24px; }
			.zs-typing i { width: 6px; height: 6px; border-radius: 50%; background: #9ca9a2; animation: zs-dot 1.1s infinite ease-in-out; }
			.zs-typing i:nth-child(2) { animation-delay: .14s; }
			.zs-typing i:nth-child(3) { animation-delay: .28s; }
			@keyframes zs-dot { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }
			@media (max-width: 600px) {
				.zs-launcher { bottom: calc(92px + env(safe-area-inset-bottom)); right: 14px; width: 56px; height: 56px; border-radius: 19px; }
				.zs-panel {
					right: 10px;
					left: 10px;
					bottom: calc(88px + env(safe-area-inset-bottom));
					width: auto;
					height: min(70dvh, 620px);
					min-height: 430px;
					border-radius: 24px;
					transform-origin: bottom center;
				}
				.zs-header { padding: 14px; }
				.zs-avatar { width: 43px; height: 43px; border-radius: 15px; }
				.zs-messages { padding: 13px; }
				.zs-bubble { max-width: 91%; font-size: 13px; }
			}
			@media (max-height: 560px) and (orientation: landscape) {
				.zs-panel { top: 8px; bottom: 8px; height: auto; min-height: 0; }
				.zs-launcher { bottom: 12px; }
			}
			@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
		</style>
		<div class="zs-wrap">
			<button class="zs-launcher" type="button" aria-label="باز کردن مشاور پوست" aria-expanded="false">
				<span class="zs-pulse">AI</span>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 18.5 3.5 21v-5A8.5 8.5 0 1 1 7 18.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11h.01M12 11h.01M16 11h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
			</button>
			<section class="zs-panel" role="dialog" aria-label="مشاور پوست Z.SHOP" hidden>
				<header class="zs-header">
					<div class="zs-avatar" aria-hidden="true">✦</div>
					<div class="zs-heading"><h2 class="zs-title">مشاور پوست Z.SHOP</h2><p class="zs-status">آماده راهنمایی شما</p></div>
					<button class="zs-close" type="button" aria-label="بستن">×</button>
				</header>
				<div class="zs-messages" aria-live="polite"></div>
				<div class="zs-chips" aria-label="پرسش‌های پیشنهادی">
					<button class="zs-chip" type="button">پوستم چرب و جوش‌دار است</button>
					<button class="zs-chip" type="button">برای لک چه روتینی مناسب است؟</button>
					<button class="zs-chip" type="button">پوستم خشک و حساس است</button>
					<button class="zs-chip" type="button">ضدآفتاب مناسب می‌خواهم</button>
				</div>
				<form class="zs-compose">
					<div class="zs-input-row">
						<textarea class="zs-input" rows="1" maxlength="2200" placeholder="مشکل پوستتان را بنویسید…" aria-label="پیام شما"></textarea>
						<button class="zs-send" type="submit" aria-label="ارسال پیام"><svg viewBox="0 0 24 24" fill="none"><path d="m4 4 16 8-16 8 3-8-3-8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7 12h13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
					</div>
					<p class="zs-note">راهنمایی عمومی است و جایگزین تشخیص پزشک نیست.</p>
				</form>
			</section>
		</div>`;

	const launcher = root.querySelector(".zs-launcher");
	const panel = root.querySelector(".zs-panel");
	const closeButton = root.querySelector(".zs-close");
	const messagesEl = root.querySelector(".zs-messages");
	const form = root.querySelector(".zs-compose");
	const input = root.querySelector(".zs-input");
	const sendButton = root.querySelector(".zs-send");
	const chips = root.querySelectorAll(".zs-chip");
	let isOpen = false;
	let isSending = false;
	let history = loadHistory();

	if (history.length === 0) {
		history = [{ role: "assistant", content: "سلام، من مشاور پوست Z.SHOP هستم. برای پیشنهاد دقیق‌تر، نوع پوست و مهم‌ترین نگرانی‌تان را بنویسید." }];
	}
	renderHistory();

	launcher.addEventListener("click", () => setOpen(!isOpen));
	closeButton.addEventListener("click", () => setOpen(false));
	form.addEventListener("submit", (event) => {
		event.preventDefault();
		sendMessage(input.value);
	});
	input.addEventListener("input", autoResize);
	input.addEventListener("keydown", (event) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			sendMessage(input.value);
		}
	});
	chips.forEach((chip) => chip.addEventListener("click", () => sendMessage(chip.textContent)));

	function setOpen(open) {
		isOpen = open;
		panel.hidden = !open;
		launcher.setAttribute("aria-expanded", String(open));
		if (open) {
			setTimeout(() => input.focus({ preventScroll: true }), 80);
			scrollToBottom();
		}
	}

	async function sendMessage(rawMessage) {
		const content = String(rawMessage || "").trim();
		if (!content || isSending) return;
		setOpen(true);
		isSending = true;
		input.value = "";
		autoResize.call(input);
		sendButton.disabled = true;
		chips.forEach((chip) => (chip.disabled = true));

		appendMessage("user", content);
		history.push({ role: "user", content });
		trimAndSaveHistory();
		const typingNode = appendTyping();

		try {
			const response = await fetch(`${WORKER_BASE}/api/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: history.slice(-MAX_HISTORY) }),
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || "پاسخی دریافت نشد.");

			typingNode.remove();
			const answer = payload.answer || "پاسخی دریافت نشد.";
			appendMessage("assistant", answer, payload.products || []);
			history.push({ role: "assistant", content: answer });
			trimAndSaveHistory();
		} catch (error) {
			typingNode.remove();
			appendMessage("assistant", error?.message || "ارتباط برقرار نشد. دوباره تلاش کنید.");
		} finally {
			isSending = false;
			sendButton.disabled = false;
			chips.forEach((chip) => (chip.disabled = false));
			input.focus({ preventScroll: true });
		}
	}

	function appendMessage(role, content, products = []) {
		const message = document.createElement("div");
		message.className = `zs-message ${role}`;
		const bubble = document.createElement("div");
		bubble.className = "zs-bubble";
		renderSafeText(bubble, content);
		message.appendChild(bubble);
		messagesEl.appendChild(message);
		if (role === "assistant" && products.length) appendProducts(products);
		scrollToBottom();
	}

	function appendProducts(products) {
		const grid = document.createElement("div");
		grid.className = "zs-products";
		products.slice(0, 3).forEach((product) => {
			const card = document.createElement("a");
			card.className = "zs-product";
			card.href = product.permalink;
			card.target = "_blank";
			card.rel = "noopener noreferrer";
			if (product.image) {
				const image = document.createElement("img");
				image.src = product.image;
				image.alt = product.name || "محصول";
				image.loading = "lazy";
				card.appendChild(image);
			} else {
				const imageFallback = document.createElement("div");
				imageFallback.style.cssText = "width:66px;height:66px;border-radius:13px;background:#f3f2ed";
				card.appendChild(imageFallback);
			}
			const meta = document.createElement("span");
			const name = document.createElement("span");
			name.className = "zs-product-name";
			name.textContent = product.name || "مشاهده محصول";
			const price = document.createElement("span");
			price.className = "zs-product-price";
			price.textContent = product.price || "";
			const cta = document.createElement("span");
			cta.className = "zs-product-cta";
			cta.textContent = "مشاهده جزئیات محصول ←";
			meta.append(name, price, cta);
			card.appendChild(meta);
			grid.appendChild(card);
		});
		messagesEl.appendChild(grid);
	}

	function appendTyping() {
		const message = document.createElement("div");
		message.className = "zs-message assistant";
		message.innerHTML = '<div class="zs-bubble"><span class="zs-typing" aria-label="در حال بررسی"><i></i><i></i><i></i></span></div>';
		messagesEl.appendChild(message);
		scrollToBottom();
		return message;
	}

	function renderHistory() {
		messagesEl.textContent = "";
		history.forEach((message) => appendMessage(message.role, message.content));
	}

	function renderSafeText(container, text) {
		const value = String(text || "");
		const urlRegex = /(https?:\/\/[^\s<>]+)/g;
		let lastIndex = 0;
		for (const match of value.matchAll(urlRegex)) {
			const index = match.index ?? 0;
			container.appendChild(document.createTextNode(value.slice(lastIndex, index)));
			const link = document.createElement("a");
			link.href = match[0];
			link.target = "_blank";
			link.rel = "noopener noreferrer";
			link.textContent = "مشاهده محصول";
			container.appendChild(link);
			lastIndex = index + match[0].length;
		}
		container.appendChild(document.createTextNode(value.slice(lastIndex)));
	}

	function autoResize() {
		input.style.height = "auto";
		input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
	}

	function scrollToBottom() {
		requestAnimationFrame(() => {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		});
	}

	function loadHistory() {
		try {
			const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
			if (!Array.isArray(parsed)) return [];
			return parsed
				.filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
				.slice(-MAX_HISTORY);
		} catch (_) {
			return [];
		}
	}

	function trimAndSaveHistory() {
		history = history.slice(-MAX_HISTORY);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
		} catch (_) {}
	}
})();
