"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Trash, ArrowUp, ArrowDown, CheckCircle, MoreVertical } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteQuizQuestion } from "@/app/actions/quality/training-authoring";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface QuestionOption {
    id: string;
    text: string;
    is_correct: boolean;
}

interface Question {
    id: string;
    question_text: string;
    question_type: 'single_choice' | 'multiple_choice' | 'true_false';
    points: number;
    options: QuestionOption[];
}

interface QuestionCardProps {
    question: Question;
    quizId: string;
    index: number;
    total: number;
    onReorder: (id: string, direction: 'up' | 'down') => void;
}

export function QuizQuestionCard({ question, quizId, index, total, onReorder }: QuestionCardProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm("Are you sure you want to delete this question?")) return;

        startTransition(async () => {
            const result = await deleteQuizQuestion(quizId, question.id);
            if (result.error) toast.error(result.error);
            else toast.success("Question deleted");
        });
    };

    return (
        <GlassCard className={cn(
            "p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/10 group relative animate-in fade-in slide-in-from-bottom-2",
            isPending && "opacity-50 pointer-events-none"
        )}>
            <div className="flex justify-between items-start gap-4">
                {/* Index & Content */}
                <div className="flex gap-4 flex-1">
                    <div className="flex flex-col items-center gap-1 pt-1">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-mono text-muted-foreground">
                            {index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-white/20"
                                disabled={index === 0}
                                onClick={() => onReorder(question.id, 'up')}
                            >
                                <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 hover:bg-white/20"
                                disabled={index === total - 1}
                                onClick={() => onReorder(question.id, 'down')}
                            >
                                <ArrowDown className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 flex-1">
                        <div className="flex items-start justify-between">
                            <h3 className="font-medium text-lg leading-snug">{question.question_text}</h3>
                            <span className="text-[10px] uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                                {question.points} PTS
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {question.options.map((opt, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "text-sm flex items-center gap-2 p-2 rounded-lg border transition-colors",
                                        opt.is_correct
                                            ? "bg-green-500/10 border-green-500/20 text-green-100"
                                            : "bg-white/5 border-transparent text-muted-foreground"
                                    )}
                                >
                                    {opt.is_correct ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <div className="w-3.5 h-3.5" />}
                                    <span className="truncate">{opt.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/90 border-white/10 backdrop-blur-xl">
                        <DropdownMenuItem className="text-red-400 hover:text-red-300 cursor-pointer focus:text-red-300 focus:bg-red-900/20" onClick={handleDelete}>
                            <Trash className="w-4 h-4 mr-2" /> Delete Question
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </GlassCard>
    );
}
