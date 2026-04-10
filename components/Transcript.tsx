'use client';

import React, { useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';


interface Message {
  role: string;
  content: string;
}

interface TranscriptProps {
  messages: Message[];
  currentMessage: string;
  currentUserMessage: string;
}

export default function Transcript({ messages, currentMessage, currentUserMessage }: TranscriptProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentMessage, currentUserMessage]);

  const isEmpty = messages.length === 0 && !currentMessage && !currentUserMessage;

  return (
    <div className="transcript-container">
      {isEmpty ? (
        <div className="transcript-empty">
          <Mic size={48} className="text-[var(--text-muted)] mb-4" />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">
            Click the mic button above to start talking
          </p>
        </div>
      ) : (
        <div className="transcript-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`transcript-message ${
                message.role === 'user' ? 'transcript-message-user' : 'transcript-message-assistant'
              }`}
            >
              <div
                className={`transcript-bubble ${
                  message.role === 'user' ? 'transcript-bubble-user' : 'transcript-bubble-assistant'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {currentMessage && (
            <div className="transcript-message transcript-message-assistant">
              <div className="transcript-bubble transcript-bubble-assistant">
                {currentMessage}
                <span className="transcript-cursor"></span>
              </div>
            </div>
          )}
          {currentUserMessage && (
            <div className="transcript-message transcript-message-user">
              <div className="transcript-bubble transcript-bubble-user">
                {currentUserMessage}
                <span className="transcript-cursor"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}