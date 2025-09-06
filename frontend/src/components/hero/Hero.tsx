'use client';
import HeroSection1 from './HeroSection1';
import HeroSection2 from './HeroSection2';
import CategoryRow from './HeroSection3';



const Hero = () => {
  
  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header  */}
      

      {/* Hero Section */}
      <HeroSection1/>

      {/* Categories Section */}
      <HeroSection2/>
      

      {/* Featured Products */}
      <CategoryRow />

      {/* Footer */}
      
    </div>
  );
};

export default Hero;