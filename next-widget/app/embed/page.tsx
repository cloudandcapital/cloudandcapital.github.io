"use client";
import AiAssistantWidget from "../../components/AiAssistantWidget";


export default function Page() {
  return (
    <div style={{ width: "100%", height: "100vh", background: "transparent" }}>
      <AiAssistantWidget
        ownerName="Diana"
        brand="Cloud & Capital"
        logoSrc="https://cloudandcapital.github.io/resources/logo.png"
        autoOpenDelay={300}
      />
    </div>
  );
}
