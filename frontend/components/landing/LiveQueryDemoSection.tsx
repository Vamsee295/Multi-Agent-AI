"use client";

import { useState, useEffect } from "react";
import { ScrollReveal } from "./ScrollReveal";
import { Play, Pause, RotateCcw, Check } from "lucide-react";

export function LiveQueryDemoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: "Query Received", desc: '"I was charged twice for Premium."' },
    { label: "Observe Intent", desc: "Intent: Billing Complaint\nSentiment: Frustrated" },
    { label: "Router", desc: "Selecting Agents:\n- Billing Specialist\n- Support Agent" },
    { label: "RAG / FAISS", desc: "Retrieving:\n- refund_policy.txt\n- subscription_terms.md" },
    { label: "Parallel Execution", desc: "Agents processing retrieved context in parallel." },
    { label: "Aggregator", desc: "Synthesizing agent responses via Groq LLM." },
    { label: "Final Response", desc: '"I apologize for the double charge. I have initiated a refund for the duplicate transaction, which will appear in 3-5 days."' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const handlePlayPause = () => {
    if (activeStep === steps.length - 1) {
      setActiveStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <ScrollReveal delay={100} direction="up" className="text-center mb-16">
          <h2 className="text-[32px] sm:text-[40px] font-bold text-[#09090B] tracking-tight mb-4">
            Watch the system think.
          </h2>
          <p className="text-[16px] text-[#71717A] max-w-2xl mx-auto font-medium">
            A real-time visualization of how the multi-agent pipeline processes a complex customer query.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200} direction="up">
          <div className="max-w-4xl mx-auto bg-white border border-[#E4E4E7] rounded-2xl shadow-sm overflow-hidden">
            
            {/* Header / Controls */}
            <div className="border-b border-[#E4E4E7] bg-[#FAFAFA] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="h-4 w-px bg-[#E4E4E7] mx-2" />
                <span className="text-[12px] font-semibold text-[#71717A] tracking-wider uppercase">Live Trace</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePlayPause}
                  className="p-2 hover:bg-[#E4E4E7] rounded-lg transition-colors text-[#09090B]"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button 
                  onClick={handleReset}
                  className="p-2 hover:bg-[#E4E4E7] rounded-lg transition-colors text-[#71717A]"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-10 bg-white">
              <div className="relative border-l-2 border-[#E4E4E7] ml-4 md:ml-8 space-y-8">
                
                {steps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isPast = index < activeStep;
                  
                  return (
                    <div key={index} className={`relative pl-8 transition-opacity duration-500 ${isPast || isActive ? 'opacity-100' : 'opacity-40'}`}>
                      {/* Node Indicator */}
                      <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isPast 
                          ? 'bg-[#09090B] border border-[#09090B] text-white shadow-sm' 
                          : isActive 
                            ? 'bg-white border-2 border-[#09090B] shadow-[0_0_0_4px_rgba(9,9,11,0.1)]' 
                            : 'bg-white border-2 border-[#E4E4E7]'
                      }`}>
                        {isPast ? (
                          <Check size={11} strokeWidth={3} className="text-white" />
                        ) : isActive ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#09090B] animate-pulse" />
                        ) : null}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[12px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                            isPast ? 'text-[#09090B]' : isActive ? 'text-[#09090B]' : 'text-[#71717A]'
                          }`}>
                            Step 0{index + 1}: {step.label}
                          </span>
                          {isPast && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check size={10} strokeWidth={2.5} /> Completed
                            </span>
                          )}
                        </div>
                        
                        <div className={`mt-2 p-4 rounded-xl border transition-all duration-300 ${
                          isActive 
                            ? 'border-[#09090B] bg-[#FAFAFA] shadow-sm' 
                            : isPast 
                              ? 'border-[#E4E4E7] bg-[#FAFAFA]/50' 
                              : 'border-[#E4E4E7] bg-white'
                        }`}>
                          <pre className={`text-[14px] font-medium font-sans whitespace-pre-wrap ${isActive || isPast ? 'text-[#09090B]' : 'text-[#71717A]'}`}>
                            {step.desc}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
