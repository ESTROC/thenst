"use client";

// On-brand SVG illustrations per course, keyed by slug.
// Each fills its container; a gradient overlay (added by the card) keeps text readable.

type ArtProps = { className?: string };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      {children}
    </svg>
  );
}

const w = "#ffffff";

// LLM — chat bubbles + tokens
function LLM() {
  return (
    <Frame>
      <rect width="320" height="160" fill="#2E90FA" />
      <rect width="320" height="160" fill="url(#g)" />
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5BAEFF" stopOpacity=".6"/><stop offset="1" stopColor="#0A2540" stopOpacity=".3"/></linearGradient></defs>
      <rect x="40" y="38" width="120" height="40" rx="12" fill={w} opacity=".9"/>
      <rect x="55" y="52" width="70" height="5" rx="2.5" fill="#2E90FA"/>
      <rect x="55" y="63" width="50" height="5" rx="2.5" fill="#2E90FA" opacity=".5"/>
      <rect x="150" y="86" width="130" height="44" rx="12" fill={w} opacity=".25"/>
      <rect x="166" y="100" width="80" height="5" rx="2.5" fill={w}/>
      <rect x="166" y="112" width="60" height="5" rx="2.5" fill={w} opacity=".6"/>
      {[0,1,2].map(i=><circle key={i} cx={235+i*14} cy="50" r="4" fill={w} opacity={.9-i*.2}/>)}
    </Frame>
  );
}

// Building Agents — connected nodes / robot brain
function Agents() {
  return (
    <Frame>
      <rect width="320" height="160" fill="#7C5CFC"/>
      <g stroke={w} strokeWidth="2" opacity=".5">
        <line x1="160" y1="80" x2="90" y2="45"/><line x1="160" y1="80" x2="240" y2="45"/>
        <line x1="160" y1="80" x2="90" y2="120"/><line x1="160" y1="80" x2="240" y2="120"/>
      </g>
      <circle cx="160" cy="80" r="24" fill={w}/>
      <circle cx="160" cy="80" r="12" fill="#7C5CFC"/>
      {[[90,45],[240,45],[90,120],[240,120]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="12" fill={w} opacity=".85"/>
      ))}
    </Frame>
  );
}

// AI Infra — servers / stacks
function Infra() {
  return (
    <Frame>
      <rect width="320" height="160" fill="#10B981"/>
      {[40,74,108].map((y,i)=>(
        <g key={i}>
          <rect x="110" y={y} width="100" height="24" rx="5" fill={w} opacity={.9-i*.15}/>
          <circle cx="122" cy={y+12} r="4" fill="#10B981"/>
          <rect x="135" y={y+9} width="55" height="6" rx="3" fill="#10B981" opacity=".5"/>
        </g>
      ))}
    </Frame>
  );
}

// Dynamic Agents — flowing arrows / cycle
function Dynamic() {
  return (
    <Frame>
      <rect width="320" height="160" fill="#F5A623"/>
      <g fill="none" stroke={w} strokeWidth="6" strokeLinecap="round">
        <path d="M110 80 A50 50 0 1 1 160 130" opacity=".85"/>
      </g>
      <polygon points="150,118 172,128 152,142" fill={w}/>
      <circle cx="160" cy="80" r="14" fill={w}/>
      <circle cx="160" cy="80" r="6" fill="#F5A623"/>
    </Frame>
  );
}

// MCP — plug / connector
function MCP() {
  return (
    <Frame>
      <rect width="320" height="160" fill="#2E90FA"/>
      <rect x="80" y="68" width="70" height="24" rx="8" fill={w} opacity=".9"/>
      <rect x="170" y="68" width="70" height="24" rx="8" fill={w} opacity=".5"/>
      <rect x="148" y="74" width="24" height="12" rx="3" fill={w}/>
      <line x1="150" y1="60" x2="150" y2="68" stroke={w} strokeWidth="4"/>
      <line x1="170" y1="60" x2="170" y2="68" stroke={w} strokeWidth="4"/>
    </Frame>
  );
}

// Web Dev — browser window + code
function WebDev() {
  return (
    <Frame>
      <rect width="320" height="160" fill="#7C5CFC"/>
      <rect x="90" y="36" width="140" height="88" rx="10" fill={w} opacity=".95"/>
      <rect x="90" y="36" width="140" height="20" rx="10" fill="#7C5CFC" opacity=".3"/>
      {[0,1,2].map(i=><circle key={i} cx={102+i*12} cy="46" r="3" fill="#7C5CFC"/>)}
      <text x="108" y="86" fontFamily="monospace" fontSize="16" fill="#7C5CFC">&lt;/&gt;</text>
      <rect x="140" y="74" width="70" height="6" rx="3" fill="#7C5CFC" opacity=".4"/>
      <rect x="140" y="90" width="50" height="6" rx="3" fill="#7C5CFC" opacity=".25"/>
    </Frame>
  );
}

// Databases — cylinder stacks
function Database() {
  return (
    <Frame>
      <rect width="320" height="160" fill="#10B981"/>
      <g fill={w}>
        <ellipse cx="160" cy="48" rx="44" ry="14" opacity=".95"/>
        <rect x="116" y="48" width="88" height="60" opacity=".85"/>
        <ellipse cx="160" cy="108" rx="44" ry="14" opacity=".95"/>
      </g>
      <ellipse cx="160" cy="74" rx="44" ry="12" fill="#10B981" opacity=".4"/>
      <ellipse cx="160" cy="92" rx="44" ry="12" fill="#10B981" opacity=".4"/>
    </Frame>
  );
}

// Blockchain — linked blocks
function Blockchain() {
  return (
    <Frame>
      <rect width="320" height="160" fill="#F5A623"/>
      <g>
        {[[96,60],[160,60],[224,60]].map(([x,y],i)=>(
          <rect key={i} x={x-22} y={y} width="44" height="44" rx="8" fill={w} opacity={.9-i*.12} transform={`rotate(45 ${x} ${y+22})`}/>
        ))}
      </g>
      <line x1="118" y1="82" x2="138" y2="82" stroke={w} strokeWidth="4"/>
      <line x1="182" y1="82" x2="202" y2="82" stroke={w} strokeWidth="4"/>
    </Frame>
  );
}

const map: Record<string, () => React.ReactElement> = {
  llm: LLM,
  "building-agents": Agents,
  "ai-infra": Infra,
  "dynamic-agent": Dynamic,
  mcp: MCP,
  "web-dev": WebDev,
  database: Database,
  blockchain: Blockchain,
};

export function CourseArt({ slug }: { slug: string } & ArtProps) {
  const Art = map[slug] ?? LLM;
  return <div className="pointer-events-none absolute inset-0"><Art /></div>;
}
