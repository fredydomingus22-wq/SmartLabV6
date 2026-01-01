"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrainingAssignment, completeTrainingDocument, submitQuizAttempt } from "@/app/actions/quality/training"; // Import actions
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Clock, FileText, HelpCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ESignatureModal } from "../../_components/esignature-modal";

interface CoursePlayerProps {
    assignment: any; // Using any to avoid complex type reconstruction for now, ideally TrainingAssignment with nested quiz
    quizQuestions?: any[];
}

export default function CoursePlayer({ assignment, quizQuestions }: CoursePlayerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Defensive unwrap for Supabase array inference
    const module = Array.isArray(assignment.module) ? assignment.module[0] : assignment.module;

    const [elapsedSeconds, setElapsedSeconds] = useState(assignment.time_spent_seconds || 0);
    const [isReadingComplete, setIsReadingComplete] = useState(false);
    const [quizMode, setQuizMode] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // valid question IDs as keys
    const [showSignature, setShowSignature] = useState(false);
    const [pendingAction, setPendingAction] = useState<() => void>(() => { });

    useEffect(() => {
        // Simple timer
        const interval = setInterval(() => {
            setElapsedSeconds((prev: number) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleReadingComplete = () => {
        // Trigger Signature Modal
        setPendingAction(() => executeReadingComplete);
        setShowSignature(true);
    };

    const executeReadingComplete = () => {
        startTransition(async () => {
            const result = await completeTrainingDocument(assignment.id, elapsedSeconds);
            if (result.error) {
                toast.error(result.error);
            } else if (result.nextStep === 'quiz') {
                setQuizMode(true);
                toast.success("Document completed. Starting Quiz...");
            } else {
                toast.success("Training Completed!");
                router.push("/quality/training/my-training");
            }
        });
    };

    const handleQuizSubmit = () => {
        // Validate answers
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < (quizQuestions?.length || 0)) {
            toast.error("Please answer all questions.");
            return;
        }

        // Trigger Signature Modal
        setPendingAction(() => executeQuizSubmit);
        setShowSignature(true);
    };

    const executeQuizSubmit = () => {
        const formattedAnswers = Object.entries(answers).map(([qId, optId]) => ({
            questionId: qId,
            selectedOptionId: optId
        }));

        startTransition(async () => {
            const result = await submitQuizAttempt(assignment.id, formattedAnswers);
            if (result.error) {
                toast.error(result.error);
            } else if (result.passed) {
                toast.success(`Passed! Score: ${result.score}%`);
                router.push("/quality/training/my-training");
            } else {
                toast.error(`Failed. Score: ${result.score}%. Please try again.`);
                // Reset quiz?
                setAnswers({});
            }
        });
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
            {quizMode && quizQuestions ? (
                // QUIZ MODE VIEW
                <div className="max-w-3xl mx-auto space-y-6 w-full p-6 overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" onClick={() => setQuizMode(false)} className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Document
                        </Button>
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/50">Quiz Mode</Badge>
                    </div>

                    <GlassCard className="p-8">
                        <h2 className="text-2xl font-bold mb-6">Knowledge Check</h2>
                        <div className="space-y-8">
                            {quizQuestions.map((q, idx) => (
                                <div key={q.id} className="space-y-3">
                                    <h3 className="font-medium text-lg flex gap-2">
                                        <span className="text-muted-foreground">{idx + 1}.</span>
                                        {q.question_text}
                                    </h3>
                                    <div className="space-y-2 pl-6">
                                        {q.options.map((opt: any) => (
                                            <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value={opt.id}
                                                    checked={answers[q.id] === opt.id}
                                                    onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                                                    className="w-4 h-4 text-emerald-500 accent-emerald-500"
                                                />
                                                <span>{opt.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                            <Button
                                onClick={handleQuizSubmit}
                                disabled={isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]"
                            >
                                {isPending ? "Submitting..." : "Submit Answers"}
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            ) : (
                // DOCUMENT/VIDEO MODE VIEW
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => router.back()} size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-semibold">{module.title}</h1>
                                <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                                    {module.type} <span className="w-1 h-1 rounded-full bg-white/30" /> {formatTime(elapsedSeconds)}
                                </p>
                            </div>
                        </div>
                        <div>
                            {!isReadingComplete ? (
                                <Button
                                    onClick={handleReadingComplete}
                                    disabled={isPending || elapsedSeconds < 5} // Min 5 seconds force
                                    className={cn(
                                        "gap-2",
                                        isPending ? "opacity-50" : "bg-blue-600 hover:bg-blue-500"
                                    )}
                                >
                                    {isPending ? "Processing..." : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            I Have Read & Understood
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Badge variant="outline" className="border-green-500 text-green-400 gap-2 px-3 py-1">
                                    <CheckCircle className="w-4 h-4" /> Completed
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <GlassCard className="flex-1 m-4 p-0 overflow-hidden relative border-0 bg-black/40 backdrop-blur-md">
                        {module.type === 'document' ? (
                            // Placeholder for PDF Viewer or actual iframe if URL exists
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-12">
                                {module.content_url ? (
                                    <iframe src={module.content_url} className="w-full h-full border-0" />
                                ) : (
                                    <>
                                        <FileText className="w-24 h-24 mb-6 opacity-20" />
                                        <h3 className="text-xl font-medium">Document Viewer</h3>
                                        <p>Content would appear here. (No URL provided in demo)</p>
                                        <p className="text-xs mt-8 opacity-50">Timer is running: {formatTime(elapsedSeconds)}</p>
                                    </>
                                )}
                            </div>
                        ) : module.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                                {module.content_url ? (
                                    <video src={module.content_url} controls className="max-h-full max-w-full" />
                                ) : (
                                    <div className="text-center">
                                        <p>Video Placeholder</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p>Unsupported content type</p>
                            </div>
                        )}
                    </GlassCard>
                </>
            )}

            <ESignatureModal
                open={showSignature}
                onOpenChange={setShowSignature}
                onVerified={pendingAction}
                actionName={quizMode ? `${module.title} (Quiz)` : module.title}
            />
        </div>
    );
}
