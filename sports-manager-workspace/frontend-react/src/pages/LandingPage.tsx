import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import VideoScroll from '../components/landing/VideoScroll';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import LiveDemo from '../components/landing/LiveDemo';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import SectionParticleBg from '../components/landing/SectionParticleBg';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'clip' }} className="min-h-screen">
      <Navbar />
      <Hero />
      <div style={{ position: 'relative' }}>
        <SectionParticleBg />
        <VideoScroll />
        <Features />
        <HowItWorks />
        <LiveDemo />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}
