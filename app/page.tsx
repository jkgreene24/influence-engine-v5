"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Zap,
  Users,
  Anchor,
  Link,
  Navigation,
  ArrowRight,
  Shield,
  CheckCircle,
  Play,
  LogIn,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Seller Conversations",
      description:
        "Real-time phrasing for objections, negotiations, ghosting, or deals that feel tense.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Attorney or Partner Meetings",
      description:
        "Prepares you for boundary-setting, credibility-building, and handling high-stakes conversations with clarity and confidence.",
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Mindset & Motivation Support",
      description:
        "When you're stuck, overwhelmed, or second-guessing, The Influence Engine™ adapts tone and pacing to help you recalibrate.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Built on Coaching Logic",
      description:
        "Not canned responses. Responds to emotional cues like hesitation, urgency, or overwhelm with personalized guidance.",
    },
  ];

  const influenceStyles = [
    {
      icon: <Zap className="w-6 h-6" />,
      name: "Catalyst",
      color: "bg-orange-500",
    },
    {
      icon: <Users className="w-6 h-6" />,
      name: "Diplomat",
      color: "bg-blue-500",
    },
    {
      icon: <Anchor className="w-6 h-6" />,
      name: "Anchor",
      color: "bg-green-500",
    },
    {
      icon: <Link className="w-6 h-6" />,
      name: "Connector",
      color: "bg-purple-500",
    },
    {
      icon: <Navigation className="w-6 h-6" />,
      name: "Navigator",
      color: "bg-red-500",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Discover Your Influence Style",
      description:
        "Take the 36-question quiz to identify how you naturally lead, speak, and influence others. This is required before accessing the live coaching tool.",
    },
    {
      step: "2",
      title: "Start Your Free Trial",
      description:
        "Once your style is unlocked, The Influence Engine™ begins adapting to you in real time. Coaching access starts immediately after your quiz results.",
    },
    {
      step: "3",
      title: "Rephrase or Refine",
      description:
        "Get examples, questions to ask, or alternate phrasing that actually sounds like you.",
    },
    {
      step: "4",
      title: "Learn While the Engine Evolves",
      description:
        "Every interaction makes the system smarter. With human-guided feedback, The Influence Engine™ continuously improves its coaching precision over time.",
    },
  ];

  const differentiators = [
    "Built on coaching logic, not canned responses",
    "Responds to emotional cues like hesitation, urgency, or overwhelm",
    "Adapts phrasing to your unique Influence Style—from Anchor to Catalyst",
    "Evolves through live feedback—not static scripts",
    "Works across industries, starting with real estate",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 rounded-full"
              />
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                The Influence Engine™
              </span>
            </div>
            <div className="flex items-center space-x-8">
              <a
                href="#about"
                className="text-gray-700 hover:text-[#92278F] transition-colors duration-200 font-medium"
              >
                About
              </a>
              <a
                href="#quiz"
                className="text-gray-700 hover:text-[#92278F] transition-colors duration-200 font-medium"
              >
                Quiz
              </a>
              <a
                href="#community"
                className="text-gray-700 hover:text-[#92278F] transition-colors duration-200 font-medium"
              >
                Community
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-[#92278F] transition-colors duration-200 font-medium"
              >
                Contact
              </a>
              <Button
                onClick={() => (window.location.href = "/auth/signin")}
                className="bg-[#92278F] hover:bg-[#7a1f78] text-white font-medium"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#92278F] to-[#a83399] text-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight leading-none">
              The Influence Engine™
            </h1>
            <p className="text-2xl md:text-3xl text-white/95 mb-6 max-w-4xl mx-auto font-medium leading-tight">
              Coaching that adapts to your voice. In real time.
            </p>
            <p className="text-xl text-white/85 mb-12 max-w-4xl mx-auto leading-relaxed">
              Not a chatbot. Not a script.
              <br />
              An intelligent coaching platform designed to sound like you, think
              with you, and guide you forward—based on how you naturally
              influence.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <Button
                size="lg"
                className="bg-white text-[#92278F] hover:bg-white/95 text-lg px-10 py-4 font-semibold tracking-wide flex items-center space-x-3 shadow-lg"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Play className="w-5 h-5" />
                <span>Take the Style Quiz to Begin</span>
                <ArrowRight
                  className={`w-5 h-5 transition-transform ${
                    isHovered ? "translate-x-1" : ""
                  }`}
                />
              </Button>
              <Button
                size="lg"
                onClick={() => (window.location.href = "/chat")}
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[#92278F] text-lg px-10 py-4 bg-transparent font-semibold tracking-wide"
              >
                Try Demo Chat
              </Button>
            </div>
            <p className="text-sm text-white/75 max-w-2xl mx-auto leading-relaxed">
              You'll unlock your Influence Style Snapshot first.
              <br />
              Your free trial starts immediately after the quiz.
            </p>
          </div>
        </div>
      </section>

      {/* What Is The Influence Engine Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-8 tracking-tight leading-tight">
              What Is The Influence Engine™?
            </h2>
            <div className="max-w-5xl mx-auto">
              <p className="text-xl text-gray-700 mb-8 leading-relaxed font-medium">
                The Influence Engine™ is an adaptive AI-powered coaching system
                that helps you speak more clearly, lead more effectively, and
                communicate with confidence—in your own voice, not someone
                else's.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                It responds to your influence style, emotional tone, and
                real-world scenarios with phrasing, strategy, and support
                calibrated to you.
              </p>
              <p className="text-lg text-gray-700 font-semibold tracking-wide">
                Built on GPT. Customized with coaching intelligence. Trained to
                evolve with every conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Where It Helps Most Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Where It Helps Most
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 hover:border-[#92278F]/30 transition-all duration-300 hover:shadow-xl bg-white"
              >
                <CardHeader className="text-center pb-6">
                  <div className="w-20 h-20 bg-[#92278F]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#92278F]">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 tracking-tight">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {howItWorks.map((step, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-[#92278F] rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes It Different Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              What Makes It Different
            </h2>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 gap-6">
              {differentiators.map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <CheckCircle className="w-7 h-7 text-[#92278F] flex-shrink-0 mt-1" />
                  <p className="text-lg text-gray-700 leading-relaxed font-medium">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Influence Styles Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Five Core Influence Styles
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              The Influence Engine™ adapts to your unique communication style,
              ensuring every conversation is tailored to your preferences and
              personality.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {influenceStyles.map((style, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 bg-white rounded-full px-8 py-6 hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-200"
              >
                <div
                  className={`w-14 h-14 ${style.color} rounded-full flex items-center justify-center text-white`}
                >
                  {style.icon}
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                  {style.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trial + Community Access Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Trial + Community Access
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="border-2 border-[#92278F]/20 hover:border-[#92278F]/40 transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
                  Start With a 7-Day Free Trial
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Take the quiz → Interact with The Influence Engine™ in real
                  time → Unlock your full Influence Style toolkit after your
                  trial.
                </p>
                <Button className="bg-[#92278F] hover:bg-[#7a1f78] text-white text-lg px-10 py-4 font-semibold tracking-wide">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#92278F]/20 hover:border-[#92278F]/40 transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">
                  Join the Private Community
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6 text-lg">
                  After the trial, gain access to:
                </p>
                <ul className="text-gray-600 text-left mb-8 space-y-3 text-lg">
                  <li>• The Notion resource hub</li>
                  <li>• Slack support channels</li>
                  <li>• Ongoing updates and coaching prompts</li>
                </ul>
                <Button
                  variant="outline"
                  className="border-2 border-[#92278F] text-[#92278F] hover:bg-[#92278F] hover:text-white text-lg px-10 py-4 bg-transparent font-semibold tracking-wide"
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-[#92278F] to-[#a83399] text-white py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-8 tracking-tight leading-tight">
            Built From Coaching. Calibrated To You.
          </h2>
          <p className="text-2xl mb-4 font-medium">
            The Influence Engine™ doesn't replace your voice.
          </p>
          <p className="text-2xl font-bold mb-12">It strengthens it.</p>
          <p className="text-lg mb-12 text-white/90 leading-relaxed max-w-4xl mx-auto">
            Whether you're handling objections, preparing for a critical
            conversation, or searching for the right words under pressure—this
            is coaching that helps you speak with clarity, not conformity.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              className="bg-white text-[#92278F] hover:bg-white/95 text-lg px-10 py-4 font-semibold tracking-wide"
            >
              Take the Style Quiz Now
            </Button>
            <Button
              size="lg"
              onClick={() => (window.location.href = "/chat")}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-[#92278F] text-lg px-10 py-4 bg-transparent font-semibold tracking-wide"
            >
              Try Demo Chat
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 rounded-full mr-3 inline-block"
              />
              <span className="text-2xl font-bold text-white align-middle tracking-tight">
                The Influence Engine™
              </span>
            </div>
            <div className="flex space-x-8 text-gray-300">
              <a
                href="#"
                className="hover:text-white transition-colors duration-200 font-medium"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-200 font-medium"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors duration-200 font-medium"
              >
                Support
              </a>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-400 font-medium">
              &copy; {new Date().getFullYear()} The Influence Engine™. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
