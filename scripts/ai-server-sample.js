(() => {
  const region = document.getElementById("aiServerSample");
  const button = document.getElementById("aiServerSampleFetch");
  const status = document.getElementById("aiServerSampleStatus");
  const content = document.getElementById("aiServerSampleContent");
  if (!region || !button || !status || !content) return;

  const fetchLabel = "Fetch AI Server Sample";

  function setStatus(state, message) {
    region.dataset.state = state;
    status.textContent = message;
  }

  function sampleEndpoint(baseUrl) {
    if (typeof baseUrl !== "string" || !baseUrl.trim()) {
      throw new Error("The AI server address is not configured yet.");
    }
    let base;
    try {
      base = new URL(baseUrl.trim());
    } catch (_) {
      throw new Error("The AI server address is invalid.");
    }
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
      throw new Error("The AI server address is invalid.");
    }
    if (window.location.protocol === "https:" && base.protocol !== "https:") {
      throw new Error("This page requires a secure HTTPS address for the AI server.");
    }
    base.pathname = `${base.pathname.replace(/\/+$/, "")}/api/v1/sample`;
    return base.href;
  }

  if (window.IneburaAiServerConfig?.baseUrl) {
    setStatus("idle", "Ready to fetch sample.txt.");
  }

  button.addEventListener("click", async () => {
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = "Fetching sample…";
    region.setAttribute("aria-busy", "true");
    content.hidden = true;
    content.textContent = "";
    setStatus("loading", "Fetching sample.txt from the AI server…");

    let timer;
    let timedOut = false;
    try {
      const config = window.IneburaAiServerConfig || {};
      const endpoint = sampleEndpoint(config.baseUrl);
      const timeoutMs = Number.isFinite(config.timeoutMs) && config.timeoutMs > 0 ? config.timeoutMs : 10000;
      const controller = new AbortController();
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        redirect: "error",
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`The AI server returned HTTP ${response.status}. Please retry.`);
      }
      let result;
      try {
        result = await response.json();
      } catch (_) {
        throw new Error("The AI server returned an invalid sample response. Please retry.");
      }
      if (result?.source !== "sample.txt" || typeof result.content !== "string") {
        throw new Error("The AI server returned an invalid sample response. Please retry.");
      }
      content.textContent = result.content;
      content.hidden = false;
      setStatus("success", result.content.length ? "Sample fetched from the AI server." : "Sample fetched. The file is empty.");
    } catch (error) {
      const message = timedOut
        ? "The AI server request timed out. Please retry."
        : error instanceof TypeError
          ? "Unable to reach the AI server. Check the connection and server access, then retry."
          : error.message || "Unable to fetch the sample. Please retry.";
      setStatus("error", message);
    } finally {
      clearTimeout(timer);
      region.setAttribute("aria-busy", "false");
      button.disabled = false;
      button.textContent = region.dataset.state === "error" ? "Retry AI Server Sample" : fetchLabel;
    }
  });
})();
