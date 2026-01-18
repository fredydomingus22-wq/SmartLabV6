"use client";

import React, { useMemo, useCallback, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Save, Info } from "lucide-react";

// --- Custom Node Types ---

const EffectNode = ({ data }: NodeProps) => (
    <div className="px-5 py-4 bg-rose-500/10 border-2 border-rose-500 rounded-xl text-center min-w-[200px] shadow-[0_0_30px_rgba(244,63,94,0.1)] relative">
        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Efeito / Problema</p>
        <p className="text-sm font-black text-rose-50">{data.label}</p>
        <Handle type="target" position={Position.Left} className="w-4 h-4 !bg-rose-500 !border-none translate-x-1" />
    </div>
);

const CategoryNode = ({ data }: NodeProps) => (
    <div className="px-4 py-2 bg-slate-950 border-2 border-blue-500/50 rounded-lg text-center min-w-[140px] hover:border-blue-500 transition-all shadow-lg group">
        <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest group-hover:text-white transition-colors">
            {data.label}
        </p>
        <Handle type="source" position={data.spinePosition === "top" ? Position.Bottom : Position.Top} className="!bg-blue-500 !border-none" />
    </div>
);

const CauseNode = ({ data }: NodeProps) => (
    <div className="px-3 py-1.5 bg-slate-800/80 border border-white/10 rounded-md text-left min-w-[120px] hover:border-white/30 transition-all shadow-md group relative">
        <p className="text-[11px] text-slate-200 font-medium group-hover:text-white">
            {data.label}
        </p>
        <Handle type="target" position={Position.Left} className="!bg-slate-600 !border-none w-2 h-2" />
        <Handle type="source" position={Position.Right} className="!bg-slate-600 !border-none w-2 h-2" />
    </div>
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

export function SPCIshikawaChart({ effect, description, height = 600, initialCategories, onSave, isSaving }: IshikawaChartProps) {
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
        <Card className="flex flex-col h-full bg-slate-950/50 border-white/10 backdrop-blur-md overflow-hidden relative">
            {/* Header / Toolbar */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center z-10 bg-slate-950/80">
                <div>
                    <h3 className="text-sm font-bold text-slate-200">Ishikawa (Fishbone)</h3>
                    <p className="text-xs text-slate-500">{description || "Análise de Causa Raiz"}</p>
                </div>
                <div className="flex gap-2">
                    {selectedNodeId && (
                        <>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleAddCause}>
                                <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={handleDeleteNode}>
                                <Trash2 className="h-3 w-3 mr-1" /> Del
                            </Button>
                        </>
                    )}
                    <Button
                        size="sm"
                        variant="default"
                        className="h-8 bg-emerald-600 hover:bg-emerald-500"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="h-3 w-3 mr-1" /> {isSaving ? "..." : "Salvar"}
                    </Button>
                </div>
            </div>

            <div className="flex-1 relative bg-slate-950/40">
                {/* Central Horizontal Spine Visual */}
                <div className="absolute top-1/2 left-[50px] right-[250px] h-1.5 bg-gradient-to-r from-slate-800 via-slate-700 to-rose-500/50 -translate-y-1/2 rounded-full hidden md:block opacity-40 pointer-events-none" />

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
                    className="bg-transparent"
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
                        className="!bg-slate-950 !border-white/5 rounded-2xl"
                    />
                </ReactFlow>

                <div className="absolute bottom-6 left-6 p-4 bg-slate-900/90 backdrop-blur-md border border-white/5 rounded-xl pointer-events-none max-w-xs">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Info className="h-3 w-3" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Instruções</p>
                    </div>
                    <ul className="space-y-1 text-[10px] text-slate-400 list-disc pl-3">
                        <li>Selecione uma categoria (azul) para adicionar causas.</li>
                        <li>Arraste os nós para organizar.</li>
                        <li>Conecte causas secundárias arrastando as bordas.</li>
                    </ul>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adicionar Causa</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            autoFocus
                            value={newNodeLabel}
                            onChange={(e) => setNewNodeLabel(e.target.value)}
                            placeholder="Descreva a causa..."
                            onKeyDown={(e) => e.key === 'Enter' && confirmAddCause()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={confirmAddCause}>Adicionar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
