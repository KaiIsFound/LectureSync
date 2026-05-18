'use client';

import dynamic from 'next/dynamic';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorks from '@/components/landing/HowItWorks';
import HardwareSection from '@/components/landing/HardwareSection';
import DemoSection from '@/components/landing/DemoSection';
import Footer from '@/components/landing/Footer';

const ParticleField = dynamic(() => import('@/components/landing/ParticleField'), {
  ssr: false,
});

const CursorGlow = dynamic(() => import('@/components/landing/CursorGlow'), {
  ssr: false,
});

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-bg text-text-primary overflow-x-hidden transition-colors duration-300">
      <CursorGlow />
      <div className="dark:block hidden">
        <ParticleField />
      </div>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <HardwareSection />
        <DemoSection />
      </main>
      <Footer />
    </div>
  );
}
