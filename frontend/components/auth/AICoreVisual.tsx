"use client";

export function AICoreVisual() {
  return (
    <div className="relative w-full max-w-[280px] aspect-[4/3] flex items-center justify-center">
      {/* Central AI Node */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 bg-[#1E3A8A] rounded-full border border-blue-400/30 shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center justify-center z-10">
            <span className="text-[10px] font-mono font-medium text-blue-200 tracking-wider">AI</span>
          </div>
          {/* Subtle slow pulse behind core */}
          <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      {/* Outer Nodes */}
      <div className="absolute top-[20%] left-[15%] w-2 h-2 bg-blue-400/60 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)] z-10" />
      <div className="absolute bottom-[25%] left-[10%] w-1.5 h-1.5 bg-blue-300/50 rounded-full z-10" />
      <div className="absolute top-[30%] right-[15%] w-1.5 h-1.5 bg-blue-300/50 rounded-full z-10" />
      <div className="absolute bottom-[20%] right-[20%] w-2 h-2 bg-blue-400/60 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)] z-10" />

      {/* SVG Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full text-blue-400/20 z-0" viewBox="0 0 280 210" preserveAspectRatio="xMidYMid meet">
        {/* Lines from center (140, 105) to nodes */}
        {/* Top-Left node (approx 15%, 20% -> x:42, y:42) */}
        <line x1="140" y1="105" x2="42" y2="42" stroke="currentColor" strokeWidth="1" />
        {/* Bottom-Left node (approx 10%, 75% -> x:28, y:157) */}
        <line x1="140" y1="105" x2="28" y2="157" stroke="currentColor" strokeWidth="1" />
        {/* Top-Right node (approx 85%, 30% -> x:238, y:63) */}
        <line x1="140" y1="105" x2="238" y2="63" stroke="currentColor" strokeWidth="1" />
        {/* Bottom-Right node (approx 80%, 80% -> x:224, y:168) */}
        <line x1="140" y1="105" x2="224" y2="168" stroke="currentColor" strokeWidth="1" />
        
        {/* Occasional data pulse moving along a line */}
        <circle cx="140" cy="105" r="1.5" fill="rgba(96,165,250,0.8)">
          <animate 
            attributeName="cx" 
            values="140;42;140" 
            dur="6s" 
            repeatCount="indefinite" 
            keyTimes="0;0.5;1"
            calcMode="spline"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
          />
          <animate 
            attributeName="cy" 
            values="105;42;105" 
            dur="6s" 
            repeatCount="indefinite"
            keyTimes="0;0.5;1"
            calcMode="spline"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
          />
          <animate 
            attributeName="opacity" 
            values="0;1;0;0;0;0" 
            dur="6s" 
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}
