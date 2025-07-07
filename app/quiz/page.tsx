"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

// Quiz data with all 36 questions
const quizData = [
  {
    id: 1,
    question:
      "When you're facing a complex challenge, what's your first instinct?",
    answers: [
      {
        id: "A",
        text: "I break it down into clear steps so I can manage it calmly.",
        style: "Anchor",
      },
      {
        id: "B",
        text: "I think through how others might be affected emotionally.",
        style: "Diplomat",
      },
      {
        id: "C",
        text: "I jump in and get things moving—action creates clarity.",
        style: "Catalyst",
      },
      {
        id: "D",
        text: "I make sure I understand everyone's perspective before making a move.",
        style: "Connector",
      },
      {
        id: "E",
        text: "I identify the long-term impact and map out the key risks.",
        style: "Navigator",
      },
    ],
  },
  {
    id: 2,
    question:
      "When you need to make a decision quickly, how do you approach it?",
    answers: [
      {
        id: "A",
        text: "I get everyone's input and make sure we're aligned",
        style: "Connector",
      },
      {
        id: "B",
        text: "I check how it fits into the bigger picture and long-term plans",
        style: "Navigator",
      },
      {
        id: "C",
        text: "I assess how it will impact those involved before making a move",
        style: "Diplomat",
      },
      {
        id: "D",
        text: "I make sure everything is organized and structured before starting",
        style: "Anchor",
      },
      {
        id: "E",
        text: "I move fast—opportunity doesn't wait",
        style: "Catalyst",
      },
    ],
  },
  {
    id: 3,
    question: "You know you've made a good decision when:",
    answers: [
      {
        id: "A",
        text: "It's grounded in long-term strategy and impact",
        style: "Navigator",
      },
      {
        id: "B",
        text: "It creates momentum, even if it's not perfect",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I've ensured everyone is on the same page and understands the path",
        style: "Connector",
      },
      {
        id: "D",
        text: "It aligns with people, not just outcomes",
        style: "Diplomat",
      },
      {
        id: "E",
        text: "It's solid, well-structured, and built to last",
        style: "Anchor",
      },
    ],
  },
  {
    id: 4,
    question: "When leading a project, your priority is:",
    answers: [
      {
        id: "A",
        text: "I evaluate the long-term effects before committing",
        style: "Navigator",
      },
      {
        id: "B",
        text: "I build energy and urgency to push things forward",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I make sure the key people understand and are ready to move",
        style: "Connector",
      },
      {
        id: "D",
        text: "I bring calm and find practical ways to execute",
        style: "Anchor",
      },
      {
        id: "E",
        text: "I pause to understand the emotional impact before moving forward",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 5,
    question: "When you encounter resistance to your ideas, you:",
    answers: [
      {
        id: "A",
        text: "I step back and map out all possible outcomes",
        style: "Navigator",
      },
      {
        id: "B",
        text: "I move quickly—action always brings clarity",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I seek alignment and input from the people involved",
        style: "Connector",
      },
      {
        id: "D",
        text: "I organize the steps to make sure it's doable",
        style: "Anchor",
      },
      {
        id: "E",
        text: "I check in with how others feel to gauge the right path",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 6,
    question: "What frustrates you most in decision-making?",
    answers: [
      {
        id: "A",
        text: "Ignoring the long-term impact and only focusing on the short-term",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Overthinking instead of taking action",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Moving forward without alignment and understanding",
        style: "Connector",
      },
      {
        id: "D",
        text: "Overcomplicating things instead of keeping it simple",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Missing emotional cues that affect the outcome",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 7,
    question: "When someone comes to you feeling overwhelmed, you:",
    answers: [
      {
        id: "A",
        text: "I break down the situation into manageable parts so they can see a way forward",
        style: "Anchor",
      },
      {
        id: "B",
        text: "I energize the conversation and remind them of their strengths",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I listen deeply to understand their feelings and show I'm with them",
        style: "Diplomat",
      },
      {
        id: "D",
        text: "I reflect back what I'm hearing so they know I understand",
        style: "Connector",
      },
      {
        id: "E",
        text: "I help them see the bigger picture and how it fits into their goals",
        style: "Navigator",
      },
    ],
  },
  {
    id: 8,
    question: "In a team meeting that's getting heated, you:",
    answers: [
      {
        id: "A",
        text: "I keep things practical and focused on what can be done",
        style: "Anchor",
      },
      {
        id: "B",
        text: "I help everyone see the positive outcomes we can reach",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I make sure everyone has space to share how they feel",
        style: "Diplomat",
      },
      {
        id: "D",
        text: "I bridge the misunderstandings and get us back on the same page",
        style: "Connector",
      },
      {
        id: "E",
        text: "I reframe the situation to show the bigger impact of resolving it",
        style: "Navigator",
      },
    ],
  },
  {
    id: 9,
    question: "When a team is stuck or losing momentum, you:",
    answers: [
      {
        id: "A",
        text: "I stabilize the mood and bring things back to clarity",
        style: "Anchor",
      },
      {
        id: "B",
        text: "I inject energy to shake off the tension and move forward",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I acknowledge the emotional impact and listen for what's underneath",
        style: "Diplomat",
      },
      {
        id: "D",
        text: "I find common ground and guide the conversation back to alignment",
        style: "Connector",
      },
      {
        id: "E",
        text: "I step back and look for the underlying pattern",
        style: "Navigator",
      },
    ],
  },
  {
    id: 10,
    question: "When you want to influence someone, you:",
    answers: [
      {
        id: "A",
        text: "Explain the long-term value and why it matters",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Speak with energy to build excitement",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Make sure everyone feels heard and part of it",
        style: "Connector",
      },
      { id: "D", text: "Keep it clear, simple, and doable", style: "Anchor" },
      {
        id: "E",
        text: "Tune into the emotional undertone before moving forward",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 11,
    question: "People trust you because you're known for:",
    answers: [
      {
        id: "A",
        text: "Showing that you've thought long-term and prepared",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Demonstrating boldness and certainty",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Creating connection and understanding",
        style: "Connector",
      },
      {
        id: "D",
        text: "Being clear, practical, and consistent",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Acknowledging emotional nuance and people's experiences",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 12,
    question: "You prefer to communicate:",
    answers: [
      {
        id: "A",
        text: "With structured reasoning and strategic backing",
        style: "Navigator",
      },
      {
        id: "B",
        text: "With enthusiasm and forward motion",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "By inviting discussion and collaboration",
        style: "Connector",
      },
      { id: "D", text: "With calm, grounded logic", style: "Anchor" },
      {
        id: "E",
        text: "By empathizing and connecting on a human level",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 13,
    question: "Others see you as influential because:",
    answers: [
      {
        id: "A",
        text: "That it's well-thought-out and tied to a bigger plan",
        style: "Navigator",
      },
      {
        id: "B",
        text: "That you're bold and take the lead",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "That you listen and adapt to others' input",
        style: "Connector",
      },
      {
        id: "D",
        text: "That you're consistent, fair, and organized",
        style: "Anchor",
      },
      {
        id: "E",
        text: "That you get where they're coming from emotionally",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 14,
    question: "When motivating others, you focus on:",
    answers: [
      { id: "A", text: "Their long-term goals and vision", style: "Navigator" },
      {
        id: "B",
        text: "The energy and momentum of the moment",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Their sense of belonging and clarity",
        style: "Connector",
      },
      { id: "D", text: "The logical path forward", style: "Anchor" },
      {
        id: "E",
        text: "Their emotional state and deeper concerns",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 15,
    question: "Your approach to building something new is:",
    answers: [
      {
        id: "A",
        text: "Build it to last with clear strategy",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Move fast—done is better than perfect",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Make sure everyone feels included and aligned",
        style: "Connector",
      },
      {
        id: "D",
        text: "Keep everything clean, structured, and realistic",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Ensure emotional harmony and motivation",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 16,
    question: "When a project stalls, you:",
    answers: [
      {
        id: "A",
        text: "Step back to re-align with the bigger picture",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Push energy into it and restart momentum",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Talk to the people involved to see what's blocking flow",
        style: "Connector",
      },
      {
        id: "D",
        text: "Reorganize the pieces so it's manageable again",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Feel into the emotional root of the delay",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 17,
    question: "You feel most satisfied when:",
    answers: [
      { id: "A", text: "Seeing strategy turn into impact", style: "Navigator" },
      {
        id: "B",
        text: "Watching things move quickly and efficiently",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Experiencing collective clarity and agreement",
        style: "Connector",
      },
      {
        id: "D",
        text: "Seeing clean systems and reliable outcomes",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Knowing people felt seen and safe throughout",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 18,
    question: "When something isn't working, your first move is to:",
    answers: [
      { id: "A", text: "Recheck the strategic foundation", style: "Navigator" },
      {
        id: "B",
        text: "Drive urgent action to course correct",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Bring everyone back into communication",
        style: "Connector",
      },
      {
        id: "D",
        text: "Fix the structure or tools causing friction",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Explore what emotions may be interfering",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 19,
    question: "Your natural leadership style is:",
    answers: [
      { id: "A", text: "Strategic calm", style: "Navigator" },
      { id: "B", text: "Bold initiation", style: "Catalyst" },
      { id: "C", text: "Emotional alignment", style: "Connector" },
      { id: "D", text: "Grounded consistency", style: "Anchor" },
      { id: "E", text: "Deep empathy", style: "Diplomat" },
    ],
  },
  {
    id: 20,
    question: "People value you for:",
    answers: [
      {
        id: "A",
        text: "Being reliable and focused on shared goals",
        style: "Anchor",
      },
      {
        id: "B",
        text: "Keeping things exciting and future-oriented",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Making people feel understood and respected",
        style: "Connector",
      },
      {
        id: "D",
        text: "Following through consistently and being organized",
        style: "Navigator",
      },
      {
        id: "E",
        text: "Being emotionally attuned and present",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 21,
    question: "When trust has been broken, you:",
    answers: [
      {
        id: "A",
        text: "Show a path forward and stay grounded",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Reset energy and refocus on what's next",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Open up a conversation and invite connection",
        style: "Connector",
      },
      {
        id: "D",
        text: "Clarify expectations and rebuild structure",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Acknowledge hurt and validate the emotions involved",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 22,
    question: "Others rely on you for:",
    answers: [
      {
        id: "A",
        text: "Your strategic insight and steadiness",
        style: "Navigator",
      },
      { id: "B", text: "Your boldness and can-do spirit", style: "Catalyst" },
      {
        id: "C",
        text: "Your ability to make them feel included and heard",
        style: "Connector",
      },
      {
        id: "D",
        text: "Your organization and sense of clarity",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Your emotional depth and attentiveness",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 23,
    question: "When someone is stuck, you help them by:",
    answers: [
      {
        id: "A",
        text: "Remind them of their bigger purpose",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Get them into action to shift the energy",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Ask questions to bring out their clarity",
        style: "Connector",
      },
      { id: "D", text: "Help them make a clear, doable plan", style: "Anchor" },
      {
        id: "E",
        text: "Stay with them emotionally and listen",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 24,
    question: "You show care by:",
    answers: [
      {
        id: "A",
        text: "Thoughtful planning and strategic generosity",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Small surprises and bold affirmations",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Checking in and making sure people feel seen",
        style: "Connector",
      },
      {
        id: "D",
        text: "Following through and being present consistently",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Deep listening and emotional availability",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 25,
    question: "What bothers you most in others?",
    answers: [
      {
        id: "A",
        text: "Poor planning and short-term thinking",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Inaction when something needs to be done",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Exclusion or lack of communication",
        style: "Connector",
      },
      { id: "D", text: "Sloppiness or unreliability", style: "Anchor" },
      {
        id: "E",
        text: "Emotional disconnection or dismissal",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 26,
    question: "When entering a new group, you:",
    answers: [
      {
        id: "A",
        text: "Observe dynamics and find the strategic fit",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Step in confidently and get the energy going",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Start connecting people and creating common ground",
        style: "Connector",
      },
      {
        id: "D",
        text: "Find a practical role and offer support",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Read the emotional atmosphere before engaging",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 27,
    question: "In a team, you naturally become:",
    answers: [
      { id: "A", text: "The planner and strategist", style: "Navigator" },
      { id: "B", text: "The activator and motivator", style: "Catalyst" },
      {
        id: "C",
        text: "The harmonizer and bridge-builder",
        style: "Connector",
      },
      { id: "D", text: "The organizer and implementer", style: "Anchor" },
      { id: "E", text: "The empath and emotional compass", style: "Diplomat" },
    ],
  },
  {
    id: 28,
    question: "When observing a situation, you first:",
    answers: [
      {
        id: "A",
        text: "Scan for patterns and power dynamics",
        style: "Navigator",
      },
      { id: "B", text: "Notice where the energy is stuck", style: "Catalyst" },
      {
        id: "C",
        text: "Listen for what's being said—and not said",
        style: "Connector",
      },
      {
        id: "D",
        text: "Look for practical problems and inefficiencies",
        style: "Anchor",
      },
      {
        id: "E",
        text: "Sense the emotional charge and pain points",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 29,
    question: "When a team is underperforming, you:",
    answers: [
      {
        id: "A",
        text: "Reconnect to the vision and strategy",
        style: "Navigator",
      },
      {
        id: "B",
        text: "Take a bold action to unstick momentum",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "Facilitate conversation and restore clarity",
        style: "Connector",
      },
      { id: "D", text: "Re-establish structure and process", style: "Anchor" },
      {
        id: "E",
        text: "Create space for emotional release and safety",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 30,
    question: "Your greatest strength is:",
    answers: [
      { id: "A", text: "Strategic foresight", style: "Navigator" },
      { id: "B", text: "Energetic drive", style: "Catalyst" },
      { id: "C", text: "Relational cohesion", style: "Connector" },
      { id: "D", text: "Reliable execution", style: "Anchor" },
      { id: "E", text: "Emotional intuition", style: "Diplomat" },
    ],
  },
  {
    id: 31,
    question:
      "When faced with competing priorities, how do you choose the next step?",
    answers: [
      {
        id: "A",
        text: "I prioritize based on long-term strategic goals",
        style: "Navigator",
      },
      {
        id: "B",
        text: "I push forward on the most actionable task",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I make sure everyone's aligned and clear on priorities",
        style: "Connector",
      },
      {
        id: "D",
        text: "I create a structured path and follow it",
        style: "Anchor",
      },
      {
        id: "E",
        text: "I listen for cues from others to understand what's most pressing",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 32,
    question:
      "What do you do when unexpected changes disrupt your original plan?",
    answers: [
      {
        id: "A",
        text: "I adjust the plan and refocus on the end goal",
        style: "Navigator",
      },
      {
        id: "B",
        text: "I build momentum to push through the disruption",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I bring everyone together to realign on the goal",
        style: "Connector",
      },
      {
        id: "D",
        text: "I lock down the essentials to prevent further chaos",
        style: "Anchor",
      },
      {
        id: "E",
        text: "I listen for emotional resistance and smooth it out",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 33,
    question: "When two people have opposing viewpoints, you:",
    answers: [
      {
        id: "A",
        text: "I map out both perspectives and build a strategic path forward",
        style: "Navigator",
      },
      {
        id: "B",
        text: "I create urgency and drive action to reach a resolution",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I facilitate a conversation to find common ground",
        style: "Connector",
      },
      {
        id: "D",
        text: "I stabilize the situation with a clear, practical approach",
        style: "Anchor",
      },
      {
        id: "E",
        text: "I listen deeply to understand the emotions beneath the conflict",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 34,
    question: "How do you measure success?",
    answers: [
      {
        id: "A",
        text: "I measure the long-term impact and strategic alignment",
        style: "Navigator",
      },
      {
        id: "B",
        text: "I look at the momentum it created and how fast we moved",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I evaluate how well everyone stayed aligned and understood",
        style: "Connector",
      },
      {
        id: "D",
        text: "I check for consistency and process efficiency",
        style: "Anchor",
      },
      {
        id: "E",
        text: "I consider how people were impacted and if trust was built",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 35,
    question: "When people resist your ideas, you:",
    answers: [
      {
        id: "A",
        text: "I reframe the conversation to reveal the bigger picture",
        style: "Navigator",
      },
      {
        id: "B",
        text: "I increase the urgency to create momentum",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I listen to the concerns and find mutual ground",
        style: "Connector",
      },
      {
        id: "D",
        text: "I reinforce the plan and remind people of the structure",
        style: "Anchor",
      },
      {
        id: "E",
        text: "I check for emotional triggers that might be causing the resistance",
        style: "Diplomat",
      },
    ],
  },
  {
    id: 36,
    question: "When managing risk, you:",
    answers: [
      {
        id: "A",
        text: "I build out contingency plans for each risk",
        style: "Navigator",
      },
      {
        id: "B",
        text: "I rally people around the vision to keep momentum",
        style: "Catalyst",
      },
      {
        id: "C",
        text: "I ensure everyone understands the moving parts and stays aligned",
        style: "Connector",
      },
      {
        id: "D",
        text: "I create structure and checkpoints to catch issues early",
        style: "Anchor",
      },
      {
        id: "E",
        text: "I check in emotionally to ensure everyone feels supported",
        style: "Diplomat",
      },
    ],
  },
];

export default function StyleQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const router = useRouter();

  const progress = ((currentQuestion + 1) / quizData.length) * 100;

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion]: selectedAnswer,
      }));

      if (currentQuestion < quizData.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer("");
      } else {
        // Calculate influence style and redirect
        calculateInfluenceStyle();
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || "");
    }
  };

  const calculateInfluenceStyle = () => {
    const styleScores: Record<string, number> = {
      Navigator: 0,
      Catalyst: 0,
      Connector: 0,
      Anchor: 0,
      Diplomat: 0,
    };

    // Count answers for each style
    Object.entries(answers).forEach(([questionIndex, answerId]) => {
      const question = quizData[Number.parseInt(questionIndex)];
      const answer = question.answers.find((a) => a.id === answerId);
      if (answer) {
        styleScores[answer.style]++;
      }
    });

    // Add current answer
    const currentAnswer = quizData[currentQuestion].answers.find(
      (a) => a.id === selectedAnswer
    );
    if (currentAnswer) {
      styleScores[currentAnswer.style]++;
    }

    // Sort styles by score (highest first)
    const sortedStyles = Object.entries(styleScores)
      .sort(([, a], [, b]) => b - a)
      .map(([style]) => style);

    const primaryStyle = sortedStyles[0];
    const secondaryStyle = sortedStyles[1];

    // Check if gap between top and second is less than 3
    const primaryScore = styleScores[primaryStyle];
    const secondaryScore = styleScores[secondaryStyle];
    const gap = primaryScore - secondaryScore;

    let finalSecondaryStyle = null;

    if (gap < 3) {
      finalSecondaryStyle = secondaryStyle;
    }

    // Redirect to signup with style information
    const params = new URLSearchParams({
      primary_style: primaryStyle.toLowerCase(),
      secondary_style: finalSecondaryStyle?.toLowerCase() || "",
    });

    router.push(`/auth/signup?${params.toString()}`);
  };

  const currentQuestionData = quizData[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-6 text-gray-600 hover:text-[#92278F]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Your Influence Style
          </h1>
          <p className="text-gray-600 mb-6">
            Answer these questions to understand how you naturally influence
            others
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {currentQuestion + 1} of {quizData.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Q{currentQuestionData.id}: {currentQuestionData.question}
              <span className="text-red-500 ml-1">*</span>
            </h2>

            <div className="space-y-3">
              {currentQuestionData.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedAnswer === answer.id
                      ? "border-[#92278F] bg-[#92278F]/5"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center text-sm font-medium ${
                        selectedAnswer === answer.id
                          ? "border-[#92278F] bg-[#92278F] text-white"
                          : "border-gray-400 text-gray-600"
                      }`}
                    >
                      {answer.id}
                    </div>
                    <span className="text-gray-800 leading-relaxed">
                      {answer.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center space-x-2 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="bg-[#92278F] hover:bg-[#7a1f78] text-white flex items-center space-x-2"
          >
            <span>
              {currentQuestion === quizData.length - 1
                ? "Complete Quiz"
                : "Next"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
