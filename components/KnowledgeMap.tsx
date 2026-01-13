
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ConceptNode, ConceptLink, MasteryLevel } from '../types';

interface KnowledgeMapProps {
  nodes: ConceptNode[];
  links: ConceptLink[];
}

const KnowledgeMap: React.FC<KnowledgeMapProps> = ({ nodes, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0 || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    // 1. Identify Roots (Nodes with no incoming links)
    const targets = new Set(links.map(l => l.target));
    const roots = nodes.filter(n => !targets.has(n.id));

    // 2. Build Hierarchy Data
    const adjacency: Record<string, string[]> = {};
    links.forEach(l => {
        if (!adjacency[l.source]) adjacency[l.source] = [];
        adjacency[l.source].push(l.target);
    });

    const buildHierarchy = (id: string, visited: Set<string>): any => {
        const node = nodes.find(n => n.id === id);
        // Fallback for virtual root children that might be real nodes
        if (!node && id !== 'virtual_root') return null; 

        visited.add(id);
        const childrenIds = adjacency[id] || [];
        const children = childrenIds
            .filter(childId => !visited.has(childId))
            .map(childId => buildHierarchy(childId, new Set(visited)))
            .filter(Boolean); // Remove nulls

        return {
            name: node ? node.name : "知识根节点",
            mastery: node ? node.mastery : MasteryLevel.Expert,
            description: node ? node.description : "",
            isVirtual: !node,
            children: children.length > 0 ? children : undefined
        };
    };

    let hierarchyData;
    
    // If multiple roots exist, create a Virtual Root to hold them
    if (roots.length > 1 || (roots.length === 0 && nodes.length > 0)) {
        // If no explicit roots found (cycles?), just pick the first one.
        // If multiple roots, group them.
        const rootNodes = roots.length > 0 ? roots : [nodes[0]];
        
        // Manually populate adjacency for virtual root
        adjacency['virtual_root'] = rootNodes.map(n => n.id);
        
        hierarchyData = buildHierarchy('virtual_root', new Set());
    } else {
        hierarchyData = buildHierarchy(roots[0].id, new Set());
    }

    if (!hierarchyData) return;

    const root = d3.hierarchy(hierarchyData);

    // Tree layout
    const treeLayout = d3.tree()
        .nodeSize([60, 220]) // [height, width] of node space
        .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.5));
    
    treeLayout(root);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${height/2})`);

    // Links (Curved lines)
    g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 2)
        .attr("d", d3.linkHorizontal()
            .x((d: any) => d.y)
            .y((d: any) => d.x) as any
        );

    // Nodes
    const node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    // Use ForeignObject to render HTML Divs
    node.append("foreignObject")
        .attr("width", 180)
        .attr("height", 46)
        .attr("x", -10)
        .attr("y", -23)
        .html((d: any) => {
             if (d.data.isVirtual) {
                 return `
                    <div class="w-full h-full flex items-center justify-center">
                        <div class="w-3 h-3 bg-slate-300 rounded-full"></div>
                    </div>
                 `;
             }

             let colorClass = "bg-white border-slate-200 text-slate-700";
             if (d.data.mastery === MasteryLevel.Expert) colorClass = "bg-emerald-50 border-emerald-200 text-emerald-800";
             if (d.data.mastery === MasteryLevel.Competent) colorClass = "bg-blue-50 border-blue-200 text-blue-800";
             if (d.data.mastery === MasteryLevel.Novice) colorClass = "bg-amber-50 border-amber-200 text-amber-800";

             return `
                <div class="w-full h-full flex items-center px-3 py-1 rounded-lg border shadow-sm ${colorClass} overflow-hidden transition-all hover:scale-105" title="${d.data.description || ''}">
                    <div class="font-medium text-sm truncate w-full">${d.data.name}</div>
                </div>
             `;
        });

    // Zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 2])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom as any);
    
    // Center the tree initially based on root position
    // If virtual root, we might want to shift left a bit so real nodes are visible
    const initialTransform = d3.zoomIdentity.translate(80, height/2);
    svg.call(zoom.transform as any, initialTransform);

  }, [nodes, links, dimensions]);

  if (nodes.length === 0) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200">
        <p>暂无逻辑结构</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 rounded-lg overflow-hidden border border-slate-100 shadow-inner cursor-grab active:cursor-grabbing">
      <svg ref={svgRef} width="100%" height="100%" className="touch-none" />
    </div>
  );
};

export default KnowledgeMap;
