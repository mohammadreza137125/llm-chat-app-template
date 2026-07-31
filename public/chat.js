(() => {
	const messagesEl = document.getElementById("chat-messages");
	const form = document.getElementById("chat-form");
	const input = document.getElementById("user-input");
	const sendButton = document.getElementById("send-button");
	const chips = document.querySelectorAll("[data-prompt]");
	const history = [];
	let busy = false;

	appendMessage("assistant", "سلام، من مشاور پوست Z.SHOP هستم. نوع پوست و مشکل اصلی‌تان را بنویسید تا راهنمایی‌تان کنم.");
	form.addEventListener("submit", (event) => { event.preventDefault(); send(input.value); });
	input.addEventListener("keydown", (event) => {
		if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(input.value); }
	});
	chips.forEach((chip) => chip.addEventListener("click", () => send(chip.dataset.prompt)));

	async function send(raw) {
		const text = String(raw || "").trim();
		if (!text || busy) return;
		busy = true;
		input.value = "";
		sendButton.disabled = true;
		appendMessage("user", text);
		history.push({ role: "user", content: text });
		const loading = appendLoading();
		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: history.slice(-12) }),
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "خطا در دریافت پاسخ");
			loading.remove();
			appendMessage("assistant", data.answer, data.products || []);
			history.push({ role: "assistant", content: data.answer });
		} catch (error) {
			loading.remove();
			appendMessage("assistant", error.message || "ارتباط برقرار نشد.");
		} finally {
			busy = false;
			sendButton.disabled = false;
			input.focus();
		}
	}

	function appendMessage(role, text, products = []) {
		const wrapper = document.createElement("div");
		wrapper.className = `message ${role}`;
		const bubble = document.createElement("div");
		bubble.className = "bubble";
		bubble.textContent = text;
		wrapper.appendChild(bubble);
		messagesEl.appendChild(wrapper);
		products.forEach((product) => {
			const card = document.createElement("a");
			card.className = "product";
			card.href = product.permalink;
			card.target = "_blank";
			card.rel = "noopener noreferrer";
			card.innerHTML = `${product.image ? `<img src="${escapeAttr(product.image)}" alt="">` : ""}<span><b>${escapeHtml(product.name)}</b><small>${escapeHtml(product.price || "")}</small></span>`;
			messagesEl.appendChild(card);
		});
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	function appendLoading() {
		const node = document.createElement("div");
		node.className = "message assistant";
		node.innerHTML = '<div class="bubble">در حال بررسی…</div>';
		messagesEl.appendChild(node);
		return node;
	}

	function escapeHtml(value) {
		return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
	}
	function escapeAttr(value) { return escapeHtml(value); }
})();
