"use client";
import { useState, useRef } from "react";
import { Send, Mic, Play, Pause } from "lucide-react";

export default function Chat() {
    const [message, setMessage] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [messages, setMessages] = useState([]);
    const [playingAudio, setPlayingAudio] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRefs = useRef({});

    // Function to send messages (text or audio)
    const sendMessage = async (content, type = "text", audioBlob = null) => {
        const newMessage = {
            id: Date.now(),
            type,
            content,
            audioBlob,
            audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null,
            timestamp: new Date(),
            sender: "user",
            isTranscribing: type === "audio", // Add loading state for audio
        };

        // Add message to chat
        setMessages((prev) => [...prev, newMessage]);

        // Send to your API
        try {
            if (type === "text") {
                // Handle text message API call
                const response = await fetch("/api/send-message", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: content,
                        type: "text",
                    }),
                });
                const data = await response.json();
                console.log("Text message sent:", data);
            } else if (type === "audio" && audioBlob) {
                // Handle audio message API call to Whisper
                const formData = new FormData();
                formData.append("file", audioBlob, "recording.webm");

                const response = await fetch("/api/whisper-transcribe", {
                    method: "POST",
                    body: formData,
                });
                const data = await response.json();

                // Update message with transcription
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === newMessage.id
                            ? {
                                  ...msg,
                                  transcription:
                                      data.transcription ||
                                      "Transcription failed",
                                  isTranscribing: false,
                              }
                            : msg
                    )
                );

                console.log("Audio transcribed:", data);
            }
        } catch (err) {
            console.error("Failed to send message:", err);
            // Update message to show error state
            if (type === "audio") {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === newMessage.id
                            ? {
                                  ...msg,
                                  transcription: "Transcription failed",
                                  isTranscribing: false,
                              }
                            : msg
                    )
                );
            }
        }
    };

    const handleSendText = () => {
        if (!message.trim()) return;
        sendMessage(message, "text");
        setMessage("");
    };

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: "audio/webm",
                });
                sendMessage("Audio message", "audio", audioBlob);
                // Stop all tracks to release microphone
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access denied:", err);
        }
    };

    const toggleAudioPlayback = (messageId, audioUrl) => {
        if (playingAudio === messageId) {
            // Stop currently playing audio
            if (audioRefs.current[messageId]) {
                audioRefs.current[messageId].pause();
                audioRefs.current[messageId].currentTime = 0;
            }
            setPlayingAudio(null);
        } else {
            // Stop any other playing audio
            Object.keys(audioRefs.current).forEach((id) => {
                if (audioRefs.current[id]) {
                    audioRefs.current[id].pause();
                    audioRefs.current[id].currentTime = 0;
                }
            });

            // Create new audio element if it doesn't exist
            if (!audioRefs.current[messageId]) {
                audioRefs.current[messageId] = new Audio(audioUrl);
                audioRefs.current[messageId].onended = () => {
                    setPlayingAudio(null);
                };
                audioRefs.current[messageId].onerror = (e) => {
                    console.error("Audio playback error:", e);
                    setPlayingAudio(null);
                };
            }

            // Play audio
            audioRefs.current[messageId]
                .play()
                .then(() => {
                    setPlayingAudio(messageId);
                })
                .catch((error) => {
                    console.error("Failed to play audio:", error);
                    setPlayingAudio(null);
                });
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50">
            {/* Chat area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className="flex justify-end">
                        <div className="max-w-xs lg:max-w-md">
                            <div className="bg-blue-500 text-white rounded-2xl px-4 py-2">
                                {msg.type === "text" ? (
                                    <p className="text-sm">{msg.content}</p>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    toggleAudioPlayback(
                                                        msg.id,
                                                        msg.audioUrl
                                                    )
                                                }
                                                className="flex items-center gap-2 text-white hover:text-gray-200 transition"
                                                disabled={!msg.audioUrl}
                                            >
                                                {playingAudio === msg.id ? (
                                                    <Pause size={16} />
                                                ) : (
                                                    <Play size={16} />
                                                )}
                                                <span className="text-sm">
                                                    Audio message
                                                </span>
                                            </button>
                                        </div>
                                        {msg.isTranscribing ? (
                                            <div className="flex items-center gap-2 text-gray-200">
                                                <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                                                <span className="text-xs">
                                                    Transcribing...
                                                </span>
                                            </div>
                                        ) : msg.transcription ? (
                                            <div className="mt-2 p-2 bg-blue-400 rounded-lg">
                                                <span className="text-xs text-gray-100">
                                                    Transcription:
                                                </span>
                                                <p className="text-sm">
                                                    {msg.transcription}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">
                                {formatTime(msg.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recording indicator */}
            {isRecording && (
                <div className="px-4 py-2 bg-red-100 border-t">
                    <div className="flex items-center gap-2 text-red-600">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="text-sm">Recording...</span>
                    </div>
                </div>
            )}

            {/* Input bar */}
            <div className="border-t p-4 bg-white">
                <div className="flex items-center gap-2 rounded-2xl border bg-gray-100 px-4 py-2 shadow-sm">
                    {/* Mic button */}
                    <button
                        onClick={toggleRecording}
                        className={`p-2 rounded-full transition ${
                            isRecording
                                ? "bg-red-500 text-white animate-pulse"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        <Mic size={18} />
                    </button>

                    {/* Text input */}
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent outline-none text-sm"
                        onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                    />

                    {/* Send button */}
                    <button
                        onClick={handleSendText}
                        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
