"use client";

import React, { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Handle,
    Position,
    NodeProps,
    Edge,
    Node
} from "reactflow";
import "reactflow/dist/style.css";
import { IndustrialCard } from "@/components/shared/industrial-card";
import { GitGraph, ArrowRight } from "lucide-react";
import { Box, Typography } from "@mui/material";

const ProcessNode = ({ data }: NodeProps) => (
    <Box className="flex items-center justify-center px-4 py-3 min-w-[140px] rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.1)] backdrop-blur-md">
        <Handle type="target" position={Position.Left} className="!bg-blue-500" />
        <Typography className="text-[10px] font-black uppercase tracking-widest">{data.label}</Typography>
        <Handle type="source" position={Position.Right} className="!bg-blue-500" />
    </Box>
);

const DecisionNode = ({ data }: NodeProps) => (
    <Box className="relative flex items-center justify-center w-[120px] h-[120px]">
        <Handle type="target" position={Position.Top} className="!bg-amber-500" />
        <Box className="absolute inset-0 bg-amber-600/10 border border-amber-500/30 rotate-45 rounded-lg backdrop-blur-sm" />
        <Typography className="relative z-10 text-[10px] font-black uppercase tracking-widest text-amber-400 text-center px-2">
            {data.label}
        </Typography>
        <Handle type="source" position={Position.Bottom} id="yes" className="!bg-emerald-500" />
        <Handle type="source" position={Position.Right} id="no" className="!bg-red-500" />
    </Box>
);

const TerminalNode = ({ data }: NodeProps) => (
    <Box className="flex items-center justify-center px-6 py-2 rounded-full bg-slate-900 border-2 border-slate-700 text-slate-400">
        <Handle type="target" position={Position.Left} className="!bg-slate-500" />
        <Typography className="text-[10px] font-black uppercase tracking-widest">{data.label}</Typography>
        <Handle type="source" position={Position.Right} className="!bg-slate-500" />
    </Box>
);

const nodeTypes = {
    process: ProcessNode,
    decision: DecisionNode,
    start: TerminalNode,
    end: TerminalNode,
};

interface Step {
    id: string;
    label: string;
    type: 'process' | 'decision' | 'start' | 'end';
}

interface ProcessFlowchartProps {
    steps?: Step[];
    title?: string;
    description?: string;
    height?: number;
}

const DEFAULT_STEPS: Step[] = [
    { id: '1', label: 'Início', type: 'start' },
    { id: '2', label: 'Coleta de Amostra', type: 'process' },
    { id: '3', label: 'Análise Lab', type: 'process' },
    { id: '4', label: 'Conforme?', type: 'decision' },
    { id: '5', label: 'Aprovação', type: 'process' },
    { id: '6', label: 'Fim', type: 'end' },
];

export function ProcessFlowchart({
    steps = DEFAULT_STEPS,
    title = "Fluxograma de Processo",
    description = "Sequência lógica das etapas de produção e controlo.",
    height = 500
}: ProcessFlowchartProps) {

    const { nodes, edges } = useMemo(() => {
        const nodes: Node[] = steps.map((s, i) => ({
            id: s.id,
            type: s.type,
            data: { label: s.label },
            position: { x: i * 200, y: s.type === 'decision' ? 50 : 100 }
        }));

        const edges: Edge[] = [];
        for (let i = 0; i < steps.length - 1; i++) {
            edges.push({
                id: `e${i}-${i + 1}`,
                source: steps[i].id,
                target: steps[i + 1].id,
                animated: true,
                style: { stroke: "#3b82f6", strokeWidth: 2 },
            });
        }

        return { nodes, edges };
    }, [steps]);

    return (
        <IndustrialCard
            title={title}
            subtitle={description}
            icon={GitGraph}
            className="h-full"
            bodyClassName="p-0"
        >
            <Box style={{ height }} className="bg-slate-950/20">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    style={{ background: 'transparent' }}
                >
                    <Background color="#1e293b" gap={20} />
                    <Controls className="!bg-slate-900 !border-slate-800" />
                </ReactFlow>
            </Box>
        </IndustrialCard>
    );
}
