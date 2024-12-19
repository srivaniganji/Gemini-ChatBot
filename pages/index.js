import React, { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialLight } from "react-syntax-highlighter/dist/cjs/styles/prism";

const renderMessage = (text) => {
    // Regex to detect fenced code blocks
    const codeBlockRegex = /```([\s\S]*?)```/;
  
    // Check for fenced code blocks (used for code preview)
    if (codeBlockRegex.test(text)) {
      const codeContent = text.match(codeBlockRegex)[1];
      return (
        <div>
          <SyntaxHighlighter language="javascript" style={materialLight}>
            {codeContent}
          </SyntaxHighlighter>
          <div>{getCodeOutput(codeContent)}</div>
        </div>
      );
    }
  
    // For simple inline JavaScript code
    const inlineCodeRegex = /`([^`]+)`/;
    if (inlineCodeRegex.test(text)) {
      const codeContent = text.match(inlineCodeRegex)[1];
      return (
        <div>
          <SyntaxHighlighter language="javascript" style={materialLight}>
            {codeContent}
          </SyntaxHighlighter>
          <div>{getCodeOutput(codeContent)}</div>
        </div>
      );
    }
  
    // Default case: Render plain text
    return <p>{text}</p>;
  };
  

// Function to execute and get output of JavaScript code
const getCodeOutput = (code) => {
  try {
    // Check if the code is a React Component
    if (code.includes("<") && code.includes(">")) {
      const sandboxDiv = document.createElement("div");
      sandboxDiv.style.border = "1px solid #ccc";
      sandboxDiv.style.padding = "10px";
      sandboxDiv.style.marginTop = "10px";

      const Component = new Function("React", `return ${code}`)(React);

      // Render in a sandboxed div
      const root = createRoot(sandboxDiv);
      root.render(<Component />);

      return (
        <div>
          <h3>Rendered Output:</h3>
          <div ref={(el) => el?.appendChild(sandboxDiv)} />
        </div>
      );
    } else {
      // Execute non-React JavaScript code
      const result = eval(code); // Avoid eval in production
      return <p>Output: {JSON.stringify(result)}</p>;
    }
  } catch (error) {
    return <p style={{ color: "red" }}>Error: {error.message}</p>;
  }
};


export default function Home() {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatContainerRef = useRef(null);

    const handleSendMessage = async () => {
        if (!prompt.trim()) return;
        setLoading(true);

        const newMessages = [
            ...messages,
            { type: "outgoing", text: prompt },
        ];
        setMessages(newMessages);

        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            if (!res.ok) {
                throw new Error("Failed to fetch response");
            }

            const data = await res.json();

            setMessages((prevMessages) => [
                ...prevMessages,
                { type: "incoming", text: data.response },
            ]);
        } catch (error) {
            console.error("Error:", error.message);
            setMessages((prevMessages) => [
                ...prevMessages,
                { type: "incoming", text: "Error: Failed to fetch response." },
            ]);
        } finally {
            setLoading(false);
            setPrompt("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Smooth scrolling
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gemini Chatbot</h1>
            <div ref={chatContainerRef} style={styles.chatContainer}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            ...styles.message,
                            ...(msg.type === "outgoing"
                                ? styles.outgoingMessage
                                : styles.incomingMessage),
                        }}
                    >
                        {renderMessage(msg.text)}
                    </div>
                ))}
                {loading && <div style={styles.loading}>Generating response...</div>}
            </div>
            <div style={styles.inputContainer}>
                <textarea
                    style={styles.textarea}
                    placeholder="Type your message..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows="2"
                ></textarea>
                <button
                    style={styles.button}
                    onClick={handleSendMessage}
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? "Sending..." : "Send"}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: { display: "flex", flexDirection: "column", alignItems: "center", height: "100vh", fontFamily: "Arial, sans-serif", backgroundColor: "#f0f0f0" },
    header: { margin: "10px 0", fontSize: "2rem", color: "#0070f3" },
    chatContainer: { display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#ffffff", width: "80%", height: "70vh", overflowY: "auto", padding: "10px", borderRadius: "10px", boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)" },
    message: { padding: "10px", borderRadius: "10px", maxWidth: "60%", wordWrap: "break-word" },
    outgoingMessage: { alignSelf: "flex-end", backgroundColor: "#dcf8c6", textAlign: "right" },
    incomingMessage: { alignSelf: "flex-start", backgroundColor: "#ffffff", border: "1px solid #e0e0e0", textAlign: "left" },
    inputContainer: { display: "flex", gap: "10px", width: "80%", marginTop: "10px" },
    textarea: { flex: "1", padding: "10px", fontSize: "16px", borderRadius: "10px", border: "1px solid #ccc", resize: "none" },
    button: { padding: "10px 20px", fontSize: "16px", borderRadius: "10px", border: "none", backgroundColor: "#0070f3", color: "#ffffff", cursor: "pointer" },
    loading: { textAlign: "center", color: "#888888", fontStyle: "italic" },
};
