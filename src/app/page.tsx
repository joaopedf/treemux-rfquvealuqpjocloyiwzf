'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, PhoneOff, Activity, AlertTriangle, FileText, Sparkles } from 'lucide-react';

const SAMPLE_SCENARIOS = [
  {
    title: 'Chest Pain Emergency',
    transcript: `Patient: Hello, I've been having severe chest pain for the past hour.
Nurse: Can you describe the pain? Where exactly is it?
Patient: It's right in the center of my chest, feels like pressure. It's spreading to my left arm.
Nurse: Are you having any difficulty breathing or sweating?
Patient: Yes, I'm sweating a lot and feeling a bit short of breath. I also feel nauseous.
Nurse: Do you have any history of heart problems?
Patient: My father had a heart attack at 50. I'm 52 now.`,
    urgency: 'CRITICAL',
  },
  {
    title: 'Diabetic Concern',
    transcript: `Patient: I've been feeling really dizzy and shaky for the last few hours.
Nurse: When did you last eat?
Patient: I had breakfast around 7am, it's 2pm now. I skipped lunch.
Nurse: Are you diabetic? Have you checked your blood sugar?
Patient: Yes, I have Type 2 diabetes. My blood sugar is 65 mg/dL.
Nurse: Are you taking insulin or any medications?
Patient: I take metformin twice daily. I took my morning dose.`,
    urgency: 'URGENT',
  },
  {
    title: 'Respiratory Infection',
    transcript: `Patient: I've had a cough and fever for three days now.
Nurse: What's your temperature?
Patient: It's been around 100-101°F. I've been taking Tylenol.
Nurse: Any difficulty breathing or chest pain?
Patient: No chest pain, but I do feel a bit congested. The cough is producing yellow mucus.
Nurse: Any other symptoms like body aches or fatigue?
Patient: Yes, I'm very tired and have some muscle aches.`,
    urgency: 'ROUTINE',
  },
];

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startCall = async (scenarioIndex: number) => {
    const scenario = SAMPLE_SCENARIOS[scenarioIndex];
    setSelectedScenario(scenarioIndex);
    setCurrentTranscript(scenario.transcript);
    setIsCallActive(true);
    setAiAnalysis('');
    setIsAnalyzing(true);

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/analyze-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: scenario.transcript,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze call');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          setAiAnalysis((prev) => prev + text);
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error analyzing call:', error);
        setAiAnalysis('Error analyzing call. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'URGENT':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'ROUTINE':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Activity className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">ClinicLink</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real-time AI assistant for rural healthcare clinics. Analyzes patient calls, extracts critical symptoms, and suggests immediate actions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Call Scenarios */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Patient Call Scenarios
                </CardTitle>
                <CardDescription>
                  Select a scenario to simulate a patient call and see real-time AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SAMPLE_SCENARIOS.map((scenario, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedScenario === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => !isCallActive && startCall(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{scenario.title}</h3>
                        <Badge
                          variant="outline"
                          className={getUrgencyColor(scenario.urgency)}
                        >
                          {scenario.urgency}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {scenario.transcript.substring(0, 150)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Call Status */}
            {isCallActive && (
              <Card className="border-blue-500 border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                      Call in Progress
                    </CardTitle>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={endCall}
                    >
                      <PhoneOff className="h-4 w-4 mr-2" />
                      End Call
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-3 text-sm">
                      <div className="font-semibold text-blue-600 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Live Transcript:
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {currentTranscript}
                      </p>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - AI Analysis */}
          <div className="space-y-4">
            <Card className="min-h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Clinical Analysis
                </CardTitle>
                <CardDescription>
                  Real-time analysis powered by Claude AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isCallActive && !aiAnalysis ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <AlertTriangle className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                      No active call
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Select a scenario to begin analysis
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    {isAnalyzing && !aiAnalysis ? (
                      <div className="flex items-center justify-center h-[400px]">
                        <div className="text-center">
                          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                          <p className="text-gray-600">Analyzing call transcript...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-5 w-5 text-purple-600" />
                            <span className="font-semibold text-purple-900">
                              Clinical Guidance
                            </span>
                          </div>
                          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {aiAnalysis || 'Processing...'}
                          </div>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">For Healthcare Professionals</p>
                    <p className="text-blue-800">
                      This AI assistant provides clinical guidance to support healthcare workers in rural clinics.
                      All recommendations should be reviewed by qualified medical personnel before implementation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Built for TreeHacks 2026 • Improving healthcare access in underserved communities</p>
        </div>
      </div>
    </div>
  );
}
