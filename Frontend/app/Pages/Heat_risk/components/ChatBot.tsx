"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from "react";

interface Message {
  text: string;
  sender: "user" | "bot";
}

interface WeatherData {
  heatIndex: number | null;
  solarRadiation: number | null;
}

interface FieldConfig {
  name: keyof WeatherData;
  label: string;
  unit: string;
  icon: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentField, setCurrentField] = useState(0);
  const [weatherData, setWeatherData] = useState<WeatherData>({
    heatIndex: null,
    solarRadiation: null,
  });
  const [isCollectingData, setIsCollectingData] = useState(true);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);

  // Removed Dew Point from the fields array
  const fields: FieldConfig[] = [
    {
      name: "heatIndex",
      label: "Heat Index (°C)",
      unit: "°C",
      icon: "🌡️",
    },
    {
      name: "solarRadiation",
      label: "Solar Radiation (W/m²)",
      unit: "W/m²",
      icon: "☀️",
    },
  ];

  const API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ""; // TODO: inject via env variable in production

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setIsFullscreen(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setCurrentField(0);
    setIsCollectingData(true);
    setWeatherData({
      heatIndex: null,
      solarRadiation: null,
    });
  };

  const askNextQuestion = useCallback(() => {
    if (currentField < fields.length) {
      const field = fields[currentField];
      const questionMessage: Message = {
        text: `${field.icon} Please enter the **${field.label}**:\n_(numeric value only)_`,
        sender: "bot",
      };
      setMessages((prev) => [...prev, questionMessage]);
    }
  }, [currentField, fields]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        text: "🔍 **Heat Risk Analysis Advisor**\n\nI'll analyze your **Heat Index and Solar Radiation** data to provide heat risk assessment.",
        sender: "bot",
      };
      setMessages([welcomeMessage]);
      setTimeout(() => {
        askNextQuestion();
      }, 500);
    }
  }, [isOpen, messages.length, askNextQuestion]);

  const validateAndStoreInput = (
    value: string,
    currentFieldIndex: number
  ): number | false => {
    const field = fields[currentFieldIndex];
    if (!field) return false;

    const numericValue = parseFloat(value);

    if (field.name === "solarRadiation") {
      if (isNaN(numericValue) || numericValue < 0) {
        const errorMessage: Message = {
          text: `❌ **Invalid Solar Radiation**\nPlease enter a valid positive number for Solar Radiation.`,
          sender: "bot",
        };
        setMessages((prev) => [...prev, errorMessage]);
        return false;
      }
      return numericValue;
    }

    if (isNaN(numericValue)) {
      const errorMessage: Message = {
        text: `❌ **Invalid Input**\nPlease enter a valid number for ${field.icon} ${
          field.label.split("(")[0].trim()
        }.`,
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return false;
    }

    return numericValue;
  };

  const sendAnalysis = async (finalData?: WeatherData) => {
    setIsTyping(true);
    const dataToUse = finalData || weatherData;

    const collectingMessage: Message = {
      text: `📊 **Data Collection Complete**\n\n✅ **Heat Index:** ${dataToUse.heatIndex}${fields[0].unit}\n✅ **Solar Radiation:** ${dataToUse.solarRadiation}${fields[1].unit}\n\n🔍 *Analyzing heat risk...*`,
      sender: "bot",
    };
    setMessages((prev) => [...prev, collectingMessage]);

    const analysisPrompt = `Analyze ONLY these two parameters for heat risk assessment:
1. Heat Index: ${dataToUse.heatIndex}°C
2. Solar Radiation: ${dataToUse.solarRadiation} W/m²

Provide analysis with risk levels and mitigation methods.`;

    if (!API_KEY) {
      setMessages((prev) => [
        ...prev,
        {
          text: "⚙️ API key not configured. Please add your OpenAI API key.",
          sender: "bot",
        },
      ]);
      setIsTyping(false);
      setIsCollectingData(false);
      return;
    }

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional heat risk analyst and advisor. Respond with heat risk analysis based on Heat Index and Solar Radiation like how affect risk to people considering Heat Index and Solar Radiation data. And provide risk mitigation methods with description for general public simply, clearly and friendly (very important) and not use ## in response. You must response only heat risk or weather related question. Do NOT provide any other information. if user ask another topic, respond this '❌ **Invalid Request**\nI can only assist with heat risk analysis based on Heat Index and Solar Radiation data. Please provide relevant data for analysis.",
              },
              { role: "user", content: analysisPrompt },
            ],
          }),
        }
      );

      const json = await response.json();
      const reply = json.choices?.[0]?.message?.content ?? "";

      setMessages((prev) => [
        ...prev,
        { text: reply, sender: "bot" },
        {
          text: " **Ready for New Analysis**\n\nWould you like to analyze another set of data? click 🔄New",
          sender: "bot",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "❌ **Connection Error**", sender: "bot" },
      ]);
    } finally {
      setIsTyping(false);
      setIsCollectingData(false);
    }
  };

  const sendFollowUpMessage = async (message: string) => {
    if (!API_KEY) {
      setMessages((prev) => [
        ...prev,
        {
          text: "⚙️ API key not configured. Please add your OpenAI API key.",
          sender: "bot",
        },
      ]);
      return;
    }
    setIsTyping(true);
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: message }],
          }),
        }
      );
      const json = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          text: json.choices?.[0]?.message?.content ?? "",
          sender: "bot",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { text: "❌ Error connecting.", sender: "bot" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");

    if (isCollectingData) {
      const validationResult = validateAndStoreInput(currentInput, currentField);

      if (validationResult !== false) {
        const fieldName = fields[currentField].name;
        const updatedWeatherData: WeatherData = {
          ...weatherData,
          [fieldName]: validationResult,
        };
        setWeatherData(updatedWeatherData);

        const nextField = currentField + 1;
        setCurrentField(nextField);

        if (nextField < fields.length) {
          setTimeout(() => {
            const next = fields[nextField];
            setMessages((prev) => [
              ...prev,
              {
                text: `${next.icon} Please enter the **${next.label}**:\n_(numeric value only)_`,
                sender: "bot",
              },
            ]);
          }, 500);
        } else {
          setTimeout(() => {
            sendAnalysis(updatedWeatherData);
          }, 500);
        }
      } else {
        setTimeout(() => {
          const field = fields[currentField];
          setMessages((prev) => [
            ...prev,
            {
              text: `${field.icon} Please enter the **${field.label}** again:`,
              sender: "bot",
            },
          ]);
        }, 500);
      }
    } else {
      void sendFollowUpMessage(currentInput);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMessage();
    }
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const formatMessageText = (text: string) => {
    if (!text) return "";
    let formattedText = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold">$1</strong>'
    );
    formattedText = formattedText.replace(
      /^ (.*$)/gm,
      '<h2 class="text-sm font-bold mt-4 mb-2 text-red-600">$1</h2>'
    );
    formattedText = formattedText.replace(
      /^(✅|🔴|🟡|🟢|⚠️|🔥|💧|☀️|❄️|📌|🎯|🛡️|🛡️|🌡️|📊)\s+(.*$)/gm,
      '<div class="flex items-start my-1"><span class="mr-2 text-lg">$1</span><span>$2</span></div>'
    );
    formattedText = formattedText.replace(/\n/g, "<br>");
    return formattedText;
  };

  const getContainerStyles = () =>
    isFullscreen
      ? "fixed inset-0 z-50 bg-white"
      : "fixed bottom-24 right-6 w-full md:w-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-300 animate-fadeIn";

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-linear-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-xl z-50"
      >
        <span className="text-xl">🤖 Advisor</span>
      </button>

      {isOpen && (
        <div className={getContainerStyles()}>
          <div className={`flex flex-col ${isFullscreen ? "h-screen" : "h-125"}`}>
            <div className="bg-linear-to-r from-orange-500 to-red-500 p-4 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">🤖</div>
                  <div>
                    <h2 className="text-lg font-bold">
                      Heat Risk Analysis- AI Safety Advisor
                    </h2>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className="text-white p-2"
                  >
                    {isFullscreen ? "⎙" : "⛶"}
                  </button>
                  <button onClick={resetChat} className="text-white text-sm">
                    🔄 New
                  </button>
                  <button onClick={toggleChat} className="text-xl">
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={chatBoxRef}
              className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3"
            >
              {messages.map((msg, index) => (
                <div
                  key={`${msg.sender}-${index}-${msg.text.slice(0, 8)}`}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                      msg.sender === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white border text-gray-800 shadow-sm"
                    }`}
                  >
                    <div
                      className="text-sm whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: formatMessageText(msg.text),
                      }}
                    />
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="text-xs text-gray-500 animate-pulse">
                  Analyzing...
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-4 bg-white relative z-10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter numeric value..."
                  className="flex-1 p-3 bg-white text-gray-900 placeholder-gray-400 caret-red-600 rounded-xl border border-gray-300 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all block w-full"
                />
                <button
                  onClick={handleMessage}
                  disabled={!input.trim()}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors shadow-sm"
                >
                  Send ↑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
