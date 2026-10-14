// Minimal CDP helper: navigate/reload/resize a page target. Usage:
//   node cdp-nav.mjs <targetId> reload
//   node cdp-nav.mjs <targetId> goto <url>
//   node cdp-nav.mjs <targetId> viewport <width> <height>   (0 0 clears override)
const [targetId, action, a1, a2] = process.argv.slice(2);
const ws = new WebSocket(`ws://127.0.0.1:9222/devtools/page/${targetId}`);
let id = 0;
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const myId = ++id;
    const onMsg = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== myId) return;
      ws.removeEventListener("message", onMsg);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
ws.addEventListener("open", async () => {
  try {
    if (action === "reload") await send("Page.reload", { ignoreCache: true });
    else if (action === "goto") await send("Page.navigate", { url: a1 });
    else if (action === "viewport") {
      const w = Number(a1), h = Number(a2);
      if (w === 0) await send("Emulation.clearDeviceMetricsOverride");
      else await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
    } else throw new Error(`unknown action ${action}`);
    console.log("ok", action, a1 ?? "");
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    ws.close();
  }
});
