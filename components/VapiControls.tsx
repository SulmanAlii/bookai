'use client'
import React from 'react'
import {  Mic, MicOff } from 'lucide-react';
import { IBook } from '@/database/models/types';
import useVapi from '@/hooks/useVapi';
import Image from 'next/image';
import Transcript from './Transcript';


function VapiControls({book}:{book: IBook}) {
    const { status,isActive,currentMessage,currentUserMessage,messages,duration,
        start,stop,clearError} = useVapi(book)


  return (
    <>
      <div className="vapi-header-card mb-8">
              <div className="flex gap-8">
                {/* Left: Book Cover with Mic Button Overlay */}
                <div className="relative flex-shrink-0">
                  {/* Book Cover */}
                  <div className="relative w-32 h-auto rounded-lg overflow-hidden shadow-book">
                    <Image
                      src={book.coverURL}
                      alt={`${book.title} cover`}
                      width={120}
                      height={160}
                      className="w-full h-auto object-cover"
                      priority
                    />
                  </div>
    
                  {/* Circular Mic Button - Overlapping Bottom Right */}
                  <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3">
                    {/* Pulsating Ring for AI Speaking/Thinking */}
                    {isActive && (status === 'thinking' || status === 'speaking') && (
                      <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-75"></div>
                    )}
                    <button
                      className="relative vapi-mic-btn"
                      aria-label="Toggle microphone"
                      onClick={isActive ? stop : start}
                      disabled={status === 'connecting' || status === 'starting'}
                    >
                      {isActive ? <Mic size={28} /> : <MicOff size={28} />}
                    </button>
                  </div>
                </div>
    
                {/* Right: Book Info */}
                <div className="flex-1 flex flex-col justify-start gap-4">
                  {/* Title and Author */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-serif text-text-primary">
                      {book.title}
                    </h1>
                    <p className="text-text-secondary mt-2">by {book.author}</p>
                  </div>
    
                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-3">
                    {/* Ready Badge */}
                    <div className="vapi-status-indicator">
                      <span className="vapi-status-dot vapi-status-dot-ready"></span>
                      <span className="vapi-status-text">Ready</span>
                    </div>
    
                    {/* Voice Badge */}
                    <div className="vapi-status-indicator">
                      <span className="vapi-status-text">
                        Voice: {book.persona || 'Default'}
                      </span>
                    </div>
    
                    {/* Timer Badge */}
                    <div className="vapi-status-indicator">
                      <span className="vapi-status-text">0:00/15:00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="vapi-transcript-wrapper">
              <Transcript
                messages={messages}
                currentMessage={currentMessage}
                currentUserMessage={currentUserMessage}
              />
            </div>
    
    </>
      
  )
}

export default VapiControls;