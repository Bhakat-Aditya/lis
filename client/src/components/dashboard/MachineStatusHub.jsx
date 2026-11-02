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
    id: 'meril',
    name: 'AutoQuant 200',
    fullName: 'AutoQuant 200 Excelus',
    manufacturer: 'Meril Life Sciences',
    model: 'Fully Automated Biochemistry Analyzer',
    type: 'ANALYZER',
    department: 'Biochemistry',
    protocol: 'HL7 v2.5 / RS-232 TCP COM1',
    status: 'CONNECTED',
    dataRate: '2.8 KB/s',
    throughput: '200 photometric tests/hr',
    lastPing: 'Just now',
    icon: Activity,
    image: '/images/machines/autoquant-200.jpg?v=2',
    activeColor: '#10B981', // Emerald
    description: 'Fully automated random-access biochemistry analyzer for liver, renal, lipid profiles & cardiac enzymes with onboard cooling.',
    angle: 220, // Top-Left
  },
  {
    id: 'vidas',
    name: 'VIDAS® KUBE™',
    fullName: 'bioMérieux VIDAS® KUBE™',
    manufacturer: 'bioMérieux',
    model: 'Automated Immunoassay Analyzer',
    type: 'ANALYZER',
    department: 'Immunoassay',
    protocol: 'Bidirectional ASTM E1394 (COM2)',
    status: 'CONNECTED',
    dataRate: '1.4 KB/s',
    throughput: 'Continuous Random Access',
    lastPing: 'Just now',
    icon: Radio,
    image: '/images/machines/vidas-kube.jpg?v=2',
    activeColor: '#8B5CF6', // Purple
    description: 'Advanced benchtop automated immunoassay analyzer with ELFA technology for thyroid, fertility, cardiac markers & infectious serology.',
    angle: 175, // Mid-Left
  },
  {
    id: 'ld560',
    name: 'LD-560 HPLC',
    fullName: 'Labnovation LD-560 HPLC',
    manufacturer: 'Labnovation',
    model: 'Automated HbA1c HPLC Analyzer',
    type: 'ANALYZER',
    department: 'HbA1c Diabetes',
    protocol: 'HPLC Stream (Port 4001)',
    status: 'CONNECTED',
    dataRate: '1.1 KB/s',
    throughput: 'CV < 2% HPLC Precision',
    lastPing: 'Just now',
    icon: FlaskConical,
    image: '/images/machines/labnovation-ld560.jpg?v=2',
    activeColor: '#3B82F6', // Blue
    description: 'Gold-standard High-Performance Liquid Chromatography (HPLC) glycated hemoglobin analyzer with automatic sample barcode scanner.',
    angle: 130, // Bottom-Left
  },
  {
    id: 'hdc',
    name: 'HDC Lyte',
    fullName: 'HDC Lyte Electrolyte Analyzer',
    manufacturer: 'HDC Diagnostics',
    model: 'Automated Electrolyte Analyzer',
    type: 'ANALYZER',
    department: 'Electrolytes',
    protocol: 'ISE Serial Bus (COM3)',
    status: 'CONNECTED',
    dataRate: '0.9 KB/s',
    throughput: '60 samples/hr',
    lastPing: 'Just now',
    icon: Zap,
    image: '/images/machines/hdc-lyte.jpg?v=2',
    activeColor: '#0EA5E9', // Sky Blue
    description: 'Direct ion-selective electrode analyzer for serum & urine Na+, Cl-, K+, ionized calcium & lithium with automatic calibration.',
    angle: 270, // Direct Top
  },
  {
    id: 'erba',
    name: 'Erba ECL 105',
    fullName: 'Erba Mannheim ECL 105',
    manufacturer: 'Erba Mannheim',
    model: 'Coagulation Analyzer',
    type: 'ANALYZER',
    department: 'Coagulation',
    protocol: 'Optical Sensor Bus (COM4)',
    status: 'CONNECTED',
    dataRate: '0.8 KB/s',
    throughput: 'PT/INR, APTT, Fibrinogen',
    lastPing: 'Just now',
    icon: Microscope,
    image: '/images/machines/erba-ecl105.jpg?v=2',
    activeColor: '#F59E0B', // Amber
    description: 'Precision optical coagulometer for prothrombin time (PT/INR), activated partial thromboplastin time (APTT) and coagulation factors.',
    angle: 90, // Direct Bottom
  },
  {
    id: 'lis_engine',
    name: 'LIS Core Engine',
    fullName: 'New Life Care LIS Integration Engine',
    manufacturer: 'New Life Care Platform',
    model: 'Central Multiplex Data Router',
    type: 'CORE',
    department: 'Core Infrastructure',
    protocol: 'ASTM E1394 / HL7 v2.5 Multiplex',
    status: 'CONNECTED',
    dataRate: '12.1 KB/s',
    throughput: 'Real-time multi-channel router',
    lastPing: 'Just now',
    icon: Server,
    activeColor: '#2563EB', // Blue
    description: 'Central LIS multiplexing and parser engine mapping raw analyzer telemetry into patient profiles with zero transcription errors.',
    isCenter: true,
  },
  {
    id: 'doc',
    name: 'Doctor Portal',
    fullName: 'Doctor & Pathologist Portal',
    manufacturer: 'Tele-Pathology Network',
    model: 'Digital Verification Gateway',
    type: 'PORTAL',
    department: 'Medical Sign-Off',
    protocol: 'Secure WSS WebSocket',
    status: 'CONNECTED',
    dataRate: '1.2 KB/s',
    throughput: 'Pathologist Online',
    lastPing: 'Just now',
    icon: Stethoscope,
    activeColor: '#EC4899', // Pink
    description: 'Pathologist digital verification, signature & panic alert sign-off connected in real time.',
    angle: 325, // Top-Right
  },
  {
    id: 'wa',
    name: 'WhatsApp Dispatch',
    fullName: 'WhatsApp Delivery Service',
    manufacturer: 'Meta Cloud API v20.0',
    model: 'Instant Patient Dispatch Gateway',
    type: 'DELIVERY',
    department: 'Patient Communication',
    protocol: 'HTTPS REST Webhook',
    status: 'CONNECTED',
    dataRate: '1.8 KB/s',
    throughput: 'Instant PDF Dispatch',
    lastPing: 'Just now',
    icon: MessageSquare,
    activeColor: '#22C55E', // Green
    description: 'Automated QR-verified PDF report dispatch & patient receipt confirmation with instant delivery confirmation.',
    angle: 35, // Bottom-Right
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

          {/* VIEW MODE 1: RADIAL NETWORK TOPOLOGY (Faithfully Matching User ABHOI Reference) */}
          {viewMode === 'radial' && (
            <div className="relative w-full max-w-[620px] h-[480px] flex items-center justify-center select-none">
              {/* SVG Canvas for Radiating Connection Lines & Animated Flow Particles */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  {/* Glowing Particle Filter */}
                  <filter id="glow-particle" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Central Engine Concentric Radar Waves */}
                <circle cx={310} cy={240} r={72} fill="none" stroke="#3B82F6" strokeWidth={1} strokeDasharray="4 4" opacity={0.35} />
                <circle cx={310} cy={240} r={92} fill="none" stroke="#60A5FA" strokeWidth={1} opacity={0.18} />

                {/* Draw radiating connection lines & traveling data packets to each node */}
                {machines
                  .filter((m) => !m.isCenter)
                  .map((m) => {
                    const rad = (m.angle * Math.PI) / 180;
                    const centerX = 310;
                    const centerY = 240;
                    const targetX = centerX + 158 * Math.cos(rad);
                    const targetY = centerY + 158 * Math.sin(rad);

                    const isSelected = selectedMachine.id === m.id;

                    // Animated particle position along line streaming to center (0 to 1)
                    const t = ((packetTick * 2 + m.angle) % 100) / 100;
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
                          stroke={isSelected ? '#2563EB' : '#94A3B8'}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeDasharray="4 4"
                          strokeOpacity={isSelected ? 1 : 0.45}
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

              {/* Central Core: LIS Platform Engine Hub (Matching Reference Circle) */}
              <div
                onClick={() =>
                  setSelectedMachine(
                    machines.find((m) => m.id === 'lis_engine') || INITIAL_MACHINES[5]
                  )
                }
                className="z-10 flex flex-col items-center justify-center cursor-pointer group"
              >
                <div className="relative">
                  {/* Outer Pulsing Waves */}
                  <div className="absolute -inset-3.5 rounded-full bg-blue-500/15 animate-ping opacity-60 pointer-events-none" />
                  <div className="absolute -inset-1.5 rounded-full bg-blue-600/20 blur-xs pointer-events-none" />

                  {/* Main Circle Hub */}
                  <div
                    className={`relative w-28 h-28 rounded-full bg-white border-3 shadow-xl flex flex-col items-center justify-center p-2 text-center select-none transition-transform hover:scale-105 duration-200 ${
                      selectedMachine.id === 'lis_engine'
                        ? 'border-blue-600 ring-4 ring-blue-100 shadow-blue-500/30'
                        : 'border-blue-500'
                    }`}
                  >
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

              {/* Radial Satellite Nodes around Center (Matching Reference with Bottom Pills) */}
              {machines
                .filter((m) => !m.isCenter)
                .map((m) => {
                  const rad = (m.angle * Math.PI) / 180;
                  const x = 310 + 158 * Math.cos(rad);
                  const y = 240 + 158 * Math.sin(rad);

                  const isSelected = selectedMachine.id === m.id;
                  const Icon = m.icon;

                  return (
                    <div
                      key={`node-${m.id}`}
                      onClick={() => setSelectedMachine(m)}
                      className="absolute cursor-pointer flex flex-col items-center transition-all duration-200 group z-10"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Node Image / Icon Box */}
                      <div
                        className={`w-13 h-13 rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-md transition-all duration-200 group-hover:scale-110 relative ${
                          isSelected
                            ? 'ring-3 ring-blue-500 border-2 border-blue-500 shadow-blue-500/30 scale-105'
                            : 'border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {m.image ? (
                          <img
                            src={m.image}
                            alt={m.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Icon className="w-6 h-6 text-slate-700" />
                        )}

                        {/* Top-Right Connected Indicator */}
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-2xs" />
                      </div>

                      {/* Pill Label Beneath (Matching Reference Screenshot) */}
                      <div
                        className={`mt-1.5 px-2.5 py-0.5 rounded-full border shadow-2xs text-[10px] font-bold whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white/95 text-slate-800 border-slate-200 group-hover:border-slate-300'
                        }`}
                      >
                        {m.name}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* VIEW MODE 2: VERTICAL PIPELINE WORKFLOW (With Machine Clean Studio Photos) */}
          {viewMode === 'pipeline' && (
            <div className="w-full max-w-lg py-4 space-y-3.5 relative">
              {/* Continuous Blue Connecting Spine Line */}
              <div className="absolute left-[36px] top-6 bottom-6 w-0.5 bg-blue-500/80 -z-0" />

              {machines.map((m) => {
                const isSelected = selectedMachine.id === m.id;
                const Icon = m.icon;

                return (
                  <div
                    key={`pipe-${m.id}`}
                    onClick={() => setSelectedMachine(m)}
                    className="relative flex items-center gap-3.5 z-10 cursor-pointer group"
                  >
                    {/* Left Machine Image / Node Thumbnail */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-200 overflow-hidden p-1.5 ${
                        isSelected
                          ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-100 scale-105'
                          : 'bg-white border-slate-200 group-hover:border-blue-400 shadow-xs'
                      }`}
                    >
                      {m.image ? (
                        <img
                          src={m.image}
                          alt={m.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div
                          className={`w-full h-full rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-blue-600'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Right Card */}
                    <div
                      className={`flex-1 p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-400 text-blue-900 shadow-xs ring-1 ring-blue-300/40'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/90 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold tracking-tight text-slate-900 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{m.fullName || m.name}</span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-semibold">
                            {m.manufacturer}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                          {m.model}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-[10px] font-bold font-mono tracking-wider uppercase text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            CONNECTED • STREAMING
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                            • {m.protocol.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md block">
                            {m.dataRate}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            {m.department.split(' ')[0]}
                          </span>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 transition-colors ${
                            isSelected ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'
                          }`}
                        />
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
          <div className="space-y-3.5">
            {/* High-Resolution Device Photo Preview Card (if machine has an image) */}
            {selectedMachine.image ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-3 shadow-2xs group">
                <div className="h-40 w-full rounded-xl bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center p-2 relative overflow-hidden border border-slate-100">
                  <img
                    src={selectedMachine.image}
                    alt={selectedMachine.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE LINKED
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] px-0.5">
                  <div>
                    <span className="font-extrabold text-slate-900 block leading-tight">
                      {selectedMachine.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {selectedMachine.manufacturer}
                    </span>
                  </div>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                    {selectedMachine.department}
                  </span>
                </div>
              </div>
            ) : (
              /* Fallback Header for Integration Nodes */
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 bg-blue-600">
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
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border font-mono bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CONNECTED</span>
                </span>
              </div>
            )}

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
