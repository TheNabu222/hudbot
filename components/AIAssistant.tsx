import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Bot, X, Send, Loader2 } from "lucide-react";
import { Project, DialogueTree } from "../types";
import { v4 as uuidv4 } from "uuid";
import Markdown from "react-markdown";

interface AIAssistantProps {
  project: Project;
  updateProject: (updates: Partial<Project>) => void;
  onClose: () => void;
}

interface Message {
  role: "user" | "model";
  text: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ project, updateProject, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hi! I'm your AI Assistant. I can help you with your project, suggest ideas, create dialogue trees, and write storylines for your game. How can I help today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY environment variable.");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Create a context payload summarizing the project
      // To save tokens, we'll only send a light summary of scenes, objects and dialogs
      const projectSummary = {
        name: project.name,
        globalSettings: project.globalSettings,
        scenesCount: project.scenes.length,
        dialogueTrees: project.dialogueTrees,
        flags: project.gameFlags,
      };

      const systemInstruction = `You are a helpful AI Game Dev Assistant built into the 'image-to-voxel-art' engine (a 2D game builder).
The user is building a game project. Answer their questions, suggest solutions, or help them write dialogue.
If they ask for a JSON structure (like a DialogueTree), provide it clearly inside a markdown code block.

Here is the current project summary for context:
${JSON.stringify(projectSummary, null, 2)}`;

      const chatMessages = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      chatMessages.push({ role: "user", parts: [{ text: userMsg }] });

      const addDialogueTreeDecl: FunctionDeclaration = {
        name: "addDialogueTree",
        description: "Creates a new dialogue tree in the project.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The name of the dialogue tree",
            },
            jsonConfig: {
              type: Type.STRING,
              description: "A JSON string representing the dialogue nodes array. Must match DialogueNode[]. E.g. [{ \"id\": \"node1\", \"speaker\": \"Npc\", \"text\": \"Hello\", \"choices\": [{ \"id\": \"c1\", \"text\": \"Hi\", \"nextNodeId\": null }] }]",
            },
            startNodeId: {
              type: Type.STRING,
              description: "The ID of the starting node.",
            }
          },
          required: ["name", "jsonConfig", "startNodeId"],
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: chatMessages,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [addDialogueTreeDecl] }]
        },
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        let actionMessage = "";
        for (const call of response.functionCalls) {
          if (call.name === "addDialogueTree") {
            try {
              const nodes = JSON.parse((call.args as any).jsonConfig);
              const newTree: DialogueTree = {
                id: uuidv4(),
                name: (call.args as any).name,
                nodes: nodes,
                startNodeId: (call.args as any).startNodeId,
              };
              updateProject({
                dialogueTrees: [...(project.dialogueTrees || []), newTree],
              });
              actionMessage += `\n- Created dialogue tree: **${newTree.name}**. You can find it in the Dialogue tab.`;
            } catch (e) {
              actionMessage += `\n- Failed to create dialogue tree due to invalid JSON.`;
            }
          }
        }
        
        // Return a response wrapping the action message since we must reply.
        setMessages((prev) => [
          ...prev,
          { role: "model", text: `I successfully executed the following actions:${actionMessage}\n\nCan I help with anything else?` },
        ]);
        
      } else if (response.text) {
        setMessages((prev) => [...prev, { role: "model", text: response.text as string }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: "I didn't get any response. Please try again." },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `Error: ${err.message || "Something went wrong."}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[9999] w-96 flex flex-col bg-neutral-900 border border-emerald-500/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-emerald-900/40 border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-400">
          <Bot size={20} />
          <span className="font-bold text-sm">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="p-4 h-96 overflow-y-auto flex flex-col gap-4 custom-scrollbar bg-neutral-950/50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "self-end" : "self-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-xl text-sm ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-none"
                  : "bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none prose prose-invert prose-sm"
              }`}
            >
              {msg.role === "user" ? (
                msg.text
              ) : (
                <div className="markdown-body">
                  <Markdown>{msg.text}</Markdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="self-start px-3 py-2 bg-neutral-800 border border-neutral-700 text-emerald-500 rounded-xl rounded-bl-none flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs font-medium">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-900 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask me to write dialogue, suggest ideas..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-3 pr-10 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50 resize-none min-h-[44px] max-h-32 custom-scrollbar"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-5 bottom-[18px] text-emerald-500 hover:text-emerald-400 disabled:text-neutral-600 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
