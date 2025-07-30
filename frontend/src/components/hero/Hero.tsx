'use client';
import HeroSection1 from './HeroSection1';
import HeroSection2 from './HeroSection2';
import CategoryRow from './HeroSection3';
import HeroSection4 from './HeroSection4';


const Hero = () => {
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header  */}
      

      {/* Hero Section */}
      <HeroSection1/>

      {/* Categories Section */}
      <HeroSection2/>
      

      {/* Featured Products */}
      <CategoryRow />


      {/* Story Section */}
      {/* Newsletter */}
      <HeroSection4/>
      

      {/* Footer */}
      
    </div>
  );
};

export default Hero;