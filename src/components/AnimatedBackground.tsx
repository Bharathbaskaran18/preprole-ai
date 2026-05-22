import React from 'react';

const P: Record<string, string> = {
  briefcase: 'M3,8 L3,18 Q3,20 5,20 L19,20 Q21,20 21,18 L21,8 Q21,6 19,6 L15,6 L15,4 Q15,2 13,2 L11,2 Q9,2 9,4 L9,6 L5,6 Q3,6 3,8 Z M9,6 L15,6 M3,12 L21,12',
  gradcap:   'M12,3 L22,8.5 L12,14 L2,8.5 Z M19.5,10.5 L19.5,17 Q16,21 12,21 Q8,21 4.5,17 L4.5,10.5',
  bulb:      'M9,21 L15,21 M9.5,18 L14.5,18 M12,2 Q8,2 5.5,5.5 Q3,9 5,12.5 Q6.5,15 8,16 L16,16 Q17.5,15 19,12.5 Q21,9 18.5,5.5 Q16,2 12,2 Z',
  chart:     'M3,20 L21,20 M4,20 L4,12 L8,12 L8,20 M10,20 L10,7 L14,7 L14,20 M16,20 L16,15 L20,15 L20,20',
  trophy:    'M8,2 L16,2 Q16,10 12,12 Q8,10 8,2 Z M8,2 L4,2 Q4,7 8,9.5 M16,2 L20,2 Q20,7 16,9.5 M10,21 L14,21 M12,17 L12,21 M8,21 L16,21',
  star:      'M12,2 L14.5,9.3 L22,9.3 L16,13.6 L18.5,21 L12,16.5 L5.5,21 L8,13.6 L2,9.3 L9.5,9.3 Z',
};

interface Node { id: number; x: number; y: number; type: string; color: string; anim: string; dur: string; delay: string; }

const NODES: Node[] = [
  { id: 0, x: 120,  y: 150, type: 'briefcase', color: '#6366f1', anim: 'bg-fa', dur: '7s',   delay: '0s'  },
  { id: 1, x: 380,  y: 80,  type: 'gradcap',   color: '#6366f1', anim: 'bg-fb', dur: '9s',   delay: '-2s' },
  { id: 2, x: 700,  y: 200, type: 'bulb',       color: '#6366f1', anim: 'bg-fc', dur: '8s',   delay: '-4s' },
  { id: 3, x: 1050, y: 120, type: 'chart',      color: '#6366f1', anim: 'bg-fd', dur: '10s',  delay: '-1s' },
  { id: 4, x: 1320, y: 170, type: 'trophy',     color: '#6366f1', anim: 'bg-fe', dur: '7.5s', delay: '-3s' },
  { id: 5, x: 200,  y: 650, type: 'star',       color: '#6366f1', anim: 'bg-fb', dur: '9.5s', delay: '-5s' },
  { id: 6, x: 550,  y: 720, type: 'briefcase',  color: '#6366f1', anim: 'bg-fa', dur: '8.5s', delay: '-2s' },
  { id: 7, x: 850,  y: 680, type: 'bulb',       color: '#6366f1', anim: 'bg-fc', dur: '7s',   delay: '-6s' },
  { id: 8, x: 1150, y: 750, type: 'chart',      color: '#6366f1', anim: 'bg-fd', dur: '9s',   delay: '-3s' },
  { id: 9, x: 1380, y: 600, type: 'star',       color: '#6366f1', anim: 'bg-fe', dur: '8s',   delay: '-1s' },
];

const WAVES = [
  { y: 232, dasharray: '8 38',  anim: 'bg-wf0', dur: '18s', color: 'rgba(99,102,241,0.4)'  },
  { y: 472, dasharray: '6 32',  anim: 'bg-wf1', dur: '22s', color: 'rgba(99,102,241,0.38)' },
  { y: 718, dasharray: '10 42', anim: 'bg-wf2', dur: '26s', color: 'rgba(99,102,241,0.35)' },
];

const AnimatedBackground: React.FC = () => (
  <div className="animated-bg">
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      {WAVES.map((w, i) => (
        <path
          key={i}
          d={`M -20,${w.y} Q 180,${w.y - 80} 360,${w.y} T 720,${w.y} T 1080,${w.y} T 1440,${w.y} T 1800,${w.y}`}
          fill="none"
          stroke={w.color}
          strokeWidth="2.5"
          strokeDasharray={w.dasharray}
          style={{ animation: `${w.anim} ${w.dur} linear infinite` }}
        />
      ))}

      {NODES.map((node) => (
        <g
          key={node.id}
          transform={`translate(${node.x}, ${node.y}) scale(1.8) translate(-12, -12)`}
          className={`bg-float ${node.anim}`}
          style={{ animationDuration: node.dur, animationDelay: node.delay }}
        >
          <path
            d={P[node.type]}
            stroke={node.color}
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.18"
          />
        </g>
      ))}
    </svg>
  </div>
);

export default AnimatedBackground;
