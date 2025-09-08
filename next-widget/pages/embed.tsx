import React, { useEffect, useState } from "react";
import AiAssistantWidget from "../components/AiAssistantWidget";

export default function Embed() {
  const [open, setOpen] = useState(false);

  // Listen for parent page requests
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data === "lumen:open") setOpen(true);
      if (e.data === "lumen:close") setOpen(false);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Notify parent when we open/close (so it can resize/hide its external button)
  useEffect(() => {
    try {
      window.parent?.postMessage(open ? "lumen:open" : "lumen:close", "*");
    } catch {}
  }, [open]);

  return (
    <div style={{ minHeight: "100vh", background: "transparent" }}>
      <AiAssistantWidget
        title="Lumen ~ Diana’s AI Assistant"
        iconSrc="/resources/cloud-and-capital-icon.png"
        iframeSrc="/assistant"  // if your internal chat route is different, keep it; not used by this embed wrapper itself
        startOpen={false}
      />
      {/* Optional: auto-open can be kept off; parent shows Ask button */}
    </div>
  );
}
