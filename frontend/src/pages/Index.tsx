import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GradientBlinds from '../components/ui/GradientBlinds';
import GlassSurface from '../components/ui/GlassSurface';
import BlurText from '../components/ui/BlurText';

const Navbar = () => {
  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
      <GlassSurface 
        width={600} 
        height={80} 
        borderRadius={40}
        backgroundOpacity={0.2}
        className="border border-white/30"
      >
        <div className="flex items-center justify-between w-full px-4" style={{ fontFamily: 'GeoForm, sans-serif' }}>
          <div className="flex items-center space-x-3">
            <img src="/Karya.png" alt="KaryaAI" className="w-8 h-8" />
            <span className="text-2xl font-bold text-white">Karya<span style={{ fontFamily: 'GeoForm-LightItalic, sans-serif' }}>AI</span></span>
          </div>
          <GlassSurface 
            width={120} 
            height={48} 
            borderRadius={24}
            backgroundOpacity={0.2}
            className="bg-primary/20"
          >
            <Link to="/signup" className="text-white text-lg font-medium hover:text-primary/90 transition-colors">
              Sign Up
            </Link>
          </GlassSurface>
        </div>
      </GlassSurface>
    </nav>
  );
};

const HeroSection = () => {
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [showParagraph, setShowParagraph] = useState(false);
  
  return (
    <section id="home" className="relative w-screen h-screen overflow-hidden">
      {/* BLINDS Background - Full Screen */}
      <GradientBlinds
        gradientColors={['#63c7b2','#80625aff','#53403bff','#80625aff','#63c7b2']}
        angle={15}
        noise={0.3}
        blindCount={20}
        blindMinWidth={35}
        spotlightRadius={0.25}
        spotlightSoftness={0.9}
        spotlightOpacity={0.17}
        mouseDampening={0.3}
        distortAmount={36}
        shineDirection="left"
        mixBlendMode="lighten"
        className="absolute inset-0 w-full h-full opacity-90"
      />
      
    
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="text-center max-w-4xl mx-auto px-6" style={{ fontFamily: 'AlphaLyrae, sans-serif' }}>
        
        
        <div className="text-6xl md:text-7xl font-bold mb-4 leading-tight h-[210px] md:h-[220px] flex flex-col justify-center">
          <div className="text-center h-[80px] md:h-[100px] flex items-center justify-center">
            <BlurText
              text="Bring Intelligence to your"
              delay={40}
              animateBy="words"
              direction="top"
              className="text-white text-center justify-center"
              onAnimationComplete={() => setShowSecondLine(true)}
            />
          </div>
          <div className="text-center h-[80px] md:h-[100px] flex items-center justify-center">
            {showSecondLine && (
              <BlurText
                text="Project Management"
                delay={10}
                animateBy="letters"
                direction="bottom"
                className="text-primary text-center justify-center"
                onAnimationComplete={() => setShowParagraph(true)}
              />
            )}
          </div>
        </div>
        
        <div className="h-[100px] flex items-center justify-center mb-8">
          {showParagraph && (
            <BlurText
              text="Transform your workflow with AI-driven task assignment, smart project planning, and automated team coordination. Experience the future of project management."
              delay={20}
              animateBy="words"
              direction="bottom"
              className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed text-center justify-center"
            />
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-12 justify-center items-center pointer-events-auto">
          <GlassSurface 
            width={200} 
            height={75} 
            borderRadius={40}
            backgroundOpacity={0.15}
            className="border border-white/20"
          >
            <Link 
              to="/signup" 
              className="text-white text-2xl font-medium hover:text-white/80 transition-colors pointer-events-auto"
            >
              Get Started
            </Link>
          </GlassSurface>
          <Link 
            to="/login" 
            className="bg-white text-black px-13 py-5 rounded-full text-2xl font-medium hover:bg-white/90 transition-all transform hover:scale-105 pointer-events-auto"
          >
            Sign In
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
};

export default function Index() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <HeroSection />
    </div>
  );
}