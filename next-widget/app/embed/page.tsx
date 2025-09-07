"use client";
import { useState, useEffect } from "react";
import AiAssistantWidget from "@/components/AiAssistantWidget";

// Make sure the parent hears open/close
function post(msg: "lumen:open" | "lumen:close") {
  if (typeof window !== "undefined" && window.parent) {
    window.parent.postMessage(msg, "*");
  }
}

export default function Page() {
  const [open, setOpen] = useState(false);

  // Closed by default, never auto-open
  useEffect(() => {
    post("lumen:close");
  }, []);

  return (
    <div
      // inline-block prevents the container from stretching;
      // background stays transparent so host page shows through
      style={{
        display: "inline-block",
        background: "transparent",
      }}
    >
      <AiAssistantWidget
        ownerName="Diana"
        brand="Cloud & Capital"
        autoOpenDelay={9999999} // effectively disables the auto-open
        // tell the parent to resize when the user opens/closes
        onOpen={() => post("lumen:open")}
        onClose={() => post("lumen:close")}
      />
    </div>
  );
}
