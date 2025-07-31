"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Zap, Users, Anchor, Link, Navigation, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuizQuestion {
  id: string
  question: string
  answers: {
    id: string
    text: string
    styles: string[]
    route?: string
    followUp?: string
  }[]
}

interface QuizResult {
  primary: string
  secondary?: string
  isBlend: boolean
}

interface QuizState {
  step: "entry" | "path" | "blend" | "confirmation" | "result"
  questionIndex: number
  selectedPath: string
  answers: Record<string, string>
  needsBlend: boolean
  needsConfirmation: boolean
}

// Function to shuffle array
const shuffleArray = (array: any[]): any[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Function to randomize answer order
const randomizeAnswers = (answers: any[]) => {
  const shuffled = shuffleArray(answers);
  const letters = ['A', 'B', 'C', 'D', 'E'];
  return shuffled.map((answer, index) => ({
    ...answer,
    id: letters[index]
  }));
};

const entryQuestions: QuizQuestion[] = [
  {
    id: "entry1",
    question: "What best describes how you lead or influence others?",
    answers: [
      { id: "A", text: "I create momentum and drive action.", styles: ["catalyst", "connector"], route: "fast-paced" },
      { id: "B", text: "I bring structure and steady follow-through.", styles: ["anchor", "navigator"], route: "structure" },
      { id: "C", text: "I create emotional safety and strong human connection.", styles: ["diplomat", "connector"], route: "relationship" },
      { id: "D", text: "Honestly? A mix of two or more of these.", styles: ["mixed"], route: "blend" },
    ],
  },
  {
    id: "entry2",
    question: "What frustrates you most in group situations?",
    answers: [
      { id: "A", text: "When nothing is getting done.", styles: ["catalyst"], route: "fast-paced" },
      { id: "B", text: "When people are disorganized or short-sighted.", styles: ["anchor", "navigator"], route: "structure" },
      { id: "C", text: "When emotions are ignored or people feel left out.", styles: ["diplomat", "connector"], route: "relationship" },
    ],
  },
]

const pathQuestions = {
  "fast-paced": [
    {
      id: "fp1",
      question: "When things stall out, I usually:",
      answers: [
        { id: "A", text: "Inject energy and urgency to move it forward.", styles: ["catalyst"] },
        { id: "B", text: "Talk to people and get everyone back on the same page.", styles: ["connector"] },
        { id: "C", text: "Not quite either of these. Show me another option.", styles: ["mixed"], followUp: "fp1-alt" },
      ],
    },
    {
      id: "fp1-alt",
      question: "When things stall out, what feels most natural to you?",
      answers: [
        { id: "A", text: "Providing structure and calm", styles: ["anchor"] },
        { id: "B", text: "Holding space and emotional safety", styles: ["diplomat"] },
        { id: "C", text: "Framing the big picture", styles: ["navigator"] },
      ],
    },
    {
      id: "fp2",
      question: "When facing pressure or conflict, I usually:",
      answers: [
        { id: "A", text: "Get everyone communicating again", styles: ["connector"] },
        { id: "B", text: "Push through with urgency to keep moving", styles: ["catalyst"] },
        { id: "C", text: "Pause to check on emotional temperature", styles: ["diplomat"] },
      ],
    },
    {
      id: "fp3",
      question: "What drives your sense of urgency the most?",
      answers: [
        { id: "A", text: "The fear of missing opportunity", styles: ["catalyst"] },
        { id: "B", text: "Seeing people feel disconnected or lost", styles: ["connector"] },
        { id: "C", text: "Wanting to make sure it's truly the right time", styles: ["anchor", "navigator"] },
      ],
    },
  ],
  structure: [
    {
      id: "st1",
      question: "In complex situations, I prefer to:",
      answers: [
        { id: "A", text: "Break it into steps and stabilize it.", styles: ["anchor"] },
        { id: "B", text: "Step back and look at long-term impacts.", styles: ["navigator"] },
        { id: "C", text: "Not quite either of these. Show me another option.", styles: ["mixed"], followUp: "st1-alt" },
      ],
    },
    {
      id: "st1-alt",
      question: "In complex situations, what feels more natural to you?",
      answers: [
        { id: "A", text: "Sparking energy and action", styles: ["catalyst"] },
        { id: "B", text: "Holding space and emotional safety", styles: ["diplomat"] },
        { id: "C", text: "Creating clarity and unity", styles: ["connector"] },
      ],
    },
    {
      id: "st2",
      question: "What creates confidence for you in a messy situation?",
      answers: [
        { id: "A", text: "Having a steady, practical plan", styles: ["anchor"] },
        { id: "B", text: "Reconnecting to the bigger vision", styles: ["navigator"] },
        { id: "C", text: "Making sure everyone's aligned emotionally", styles: ["diplomat"] },
      ],
    },
    {
      id: "st3",
      question: "How do you usually prevent breakdowns?",
      answers: [
        { id: "A", text: "By mapping out potential risks and blockers", styles: ["navigator"] },
        { id: "B", text: "By putting the right systems in place early", styles: ["anchor"] },
        { id: "C", text: "By keeping people talking and collaborating", styles: ["connector"] },
      ],
    },
  ],
  relationship: [
    {
      id: "rel1",
      question: "My default way of helping is:",
      answers: [
        { id: "A", text: "Listening and tuning into emotions.", styles: ["diplomat"] },
        { id: "B", text: "Clarifying and building shared understanding.", styles: ["connector"] },
        { id: "C", text: "Not quite either of these. Show me another option.", styles: ["mixed"], followUp: "rel1-alt" },
      ],
    },
    {
      id: "rel1-alt",
      question: "When someone needs help, what's your natural instinct?",
      answers: [
        { id: "A", text: "Providing structure and calm", styles: ["anchor"] },
        { id: "B", text: "Sparking action or momentum", styles: ["catalyst"] },
        { id: "C", text: "Framing a longer-term vision", styles: ["navigator"] },
      ],
    },
    {
      id: "rel2",
      question: "When others are tense or struggling, I naturally:",
      answers: [
        { id: "A", text: "Hold space and make them feel safe", styles: ["diplomat"] },
        { id: "B", text: "Get people realigned and working together again", styles: ["connector"] },
        { id: "C", text: "Offer a practical next step", styles: ["anchor"] },
      ],
    },
    {
      id: "rel3",
      question: "What matters most to you when resolving issues?",
      answers: [
        { id: "A", text: "Emotional harmony", styles: ["diplomat"] },
        { id: "B", text: "Shared clarity", styles: ["connector"] },
        { id: "C", text: "Getting a clear plan and process", styles: ["anchor", "navigator"] },
      ],
    },
  ],
}

const blendQuestions = [
  {
    id: "blend1",
    question: "You tend to blend energy and depth. When you're under pressure, what shows up first?",
    answers: [
      { id: "A", text: "You spring into action", styles: ["catalyst"] },
      { id: "B", text: "You emotionally anchor and hold space", styles: ["diplomat"] },
      { id: "C", text: "You try to reconnect the group", styles: ["connector"] },
    ],
  },
  {
    id: "blend2",
    question: "Which feels more natural, even if you do both?",
    answers: [
      { id: "A", text: "Driving change and initiating movement", styles: ["catalyst", "navigator"] },
      { id: "B", text: "Building emotional trust and psychological safety", styles: ["diplomat", "connector"] },
      { id: "C", text: "Creating order and planning for success", styles: ["anchor"] },
    ],
  },
]

const confirmationQuestions = [
  {
    id: "confirm1",
    question: "People often describe me as:",
    answers: [
      { id: "A", text: "Bold and energizing", styles: ["catalyst"] },
      { id: "B", text: "Strategic and insightful", styles: ["navigator"] },
      { id: "C", text: "Empathetic and emotionally present", styles: ["diplomat"] },
      { id: "D", text: "Calm and dependable", styles: ["anchor"] },
      { id: "E", text: "Collaborative and connective", styles: ["connector"] },
    ],
  },
  {
    id: "confirm2",
    question: "When I'm leading, I care most about:",
    answers: [
      { id: "A", text: "Getting things done quickly", styles: ["catalyst"] },
      { id: "B", text: "Making sure people feel safe and seen", styles: ["diplomat"] },
      { id: "C", text: "Long-term vision and impact", styles: ["navigator"] },
      { id: "D", text: "A clean plan and reliable process", styles: ["anchor"] },
      { id: "E", text: "Everyone feeling aligned and involved", styles: ["connector"] },
    ],
  },
  {
    id: "confirm3",
    question: "My biggest influence strength is:",
    answers: [
      { id: "A", text: "Driving action", styles: ["catalyst"] },
      { id: "B", text: "Emotional presence", styles: ["diplomat"] },
      { id: "C", text: "Strategic vision", styles: ["navigator"] },
      { id: "D", text: "Steady structure", styles: ["anchor"] },
      { id: "E", text: "Unifying people", styles: ["connector"] },
    ],
  },
]

const tiebreakerQuestions = [
  {
    id: "tie1",
    question: "When you're at your best, what drives you most?",
    answers: [
      { id: "A", text: "Vision", styles: ["navigator"] },
      { id: "B", text: "Momentum", styles: ["catalyst"] },
      { id: "C", text: "People", styles: ["connector"] },
      { id: "D", text: "Stability", styles: ["anchor"] },
      { id: "E", text: "Emotion", styles: ["diplomat"] },
    ],
  },
  {
    id: "tie2",
    question: "What kind of feedback do you hear most?",
    answers: [
      { id: "A", text: "You keep things moving.", styles: ["catalyst"] },
      { id: "B", text: "You always understand people.", styles: ["diplomat"] },
      { id: "C", text: "You think big.", styles: ["navigator"] },
      { id: "D", text: "You're grounded and dependable.", styles: ["anchor"] },
      { id: "E", text: "You bring people together.", styles: ["connector"] },
    ],
  },
]

const getInfluenceIcon = (style: string, size = "w-8 h-8") => {
  const styles = style.split("-")

  const getIcon = (singleStyle: string) => {
    switch (singleStyle) {
      case "catalyst":
        return <Zap className={size} />
      case "diplomat":
        return <Users className={size} />
      case "anchor":
        return <Anchor className={size} />
      case "connector":
        return <Link className={size} />
      case "navigator":
        return <Navigation className={size} />
      default:
        return <MessageCircle className={size} />
    }
  }

  if (styles.length === 2) {
    return (
      <div className="flex items-center space-x-2">
        {getIcon(styles[0])}
        <span className="text-lg font-bold">+</span>
        {getIcon(styles[1])}
      </div>
    )
  }

  return getIcon(styles[0])
}

const styleDescriptions = {
  catalyst: {
    name: "Catalyst",
    description:
      "You create momentum and drive outcomes. People follow you because of your energy, confidence, and push-forward mindset.",
    color: "bg-orange-500",
  },
  connector: {
    name: "Connector",
    description: "You build bridges. You create alignment and connection that brings people together to make progress.",
    color: "bg-purple-500",
  },
  anchor: {
    name: "Anchor",
    description:
      "You provide consistency and structure. People trust you because you're steady, clear, and dependable.",
    color: "bg-green-500",
  },
  navigator: {
    name: "Navigator",
    description: "You lead with vision and strategic thinking. You zoom out and keep the big picture in focus.",
    color: "bg-blue-500",
  },
  diplomat: {
    name: "Diplomat",
    description:
      "You influence through empathy and presence. People open up around you and feel understood and supported.",
    color: "bg-pink-500",
  },
}

const blendDescriptions = {
  "catalyst-navigator": "You combine bold momentum with smart strategy. People are drawn to your drive, but stay because of your clarity and planning.",
  "catalyst-connector": "You move fast and bring people with you. Your energy inspires others, and your ability to connect makes it contagious.",
  "catalyst-diplomat": "You lead with passion but always tune in to others. You push forward while creating space for feelings and nuance.",
  "catalyst-anchor": "You bring focused energy and long-term consistency. You push things forward without losing your grounding.",
  "navigator-catalyst": "You lead with strategy, then bring the fire when it counts. People trust your plan, but feel your urgency.",
  "navigator-connector": "You influence through insight and intuition. You read the situation and the people in it, helping everyone move forward together.",
  "navigator-diplomat": "You lead with clarity and compassion. People look to you for smart plans that also feel fair and considerate.",
  "navigator-anchor": "You combine strategy and steadiness. People trust you to think ahead and hold the line when it counts.",
  "connector-catalyst": "You lead with relationships and energize others to move. Your influence feels both personal and powerful.",
  "connector-navigator": "You build trust quickly — then guide people with clarity. You connect on a human level and show them what's possible.",
  "connector-diplomat": "You connect deeply and calmly. People trust you because you listen, reflect, and create emotional safety.",
  "connector-anchor": "You're emotionally tuned-in and unwavering. People feel safe opening up to you because you're both relatable and reliable.",
  "diplomat-catalyst": "You lead with empathy and add fire when it matters. People feel your care but also your conviction.",
  "diplomat-navigator": "You guide with empathy and strategic thinking. You're emotionally grounded and intellectually clear.",
  "diplomat-connector": "You influence through emotional insight and connection. You make people feel understood, valued, and motivated to engage.",
  "diplomat-anchor": "You are a calm force of trust. People open up because you're steady and emotionally present — a rock in high-stakes moments.",
  "anchor-catalyst": "You're steady and strong — with a surprising ability to ignite momentum when needed. People rely on your foundation and follow your lead when you decide to move.",
  "anchor-navigator": "You bring stability and foresight. People trust you to plan ahead and stick with the process until the outcome is secure.",
  "anchor-connector": "You are loyal, grounded, and people-first. You build long-term trust through presence and relational consistency.",
  "anchor-diplomat": "You offer emotional steadiness and wisdom. People feel safe sharing with you because you lead with quiet confidence.",
}

const getStepInfo = (step: string, path?: string) => {
  switch (step) {
    case "entry":
      return {
        title: "Step 1: Understanding Your Natural Approach",
        subtitle: "Let's start by identifying your core influence patterns",
        description:
          "These questions help us understand how you naturally lead and what drives your communication style.",
        color: "from-[#92278F] to-purple-600",
      }
    case "path":
      const pathTitles = {
        "fast-paced": "Step 2: Fast-Paced Influencer Path",
        structure: "Step 2: Structure & Vision Path",
        relationship: "Step 2: Relationship-Centered Path",
      }
      const pathDescriptions = {
        "fast-paced": "You're action-oriented! Let's explore whether you're more of a Catalyst or Connector.",
        structure: "You value stability and planning! Let's see if you're more Anchor or Navigator.",
        relationship: "You prioritize people and connection! Let's determine if you're more Diplomat or Connector.",
      }
      return {
        title: pathTitles[path as keyof typeof pathTitles] || "Step 2: Exploring Your Style",
        subtitle: "Diving deeper into your influence approach",
        description:
          pathDescriptions[path as keyof typeof pathDescriptions] || "Let's explore your specific style patterns.",
        color: "from-blue-600 to-indigo-600",
      }
    case "blend":
      return {
        title: "Step 3: Blend Clarification",
        subtitle: "Let's clarify your blended approach",
        description: "You tend to blend different styles. Let's understand which combinations feel most natural to you.",
        color: "from-green-600 to-emerald-600",
      }
    case "confirmation":
      return {
        title: "Step 4: Style Confirmation",
        subtitle: "Final questions to confirm your style",
        description: "These questions help us finalize your influence style profile and ensure accuracy.",
        color: "from-purple-600 to-indigo-600",
      }
    default:
      return {
        title: "Influence Style Quiz",
        subtitle: "",
        description: "",
        color: "from-[#92278F] to-purple-600",
      }
  }
}

export default function QuickQuiz() {
  const [currentStep, setCurrentStep] = useState<"entry" | "path" | "blend" | "confirmation" | "result">("entry")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedPath, setSelectedPath] = useState<string>("")
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [result, setResult] = useState<QuizResult | null>(null)
  const [needsBlend, setNeedsBlend] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [history, setHistory] = useState<QuizState[]>([])
  const [randomizedQuestions, setRandomizedQuestions] = useState<{
    entry: QuizQuestion[]
    fastPaced: QuizQuestion[]
    structure: QuizQuestion[]
    relationship: QuizQuestion[]
    blend: QuizQuestion[]
    confirmation: QuizQuestion[]
    tiebreaker: QuizQuestion[]
  } | null>(null)
  const router = useRouter()

  // Client-side randomization
  useEffect(() => {
    const randomized = {
      entry: entryQuestions.map(q => ({
        ...q,
        answers: randomizeAnswers(q.answers.map(({ id, ...rest }) => rest))
      })),
      fastPaced: pathQuestions["fast-paced"].map(q => ({
        ...q,
        answers: randomizeAnswers(q.answers.map(({ id, ...rest }) => rest))
      })),
      structure: pathQuestions["structure"].map(q => ({
        ...q,
        answers: randomizeAnswers(q.answers.map(({ id, ...rest }) => rest))
      })),
      relationship: pathQuestions["relationship"].map(q => ({
        ...q,
        answers: randomizeAnswers(q.answers.map(({ id, ...rest }) => rest))
      })),
      blend: blendQuestions.map(q => ({
        ...q,
        answers: randomizeAnswers(q.answers.map(({ id, ...rest }) => rest))
      })),
      confirmation: confirmationQuestions.map(q => ({
        ...q,
        answers: randomizeAnswers(q.answers.map(({ id, ...rest }) => rest))
      })),
      tiebreaker: tiebreakerQuestions.map(q => ({
        ...q,
        answers: randomizeAnswers(q.answers.map(({ id, ...rest }) => rest))
      }))
    }
    setRandomizedQuestions(randomized)
  }, [])

  const getCurrentQuestions = () => {
    if (!randomizedQuestions) {
      // Return original questions during SSR
      switch (currentStep) {
        case "entry":
          return entryQuestions
        case "path":
          return pathQuestions[selectedPath as keyof typeof pathQuestions] || []
        case "blend":
          return blendQuestions
        case "confirmation":
          return confirmationQuestions
        default:
          return []
      }
    }

    // Return randomized questions on client
    switch (currentStep) {
      case "entry":
        return randomizedQuestions.entry
      case "path":
        if (selectedPath === "fast-paced") return randomizedQuestions.fastPaced
        if (selectedPath === "structure") return randomizedQuestions.structure
        if (selectedPath === "relationship") return randomizedQuestions.relationship
        return []
      case "blend":
        return randomizedQuestions.blend
      case "confirmation":
        return randomizedQuestions.confirmation
      default:
        return []
    }
  }

  const currentQuestions = getCurrentQuestions()
  const currentQuestion = currentQuestions[currentQuestionIndex]

  // Calculate total progress across all steps
  const getTotalProgress = () => {
    let totalQuestions = 2 // Entry questions
    if (selectedPath) {
      totalQuestions += 3 // Path questions
    }
    if (needsBlend) {
      totalQuestions += 2 // Blend questions
    }
    if (needsConfirmation) {
      totalQuestions += 3 // Confirmation questions
    }

    let completedQuestions = 0
    if (currentStep === "entry") {
      completedQuestions = currentQuestionIndex
    } else if (currentStep === "path") {
      completedQuestions = 2 + currentQuestionIndex
    } else if (currentStep === "blend") {
      completedQuestions = 5 + currentQuestionIndex
    } else if (currentStep === "confirmation") {
      completedQuestions = 7 + currentQuestionIndex
    }

    return Math.round((completedQuestions / totalQuestions) * 100)
  }

  const progress = getTotalProgress()
  const stepInfo = getStepInfo(currentStep, selectedPath)

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId)
  }

  const saveCurrentState = () => {
    const state: QuizState = {
      step: currentStep,
      questionIndex: currentQuestionIndex,
      selectedPath,
      answers: { ...answers },
      needsBlend,
      needsConfirmation,
    }
    setHistory((prev) => [...prev, state])
  }

  const calculateResult = (allAnswers: Record<string, string>) => {
    const styleScores: Record<string, number> = {
      catalyst: 0,
      connector: 0,
      anchor: 0,
      navigator: 0,
      diplomat: 0,
    }

    // Count style occurrences from all answers
    Object.entries(allAnswers).forEach(([questionId, answerId]) => {
      let question: QuizQuestion | undefined

      // Find the question using randomized questions if available
      if (randomizedQuestions) {
        if (questionId.startsWith("entry")) {
          question = randomizedQuestions.entry.find((q) => q.id === questionId)
        } else if (questionId.startsWith("fp")) {
          question = randomizedQuestions.fastPaced.find((q) => q.id === questionId)
        } else if (questionId.startsWith("st")) {
          question = randomizedQuestions.structure.find((q) => q.id === questionId)
        } else if (questionId.startsWith("rel")) {
          question = randomizedQuestions.relationship.find((q) => q.id === questionId)
        } else if (questionId.startsWith("tie")) {
          question = randomizedQuestions.tiebreaker.find((q) => q.id === questionId)
        }
      } else {
        // Fallback to original questions
        if (questionId.startsWith("entry")) {
          question = entryQuestions.find((q) => q.id === questionId)
        } else if (questionId.startsWith("fp")) {
          question = pathQuestions["fast-paced"].find((q) => q.id === questionId)
        } else if (questionId.startsWith("st")) {
          question = pathQuestions["structure"].find((q) => q.id === questionId)
        } else if (questionId.startsWith("rel")) {
          question = pathQuestions["relationship"].find((q) => q.id === questionId)
        } else if (questionId.startsWith("tie")) {
          question = tiebreakerQuestions.find((q) => q.id === questionId)
        }
      }

      if (question) {
        const answer = question.answers.find((a) => a.id === answerId)
        if (answer && !answer.styles.includes("mixed")) {
          answer.styles.forEach((style) => {
            if (styleScores[style] !== undefined) {
              styleScores[style]++
            }
          })
        }
      }
    })

    // Find top two styles
    const sortedStyles = Object.entries(styleScores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0)

    if (sortedStyles.length === 0) {
      return { primary: "catalyst", isBlend: false }
    }

    const [primaryStyle, primaryScore] = sortedStyles[0]
    const [secondaryStyle, secondaryScore] = sortedStyles[1] || [null, 0]

    // Determine if it's a blend (secondary score is close to primary)
    const isBlend = secondaryStyle && secondaryScore >= primaryScore * 0.6

    return {
      primary: primaryStyle,
      secondary: isBlend ? secondaryStyle : undefined,
      isBlend: !!isBlend,
    }
  }

  const handleNext = () => {
    if (!selectedAnswer) return

    // Save current state before moving forward
    saveCurrentState()

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: selectedAnswer,
    }
    setAnswers(newAnswers)

    if (currentStep === "entry") {
      if (currentQuestionIndex === 0) {
        // First entry question - determine initial path
        const answer = currentQuestion.answers.find((a) => a.id === selectedAnswer)
        if (answer && "route" in answer && answer.route) {
          setSelectedPath(answer.route as string)
        }
        setCurrentQuestionIndex(1)
        setSelectedAnswer("")
      } else {
        // Second entry question - confirm path and move to path questions
        const answer = currentQuestion.answers.find((a) => a.id === selectedAnswer)
        if (answer && "route" in answer && answer.route) {
          setSelectedPath(answer.route as string)
        }
        
        // Check if we need blend detection
        const mixedAnswers = Object.values(newAnswers).filter((answerId) => {
          const allQuestions = [...entryQuestions]
          for (const q of allQuestions) {
            const a = q.answers.find((ans) => ans.id === answerId)
            if (a && a.styles.includes("mixed")) return true
          }
          return false
        })

        if (mixedAnswers.length >= 1) {
          setNeedsBlend(true)
          setCurrentStep("blend")
          setCurrentQuestionIndex(0)
          setSelectedAnswer("")
        } else {
          setCurrentStep("path")
          setCurrentQuestionIndex(0)
          setSelectedAnswer("")
        }
      }
    } else if (currentStep === "path") {
      if (currentQuestionIndex < 2) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer("")
      } else {
        // Check if we need confirmation questions
        const mixedAnswers = Object.values(newAnswers).filter((answerId) => {
          const allQuestions = [...entryQuestions, ...Object.values(pathQuestions).flat() as QuizQuestion[]]
          for (const q of allQuestions) {
            const a = q.answers.find((ans) => ans.id === answerId)
            if (a && a.styles.includes("mixed")) return true
          }
          return false
        })

        if (mixedAnswers.length >= 2) {
          setNeedsConfirmation(true)
          setCurrentStep("confirmation")
          setCurrentQuestionIndex(0)
          setSelectedAnswer("")
        } else {
          // Calculate final result
          const finalResult = calculateResult(newAnswers)
          setResult(finalResult)
          setCurrentStep("result")
        }
      }
    } else if (currentStep === "blend") {
      if (currentQuestionIndex < 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer("")
      } else {
        // Move to confirmation questions
        setNeedsConfirmation(true)
        setCurrentStep("confirmation")
        setCurrentQuestionIndex(0)
        setSelectedAnswer("")
      }
    } else if (currentStep === "confirmation") {
      if (currentQuestionIndex < 2) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer("")
      } else {
        // Calculate final result
        const finalResult = calculateResult(newAnswers)
        setResult(finalResult)
        setCurrentStep("result")
      }
    }
  }

  const handlePrevious = () => {
    if (history.length === 0) return

    // Get the last state from history
    const previousState = history[history.length - 1]

    // Restore the previous state
    setCurrentStep(previousState.step)
    setCurrentQuestionIndex(previousState.questionIndex)
    setSelectedPath(previousState.selectedPath)
    setAnswers(previousState.answers)
    setNeedsBlend(previousState.needsBlend)
    setNeedsConfirmation(previousState.needsConfirmation)

    // Set the selected answer for the previous question
    const prevQuestions = (() => {
      if (randomizedQuestions) {
        switch (previousState.step) {
          case "entry":
            return randomizedQuestions.entry
          case "path":
            if (previousState.selectedPath === "fast-paced") return randomizedQuestions.fastPaced
            if (previousState.selectedPath === "structure") return randomizedQuestions.structure
            if (previousState.selectedPath === "relationship") return randomizedQuestions.relationship
            return []
          case "blend":
            return randomizedQuestions.blend
          case "confirmation":
            return randomizedQuestions.confirmation
          default:
            return []
        }
      } else {
        switch (previousState.step) {
          case "entry":
            return entryQuestions
          case "path":
            return pathQuestions[previousState.selectedPath as keyof typeof pathQuestions] || []
          case "blend":
            return blendQuestions
          case "confirmation":
            return confirmationQuestions
          default:
            return []
        }
      }
    })()

    const prevQuestion = prevQuestions[previousState.questionIndex]
    if (prevQuestion) {
      setSelectedAnswer(previousState.answers[prevQuestion.id] || "")
    }

    // Remove the last state from history
    setHistory((prev) => prev.slice(0, -1))
  }

  const getResultDisplay = () => {
    if (!result) return null

    const primaryStyle = styleDescriptions[result.primary as keyof typeof styleDescriptions]
    const secondaryStyle = result.secondary
      ? styleDescriptions[result.secondary as keyof typeof styleDescriptions]
      : null

    if (result.isBlend && result.secondary) {
      const blendKey = `${result.primary}-${result.secondary}` as keyof typeof blendDescriptions
      const blendDescription =
        blendDescriptions[blendKey] ||
        blendDescriptions[`${result.secondary}-${result.primary}` as keyof typeof blendDescriptions]

      return (
        <div className="text-center space-y-6">
          <div className="flex justify-center items-center space-x-4">
            <div className={`w-20 h-20 ${primaryStyle.color} rounded-full flex items-center justify-center text-white`}>
              {getInfluenceIcon(result.primary, "w-8 h-8")}
            </div>
            <div className="text-2xl font-bold text-gray-600">+</div>
            <div
              className={`w-20 h-20 ${secondaryStyle?.color} rounded-full flex items-center justify-center text-white`}
            >
              {getInfluenceIcon(result.secondary, "w-8 h-8")}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {primaryStyle.name}–{secondaryStyle?.name} Blend
            </h2>
            <p className="text-lg text-gray-700 mb-4">{blendDescription}</p>
          </div>
        </div>
      )
    } else {
      return (
        <div className="text-center space-y-6">
          <div
            className={`w-24 h-24 ${primaryStyle.color} rounded-full flex items-center justify-center text-white mx-auto`}
          >
            {getInfluenceIcon(result.primary, "w-10 h-10")}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Influence Style: {primaryStyle.name}</h2>
            <p className="text-lg text-gray-700">{primaryStyle.description}</p>
          </div>
        </div>
      )
    }
  }

  // Show loading state while randomizing questions
  if (!randomizedQuestions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#92278F] mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your personalized quiz...</p>
        </div>
      </div>
    )
  }

  if (currentStep === "result") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#92278F] to-[#a83399] text-white py-12">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-full" />
              <span className="text-2xl font-bold tracking-tight">The Influence Engine™</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Your Influence Style Revealed!</h1>
            <p className="text-xl text-white/90">
              Discover how this style can transform your communication and leadership
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <Card className="border-2 border-[#92278F]/20 bg-gradient-to-r from-[#92278F]/5 to-purple-50 mb-8">
            <CardContent className="p-8">{getResultDisplay()}</CardContent>
          </Card>

          {/* What This Means Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 text-center">What This Means for You</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🎯 Your Communication Strengths</h3>
                <p className="text-blue-800">
                  {result?.isBlend && result.secondary
                    ? `As a ${styleDescriptions[result.primary as keyof typeof styleDescriptions].name}–${styleDescriptions[result.secondary as keyof typeof styleDescriptions].name} blend, you have the unique ability to adapt your approach based on the situation.`
                    : `Your ${styleDescriptions[result?.primary as keyof typeof styleDescriptions]?.name} style means you naturally excel at ${styleDescriptions[result?.primary as keyof typeof styleDescriptions]?.description.toLowerCase()}`}
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <h3 className="font-semibold text-green-900 mb-2">🚀 How The Influence Engine™ Helps</h3>
                <p className="text-green-800">
                  The Influence Engine™ will adapt its coaching to your specific style, providing personalized guidance
                  that sounds like you and strengthens your natural influence patterns.
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                <h3 className="font-semibold text-purple-900 mb-2">💡 Next Steps</h3>
                <p className="text-purple-800">
                  Ready to experience AI coaching that's calibrated to your unique style? Start your free trial to
                  unlock personalized guidance for real-world situations.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Ready to Unlock Your Full Influence Potential?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              This quick assessment is just the beginning. Get your complete Influence Style toolkit and start your
              7-day free trial of The Influence Engine™.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/auth/signup")}
                className="bg-[#92278F] hover:bg-[#7a1f78] text-white px-8 py-3 text-lg font-semibold"
              >
                Start Your Free Trial
              </Button>
            </div>
            <p className="text-sm text-gray-500">No credit card required • 7-day free trial • Cancel anytime</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic Header Based on Step */}
      <div className={`bg-gradient-to-r ${stepInfo.color} text-white py-8`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full" />
              <span className="text-lg font-bold tracking-tight">The Influence Engine™</span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">{stepInfo.title}</h1>
            <p className="text-xl text-white/90 mb-4">{stepInfo.subtitle}</p>
            <p className="text-white/80 max-w-2xl mx-auto">{stepInfo.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              {currentStep === "entry" && `Question ${currentQuestionIndex + 1} of 2`}
              {currentStep === "path" && `Question ${currentQuestionIndex + 3} of ${needsConfirmation ? 8 : 5}`}
              {currentStep === "blend" && `Question ${currentQuestionIndex + 5} of 7`}
              {currentStep === "confirmation" && `Question ${currentQuestionIndex + 7} of 8`}
            </div>
            <div className="text-sm text-gray-600">{progress}% Complete</div>
          </div>
          <Progress value={progress} className="h-3 bg-gray-200" />
        </div>

        {/* Question Card */}
        <Card className="mb-8 border-2 border-gray-200 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentQuestion?.question}</h2>
              <p className="text-gray-600">
                Choose the answer that best describes your natural approach. There are no wrong answers!
              </p>
            </div>

            <div className="space-y-4">
              {currentQuestion?.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                    selectedAnswer === answer.id
                      ? "border-[#92278F] bg-[#92278F]/10 shadow-md transform scale-[1.02]"
                      : "border-gray-200 hover:border-gray-300 bg-white hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                        selectedAnswer === answer.id
                          ? "border-[#92278F] bg-[#92278F] text-white"
                          : "border-gray-400 text-gray-600"
                      }`}
                    >
                      {answer.id}
                    </div>
                    <span className="text-gray-800 leading-relaxed text-lg">{answer.text}</span>
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
            disabled={history.length === 0}
            className="flex items-center space-x-2 px-6 py-3 text-lg bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="bg-[#92278F] hover:bg-[#7a1f78] text-white flex items-center space-x-2 px-8 py-3 text-lg font-semibold"
          >
            <span>
              {currentStep === "path" && currentQuestionIndex === 2
                ? "Get My Results"
                : currentStep === "blend" && currentQuestionIndex === 1
                  ? "Continue"
                  : currentStep === "confirmation" && currentQuestionIndex === 2
                    ? "Get My Results"
                    : "Next"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Brand Info Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              <strong>About This Quiz:</strong> This assessment is based on The Influence Engine™ methodology, designed
              to identify your natural communication and leadership patterns.
            </p>
            <p className="text-xs text-gray-500">
              Built on coaching intelligence • Personalized to your style • Trusted by professionals
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
