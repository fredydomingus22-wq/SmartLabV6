"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Position,
    MarkerType,
    NodeProps,
    Handle,
    Connection,
    addEdge,
    Edge,
    Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { IndustrialCard } from "@/components/shared/industrial-card";
import { Box, Typography, Button, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Plus, Trash2, Edit2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Custom Node Types ---

const EffectNode = ({ data }: NodeProps) => (
    <Box className="px-5 py-4 bg-rose-500/20 border-2 border-rose-500 rounded-xl text-center min-w-[200px] shadow-[0_0_30px_rgba(244,63,94,0.3)] relative">
        <Typography className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Efeito / Problema (Target)</Typography>
        <Typography className="text-sm font-black text-white">{data.label}</Typography>
        <Handle type="target" position={Position.Left} className="w-4 h-4 !bg-rose-500 !border-none translate-x-1" />
    </Box>
);

const CategoryNode = ({ data }: NodeProps) => (
    <Box className="px-4 py-2 bg-slate-900 border-2 border-blue-500/50 rounded-lg text-center min-w-[140px] hover:border-blue-500 transition-all shadow-lg group">
        <Typography className="text-[11px] font-black text-blue-400 uppercase tracking-widest group-hover:text-white transition-colors">
            {data.label}
        </Typography>
        <Handle type="source" position={data.spinePosition === "top" ? Position.Bottom : Position.Top} className="!bg-blue-500 !border-none" />
    </Box>
);

const CauseNode = ({ data }: NodeProps) => (
    <Box className="px-3 py-1.5 bg-slate-800/80 border border-white/10 rounded-md text-left min-w-[120px] hover:border-white/30 transition-all shadow-md group relative">
        <Typography className="text-[11px] text-slate-200 font-medium group-hover:text-white">
            {data.label}
        </Typography>
        <Handle type="target" position={Position.Left} className="!bg-slate-600 !border-none w-2 h-2" />
        <Handle type="source" position={Position.Right} className="!bg-slate-600 !border-none w-2 h-2" />
    </Box>
);

const nodeTypes = {
    effect: EffectNode,
    category: CategoryNode,
    cause: CauseNode,
};

// --- Helper Functions ---

const createIshikawaLayout = (effectLabel: string, initialCategories?: any) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. Central Spine Target (Effect)
    nodes.push({
        id: "effect",
        type: "effect",
        position: { x: 900, y: 300 },
        data: { label: effectLabel },
        draggable: true,
    });

    // 2. Categories (ribs)
    const mCategories = initialCategories || [
        { id: "m1", label: "Mão de Obra", pos: "top", x: 100 },
        { id: "m2", label: "Máquina", pos: "top", x: 350 },
        { id: "m3", label: "Material", pos: "top", x: 600 },
        { id: "m4", label: "Método", pos: "bottom", x: 100 },
        { id: "m5", label: "Medição", pos: "bottom", x: 350 },
        { id: "m6", label: "Meio Ambiente", pos: "bottom", x: 600 },
    ];

    mCategories.forEach((cat: any) => {
        const yPos = cat.pos === "top" ? 50 : 550;
        nodes.push({
            id: cat.id,
            type: "category",
            position: { x: cat.x, y: yPos },
            data: { label: cat.label, spinePosition: cat.pos },
        });

        // Rib lines (edges to spine)
        edges.push({
            id: `edge-${cat.id}`,
            source: cat.id,
            target: "effect",
            type: "smoothstep",
            style: { stroke: "#3b82f6", strokeWidth: 3, opacity: 0.6 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
        });
    });

    return { nodes, edges };
};

// --- Main Component ---

interface IshikawaChartProps {
    effect: string;
    description?: string;
    height?: number;
    initialCategories?: any;
    onSave?: (data: any) => void;
    isSaving?: boolean;
}

export function IshikawaChart({ effect, description, height = 600, initialCategories, onSave, isSaving }: IshikawaChartProps) {
    const layout = useMemo(() => createIshikawaLayout(effect, initialCategories), [effect, initialCategories]);

    const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newNodeLabel, setNewNodeLabel] = useState("");

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, style: { stroke: "#475569", strokeWidth: 1.5 } }, eds)),
        [setEdges]
    );

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        if (node.id === "effect") return;
        setSelectedNodeId(node.id);
    };

    const handleAddCause = () => {
        if (!selectedNodeId) return;
        setIsDialogOpen(true);
    };

    const confirmAddCause = () => {
        if (!newNodeLabel.trim() || !selectedNodeId) return;

        const parentNode = nodes.find(n => n.id === selectedNodeId);
        if (!parentNode) return;

        const id = `cause-${Date.now()}`;
        const newNode: Node = {
            id,
            type: "cause",
            position: {
                x: parentNode.position.x + (Math.random() * 50 + 50),
                y: parentNode.position.y + (Math.random() * 50 + 20)
            },
            data: { label: newNodeLabel },
        };

        const newEdge: Edge = {
            id: `e-${id}`,
            source: selectedNodeId,
            target: id,
            style: { stroke: "#64748b", strokeWidth: 1.5 },
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => eds.concat(newEdge));
        setNewNodeLabel("");
        setIsDialogOpen(false);
    };

    const handleDeleteNode = () => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
        setSelectedNodeId(null);
    };

    const handleSave = () => {
        if (onSave) {
            onSave({ nodes, edges });
        }
    };

    return (
        <IndustrialCard
            title="Professional Ishikawa (Fishbone) Analysis"
            subtitle={description || "Análise de Causa Raiz (RCA) - Framework 6M"}
            icon={Save}
            actions={
                <Stack direction="row" spacing={1}>
                    {selectedNodeId && (
                        <>
                            <Button size="small" variant="outlined" className="h-8 text-[10px] uppercase font-black tracking-widest border-slate-700 hover:bg-white/5" onClick={handleAddCause}>
                                <Plus className="h-3 w-3 mr-1" /> Add Causa
                            </Button>
                            <Button size="small" variant="outlined" className="h-8 text-[10px] uppercase font-black tracking-widest border-rose-900/40 text-rose-500 hover:bg-rose-500/10" onClick={handleDeleteNode}>
                                <Trash2 className="h-3 w-3 mr-1" /> Remover
                            </Button>
                        </>
                    )}
                    <Button
                        size="small"
                        variant="contained"
                        className="h-8 text-[10px] uppercase font-black tracking-widest bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? "Gravando..." : "Salvar RCA"}
                    </Button>
                </Stack>
            }
        >
            <Box style={{ height: height - 120 }} className="bg-slate-950/40 rounded-3xl overflow-hidden border border-white/5 mt-4 relative group">
                {/* Central Horizontal Spine (Industrial Visual) */}
                <div className="absolute top-1/2 left-[50px] right-[250px] h-1.5 bg-gradient-to-r from-slate-800 via-slate-700 to-rose-500/50 -translate-y-1/2 rounded-full hidden md:block opacity-40" />

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    snapToGrid
                    snapGrid={[15, 15]}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#1e293b" gap={25} size={1} />
                    <Controls className="bg-slate-950 border-white/5 fill-white rounded-xl overflow-hidden" />
                    <MiniMap
                        nodeColor={(n) => {
                            if (n.type === 'effect') return '#f43f5e';
                            if (n.type === 'category') return '#3b82f6';
                            return '#64748b';
                        }}
                        maskColor="rgba(15, 23, 42, 0.8)"
                        className="bg-slate-950 border-white/5 rounded-2xl"
                    />
                </ReactFlow>

                {/* Legend Overlay */}
                <div className="absolute bottom-6 left-6 p-4 bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-2xl pointer-events-none">
                    <Typography className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Instruções RCA</Typography>
                    <div className="space-y-1">
                        <Typography className="text-[10px] text-slate-400">1. Selecione uma Categoria (6M)</Typography>
                        <Typography className="text-[10px] text-slate-400">2. Clique em "Add Causa" para desdobrar</Typography>
                        <Typography className="text-[10px] text-slate-400">3. Arraste para organizar hierarquia</Typography>
                    </div>
                </div>
            </Box>

            {/* Add Cause Dialog */}
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} PaperProps={{ className: "bg-slate-900 border border-white/10 rounded-3xl" }}>
                <DialogTitle className="text-white font-black uppercase tracking-tighter text-lg">Adicionar Causa Raiz</DialogTitle>
                <DialogContent>
                    <Typography className="text-slate-400 text-xs mb-4 uppercase font-bold tracking-widest">Descreva a causa identificada para esta ramificação:</Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        variant="standard"
                        value={newNodeLabel}
                        onChange={(e) => setNewNodeLabel(e.target.value)}
                        placeholder="Ex: Fadiga de material, Erro de configuração..."
                        InputProps={{ className: "text-white text-sm" }}
                    />
                </DialogContent>
                <DialogActions className="p-4 pb-6 px-6">
                    <Button onClick={() => setIsDialogOpen(false)} className="text-slate-400 text-xs font-bold uppercase tracking-widest">Cancelar</Button>
                    <Button onClick={confirmAddCause} variant="contained" className="bg-blue-600 hover:bg-blue-500 rounded-xl px-6 text-xs font-black uppercase tracking-widest">Adicionar</Button>
                </DialogActions>
            </Dialog>
        </IndustrialCard>
    );
}

import { Stack } from "@mui/material";
