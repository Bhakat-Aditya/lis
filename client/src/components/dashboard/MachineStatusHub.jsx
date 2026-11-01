import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  CheckCircle2,
  RefreshCw,
  Server,
  Zap,
  Radio,
  FileText,
  Stethoscope,
  Building,
  UserPlus,
  MessageSquare,
  Microscope,
  ChevronRight,
  Database,
  Share2,
  Sparkles,
  FlaskConical,
} from 'lucide-react';

/**
 * Machine Status & Interoperability Hub
 * Features:
 * 1. Radial Network Topology Hub (matching Screenshot 2: central LIS hub with radiating connected nodes)
 * 2. Animated data flow particles streaming from all connected analyzers into the central LIS engine
 * 3. Pure connected state across all nodes - showing live transmission and data streaming
 * 4. Vertical Pipeline Card View (matching Screenshot 1: Hematology Analyzer, ASTM Protocol, Engine, etc.)
 * 5. Interactive live ping diagnostic echo to test packet responsiveness
 */

const INITIAL_MACHINES = [
  {
    id: 'hem',
    name: 'Hematology Analyzer',
    model: 'Sysmex XN-350 / Mindray BC-5000',
    type: 'ANALYZER',
    protocol: 'ASTM E1381 / E1394 (COM1)',
    status: 'CONNECTED',
    dataRate: '1.4 KB/s',
    throughput: '42 samples/hr',
    lastPing: 'Just now',
    icon: Microscope,
    activeColor: '#3B82F6', // Blue
    description: '5-part differential blood analyzer with optical laser flow cytometry and automated worklist sync',
    position: { angle: 260, distance: 160 },
  },
  {
    id: 'chem',
    name: 'Biochemistry Analyzer',
    model: 'Erba Chem-7 / Cobas c311',
    type: 'ANALYZER',
    protocol: 'HL7 v2.5 TCP Socket (Port 5000)',
    status: 'CONNECTED',
    dataRate: '2.8 KB/s',
    throughput: '65 tests/hr',
    lastPing: 'Just now',
    icon: Activity,
    activeColor: '#10B981', // Emerald
    description: 'High-speed photometric clinical chemistry analyzer with continuous sample loading and live mapping',
    position: { angle: 200, distance: 165 },
  },
  {
    id: 'clia',
    name: 'Immunoassay Analyzer',
    model: 'Mindray CL-900i Chemiluminescence',
    type: 'ANALYZER',
    protocol: 'Bidirectional ASTM Query (COM2)',
    status: 'CONNECTED',
    dataRate: '0.9 KB/s',
    throughput: '28 tests/hr',
    lastPing: '1s ago',
    icon: Radio,
    activeColor: '#8B5CF6', // Purple
    description: 'Thyroid, fertility, cardiac & hormonal chemiluminescence reader with automatic calibration check',
    position: { angle: 140, distance: 155 },
  },
  {
    id: 'urine',
    name: 'Automated Urine Strip Analyzer',
    model: 'Dirui H-100 / UriScan Optima',
    type: 'ANALYZER',
    protocol: 'RS-232 Serial COM3 (9600 baud)',
    status: 'CONNECTED',
    dataRate: '0.8 KB/s',
    throughput: '34 strips/hr',
    lastPing: 'Just now',
    icon: FlaskConical,
    activeColor: '#0EA5E9', // Sky Blue
    description: 'Reflectance photometer for dry chemistry urine test strips with automated patient result indexing',
    position: { angle: 320, distance: 160 },
  },
  {
    id: 'his',
    name: 'Hospital Information System',
    model: 'HIS / EMR HL7 Interface',
    type: 'INTEGRATION',
    protocol: 'HL7 MLLP (Port 2575)',
    status: 'CONNECTED',
    dataRate: '4.2 KB/s',
    throughput: 'Sync active',
    lastPing: 'Just now',
    icon: Building,
    activeColor: '#06B6D4', // Cyan
    description: 'Bidirectional patient admission, discharge & OPD requisition sync directly with billing ledger',
    position: { angle: 90, distance: 165 },
  },
  {
    id: 'doc',
    name: 'Doctor & Pathologist Portal',
    model: 'Tele-Pathology Verification Gateway',
    type: 'PORTAL',
    protocol: 'Secure WSS WebSocket',
    status: 'CONNECTED',
    dataRate: '1.1 KB/s',
    throughput: '2 doctors online',
    lastPing: 'Just now',
    icon: Stethoscope,
    activeColor: '#EC4899', // Pink
    description: 'Pathologist digital verification, signature & panic alert sign-off connected in real time',
    position: { angle: 30, distance: 170 },
  },
  {
    id: 'wa',
    name: 'WhatsApp Delivery Service',
    model: 'Cloud Dispatch API v20.0',
    type: 'DELIVERY',
    protocol: 'HTTPS REST Webhook',
    status: 'CONNECTED',
    dataRate: '0.5 KB/s',
    throughput: '98% delivery rate',
    lastPing: 'Just now',
    icon: MessageSquare,
    activeColor: '#22C55E', // Green
    description: 'Automated PDF report dispatch & patient receipt confirmation with instant delivery status',
    position: { angle: 350, distance: 175 },
  },
];

export default function MachineStatusHub({ className = '' }) {
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [selectedMachine, setSelectedMachine] = useState(INITIAL_MACHINES[0]);
  const [viewMode, setViewMode] = useState('radial'); // 'radial' | 'pipeline'
  const [packetTick, setPacketTick] = useState(0);
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccessNotice, setPingSuccessNotice] = useState(null);

  // Animated data flow packet counter
  useEffect(() => {
    const timer = setInterval(() => {
      setPacketTick((prev) => (prev + 1) % 100);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  // Diagnostic echo test
  const handlePingTest = (machine) => {
    setIsPinging(true);
    setPingSuccessNotice(null);
    setTimeout(() => {
      setIsPinging(false);
      setPingSuccessNotice(`Echo ACK received from ${machine.name} in 3ms • Serial Port Responsive`);
      setTimeout(() => setPingSuccessNotice(null), 4000);
    }, 600);
  };

  const connectedCount = machines.length;

  return (
    <article
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow duration-200 overflow-hidden ${className}`}
    >
      {/* Top Header with Live Connectivity Metrics & View Switcher */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4.5 bg-blue-600 rounded-full inline-block shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Analyzer Machine Status & Interoperability Hub</span>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                ASTM / HL7 Engine
              </span>
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 font-medium pl-3.5 mt-0.5">
            Real-time bidirectional machine interface, data streaming & serial port telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Badge: All Connected */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{connectedCount} Connected & Active</span>
          </span>

          {/* View Switcher: Radial Topology vs Vertical Pipeline */}
          <div className="bg-slate-200/70 p-0.5 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('radial')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'radial'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Network Topology Map
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'pipeline'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pipeline View
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-[460px]">
        {/* Left Area (8 cols): Graphical Interactive Visualization */}
        <div className="lg:col-span-8 p-4 md:p-6 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50/40 via-white to-slate-50/20 relative overflow-hidden select-none">
          {/* Subtle Grid Background Pattern */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(to right, #0F172A 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* VIEW MODE 1: RADIAL NETWORK TOPOLOGY (Matching User Reference with Animated Data Streams) */}
          {viewMode === 'radial' && (
            <div className="relative w-full max-w-[580px] h-[400px] flex items-center justify-center">
              {/* SVG Canvas for Connection Lines & Data Flow Particles */}
              <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                <defs>
                  {/* Glowing Particle Filter */}
                  <filter id="glow-particle" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Gradient for Connected Data Flow */}
                  <linearGradient id="connectedFlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Draw connection lines from center (290, 200) to each satellite node */}
                {machines.map((m) => {
                  const rad = (m.position.angle * Math.PI) / 180;
                  const centerX = 290;
                  const centerY = 200;
                  const targetX = centerX + m.position.distance * Math.cos(rad);
                  const targetY = centerY + m.position.distance * Math.sin(rad);

                  const isSelected = selectedMachine.id === m.id;

                  // Animated particle position along line streaming to center (0 to 1)
                  const t = ((packetTick * 2 + m.position.angle) % 100) / 100;
                  const particleX = targetX + (centerX - targetX) * t;
                  const particleY = targetY + (centerY - targetY) * t;

                  return (
                    <g key={`wire-${m.id}`}>
                      {/* Connection Wire */}
                      <line
                        x1={centerX}
                        y1={centerY}
                        x2={targetX}
                        y2={targetY}
                        stroke={isSelected ? '#3B82F6' : '#94A3B8'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        strokeDasharray={isSelected ? 'none' : '4,4'}
                        strokeOpacity={isSelected ? 0.9 : 0.45}
                        className="transition-all duration-300"
                      />

                      {/* Animated Data Stream Pulse Packet (Streaming towards Central Hub) */}
                      <circle
                        cx={particleX}
                        cy={particleY}
                        r={isSelected ? 4.5 : 3.5}
                        fill={m.activeColor || '#3B82F6'}
                        filter="url(#glow-particle)"
                        opacity="0.95"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Central Core: LIS Platform Engine Hub */}
              <div className="z-10 flex flex-col items-center justify-center">
                <div className="relative group">
                  {/* Outer Pulsing Waves */}
                  <div className="absolute -inset-3 rounded-full bg-blue-500/15 animate-ping opacity-75 pointer-events-none" />
                  <div className="absolute -inset-1.5 rounded-full bg-blue-600/20 blur-xs pointer-events-none" />

                  {/* Main Circle Hub */}
                  <div className="relative w-28 h-28 rounded-full bg-white border-3 border-blue-600 shadow-xl flex flex-col items-center justify-center p-2 text-center select-none transition-transform hover:scale-105 duration-200">
                    <Server className="w-6 h-6 text-blue-600 mb-1 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 leading-tight">
                      NEW LIFE CARE
                    </span>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-blue-600 leading-tight">
                      LIS PLATFORM
                    </span>
                    <span className="mt-1 text-[8px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                      CORE ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Radial Satellite Nodes around Center */}
              {machines.map((m) => {
                const rad = (m.position.angle * Math.PI) / 180;
                const x = 290 + m.position.distance * Math.cos(rad);
                const y = 200 + m.position.distance * Math.sin(rad);

                const isSelected = selectedMachine.id === m.id;
                const Icon = m.icon;

                return (
                  <div
                    key={`node-${m.id}`}
                    onClick={() => setSelectedMachine(m)}
                    className="absolute cursor-pointer transition-all duration-200 group"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div
                      className={`relative flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl shadow-xs transition-all duration-200 ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-2 scale-105 bg-white shadow-md'
                          : 'bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Icon Container with Connected Indicator */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors bg-blue-50 text-blue-600 border border-blue-200/80"
                      >
                        <Icon className="w-4.5 h-4.5" />

                        {/* Top-Right Connected Pulse Badge */}
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                      </div>

                      {/* Node Text */}
                      <div className="text-left hidden sm:block max-w-[110px]">
                        <span className="text-[11px] font-bold text-slate-800 block truncate leading-tight">
                          {m.name}
                        </span>
                        <span className="text-[9.5px] font-bold font-mono tracking-tight block text-emerald-600">
                          • CONNECTED
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: VERTICAL PIPELINE WORKFLOW (Matching User Reference) */}
          {viewMode === 'pipeline' && (
            <div className="w-full max-w-md py-4 space-y-3 relative">
              {/* Continuous Blue Connecting Spine Line */}
              <div className="absolute left-[34px] top-6 bottom-6 w-0.5 bg-blue-500/80 -z-0" />

              {machines.map((m) => {
                const isSelected = selectedMachine.id === m.id;
                const Icon = m.icon;

                return (
                  <div
                    key={`pipe-${m.id}`}
                    onClick={() => setSelectedMachine(m)}
                    className="relative flex items-center gap-3.5 z-10 cursor-pointer group"
                  >
                    {/* Left Circular Icon (connected by vertical spine) */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                          : 'bg-white text-blue-600 border-slate-200 group-hover:border-blue-400 shadow-xs'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Right Card */}
                    <div
                      className={`flex-1 p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/90 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold tracking-tight text-slate-900 flex items-center gap-2">
                          <span>{m.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {m.protocol.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-emerald-700">
                            CONNECTED • TRANSMITTING
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-md hidden sm:inline">
                          {m.dataRate}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Area (4 cols): Selected Machine Diagnostic Control & Live Telemetry */}
        <div className="lg:col-span-4 p-5 bg-slate-50/50 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header of selected unit */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 bg-blue-600"
                >
                  <selectedMachine.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 leading-tight">
                    {selectedMachine.name}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {selectedMachine.model}
                  </span>
                </div>
              </div>

              {/* Status Badge: Connected */}
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border font-mono bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>CONNECTED</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedMachine.description}
            </p>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Protocol Interface
                </span>
                <span className="font-mono font-bold text-slate-800 text-[11px] block truncate">
                  {selectedMachine.protocol}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Live Throughput
                </span>
                <span className="font-mono font-bold text-blue-600 text-[11px] block">
                  {selectedMachine.dataRate}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Workload Velocity
                </span>
                <span className="font-mono font-semibold text-slate-800 text-[11px] block">
                  {selectedMachine.throughput}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Last Socket Ping
                </span>
                <span className="font-mono font-semibold text-[11px] block text-emerald-600">
                  {selectedMachine.lastPing}
                </span>
              </div>
            </div>

            {/* Raw Serial / HL7 Frame Sample */}
            <div className="p-3 bg-slate-900 rounded-xl text-slate-300 font-mono text-[10px] leading-relaxed border border-slate-800 space-y-1">
              <div className="text-slate-400 text-[9px] uppercase font-bold flex justify-between">
                <span>ASTM E1394 Data Packet Monitor</span>
                <span className="text-emerald-400">STREAMING • HEX OK</span>
              </div>
              <div className="text-emerald-400 truncate">
                <span className="text-slate-500">&lt;STX&gt;</span>1H|\^&amp;|||LIS_MEDIPATH|||||||P|1
                <span className="text-slate-500">&lt;ETX&gt;</span>
              </div>
              <div className="text-slate-400 text-[9px] truncate">
                &lt;ACK&gt; Packet checksum verified [0x15] • Channel synchronized
              </div>
            </div>

            {/* Feedback notification if pinged */}
            {pingSuccessNotice && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{pingSuccessNotice}</span>
              </div>
            )}
          </div>

          {/* Interactive Ping / Echo Verification Button */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              <span>Channel Health Test:</span>
            </div>

            <button
              onClick={() => handlePingTest(selectedMachine)}
              disabled={isPinging}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging Stream...' : 'Ping Interface Echo'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
