import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative">
      <img 
        src="/Halftone.png" 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
      />
      <div className="text-center relative z-10">
        <h1 className="text-6xl mb-4 text-white font-navbar"><i className="fa-solid fa-explosion"></i> 404</h1>
        <p className="text-xl text-white/70 mb-4">Oops! Looks like the page is lost. <b/>Or maybe we are.</p>
        <a href="/" className="text-primary hover:text-primary/80 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
