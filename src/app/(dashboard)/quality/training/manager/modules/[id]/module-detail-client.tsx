"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addQuestionToQuiz, createQuizForModule, reorderQuizQuestions } from "@/app/actions/quality/training-authoring";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuizQuestionCard } from "./quiz-question-card";

// --- Schema ---
const QuestionFormSchema = z.object({
    question_text: z.string().min(3, "Question text required"),
    question_type: z.enum(['single_choice', 'multiple_choice', 'true_false']),
    points: z.coerce.number().min(1),
    options: z.array(z.object({
        id: z.string(),
        text: z.string(),
        is_correct: z.boolean()
    })).min(2, "At least 2 options required")
});

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

interface ModuleData {
    id: string;
    title: string;
    type: 'document' | 'video' | 'quiz' | 'external';
    duration_minutes: number;
}

interface QuizData {
    id: string;
    module_id: string;
}

export function ModuleDetailClient({
    moduleData,
    quizData,
    questions
}: {
    moduleData: ModuleData,
    quizData: QuizData | null,
    questions: Question[]
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [quizId, setQuizId] = useState<string | null>(quizData?.id || null);

    // Initialize Quiz
    const handleInitQuiz = () => {
        startTransition(async () => {
            const result = await createQuizForModule(moduleData.id);
            if (result.error) toast.error(result.error);
            else {
                setQuizId(result.quizId);
                toast.success("Quiz Initialized");
                router.refresh();
            }
        });
    };

    const form = useForm<z.infer<typeof QuestionFormSchema>>({
        resolver: zodResolver(QuestionFormSchema),
        defaultValues: {
            question_text: "",
            question_type: "single_choice",
            points: 10,
            options: [
                { id: "1", text: "", is_correct: true },
                { id: "2", text: "", is_correct: false }
            ]
        }
    });

    const onSubmit = (values: z.infer<typeof QuestionFormSchema>) => {
        if (!quizId) return;

        startTransition(async () => {
            const payload = { quiz_id: quizId, ...values };
            const result = await addQuestionToQuiz(payload);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Question Added");
                setOpen(false);
                form.reset({
                    question_text: "",
                    question_type: "single_choice",
                    points: 10,
                    options: [
                        { id: "1", text: "", is_correct: true },
                        { id: "2", text: "", is_correct: false }
                    ]
                });
                router.refresh();
            }
        });
    };

    const updateOption = (index: number, field: keyof QuestionOption, value: any) => {
        const current = form.getValues("options");
        const updated = [...current];
        // @ts-ignore
        updated[index][field] = value;
        form.setValue("options", updated);
    };

    const addOptionField = () => {
        const current = form.getValues("options");
        form.setValue("options", [...current, { id: Date.now().toString(), text: "", is_correct: false }]);
    };

    const handleReorder = (questionId: string, direction: 'up' | 'down') => {
        const currentIndex = questions.findIndex(q => q.id === questionId);
        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= questions.length) return;

        const newQuestions = [...questions];
        const temp = newQuestions[currentIndex];
        newQuestions[currentIndex] = newQuestions[newIndex];
        newQuestions[newIndex] = temp;

        startTransition(async () => {
            const questionIds = newQuestions.map(q => q.id);
            await reorderQuizQuestions(quizId!, questionIds);
            router.refresh();
        });
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <GlassCard className="p-8 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-500/5 to-transparent">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">{moduleData.title}</h1>
                        <p className="text-muted-foreground mt-2 capitalize flex items-center gap-2">
                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs">{moduleData.type} Module</span>
                            <span>•</span>
                            <span>{moduleData.duration_minutes} min duration</span>
                        </p>
                    </div>
                    {moduleData.type === 'quiz' && !quizId && (
                        <Button onClick={handleInitQuiz} disabled={isPending} className="bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all">
                            Initialize Quiz Engine
                        </Button>
                    )}
                </div>
            </GlassCard>

            {/* Quiz Editor Section */}
            {moduleData.type === 'quiz' && quizId && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center sticky top-4 z-10 bg-black/50 backdrop-blur-xl p-4 rounded-xl border border-white/5 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-blue-500 rounded-full" />
                            <h2 className="text-xl font-semibold">Questions Config</h2>
                            <span className="bg-white/10 text-xs px-2 py-1 rounded-full">{questions.length} Items</span>
                        </div>

                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all">
                                    <Plus className="w-4 h-4" /> Add Question
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-xl">Add New Question</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                                        <FormField
                                            control={form.control}
                                            name="question_text"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-foreground/80">Question Text</FormLabel>
                                                    <FormControl>
                                                        <textarea
                                                            {...field}
                                                            className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                                            placeholder="What is the primary function of..."
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="question_type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground/80">Type</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="bg-white/5 border-white/10 h-10"><SelectValue /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="single_choice">Single Choice</SelectItem>
                                                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                                                <SelectItem value="true_false">True / False</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="points"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-foreground/80">Points</FormLabel>
                                                        <FormControl><Input type="number" {...field} className="bg-white/5 border-white/10 h-10" /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/10">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-base font-medium">Answer Options</Label>
                                                <span className="text-xs text-muted-foreground">Mark correct answers based on type</span>
                                            </div>

                                            <div className="space-y-3">
                                                {form.watch("options").map((opt, idx) => (
                                                    <div key={idx} className="flex gap-3 items-center group animate-in slide-in-from-left-2 duration-300">
                                                        <span className="text-xs text-muted-foreground w-4 text-center">{idx + 1}</span>
                                                        <div className="flex-1 flex items-center gap-2">
                                                            <Input
                                                                value={opt.text}
                                                                onChange={(e) => updateOption(idx, "text", e.target.value)}
                                                                className="flex-1 bg-white/5 border-white/10 focus-visible:bg-white/10 transition-colors"
                                                                placeholder={`Option content...`}
                                                            />
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => updateOption(idx, "is_correct", !opt.is_correct)}
                                                            className={cn(
                                                                "border px-3 transition-all",
                                                                opt.is_correct
                                                                    ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                                                                    : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
                                                            )}
                                                        >
                                                            {opt.is_correct ? <CheckCircle className="w-4 h-4 mr-2" /> : <div className="w-4 h-4 mr-2 border rounded-full border-current" />}
                                                            {opt.is_correct ? "Correct" : "Incorrect"}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => {
                                                                const current = form.getValues("options");
                                                                if (current.length <= 2) return toast.error("Min 2 options");
                                                                form.setValue("options", current.filter((_, i) => i !== idx));
                                                            }}
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={addOptionField} className="w-full mt-2 border-dashed border-white/20 hover:bg-white/5">
                                                <Plus className="w-4 h-4 mr-2" /> Add Next Option
                                            </Button>
                                        </div>

                                        <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-500 min-w-[120px]">
                                                {isPending ? "Saving..." : "Save Question"}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4 pb-20">
                        {questions.map((q, idx) => (
                            <QuizQuestionCard
                                key={q.id}
                                question={q}
                                quizId={quizId!}
                                index={idx}
                                total={questions.length}
                                onReorder={handleReorder}
                            />
                        ))}
                        {questions.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <Plus className="w-8 h-8 text-white/20" />
                                </div>
                                <p className="text-lg font-medium text-white/50">Quiz is empty</p>
                                <p className="text-sm opacity-50">Add your first question to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
