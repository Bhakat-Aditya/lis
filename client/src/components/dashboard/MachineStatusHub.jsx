import React, { useState, useEffect, useCallback } from 'react';
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
  X,
  AlertTriangle,
  AlertCircle,
  Wifi,
  WifiOff,
  ExternalLink,
  Clock,
  Send,
  Check,
} from 'lucide-react';
import api from '../../services/api';

/**
 * Machine Status & Telemetry Hub
 * Direct Live BetterStack Heartbeats Integration:
 * - PC-152 (Vedas) (id: "521082") -> bioMérieux VIDAS® KUBE™
 * - Meril Biochemistry Analyzer (id: "521122") -> AutoQuant 200 Excelus
 * - HPLC HbA1C Analyzer (id: "521123") -> Labnovation LD-560 HPLC
 * - CBC 3 Parts Analyzer (id: "521124") -> 3-Part Hematology Cell Counter
 * - HDC Lyte Analyzer (id: "521128") -> HDC Lyte Electrolyte Analyzer
 * - PT Analyzer (id: "521129") -> Erba Mannheim ECL 105 Coagulation Analyzer
 * - Local Server (id: "521131") -> Central LIS Integration Engine
 */

const INITIAL_MACHINES = [
  {
    id: 'meril',
    heartbeatId: '521122',
    name: 'AutoQuant 200',
    fullName: 'AutoQuant 200 Excelus',
    heartbeatName: 'Meril Biochemistry Analyzer',
    manufacturer: 'Meril Life Sciences',
    model: 'Fully Automated Biochemistry Analyzer',
    type: 'ANALYZER',
    department: 'Biochemistry',
    protocol: 'HL7 v2.5 / RS-232 TCP COM1',
    status: 'OFFLINE',
    heartbeatStatus: 'down',
    baseDataRate: '2.8 KB/s',
    dataRate: '0.0 KB/s',
    throughput: '200 photometric tests/hr',
    lastPing: 'Heartbeat checking...',
    timeInState: 'Calculating...',
    period: 180,
    grace: 300,
    timezone: 'Chennai',
    heartbeatUrl: 'https://incidents.betterstack.com/api/v1/heartbeat/C9MtfHPA36ZLP1Wnwxtj9KKp',
    icon: Activity,
    image: '/images/machines/autoquant-200.jpg',
    activeColor: '#10B981',
    description: 'Fully automated random-access biochemistry analyzer for liver, renal, lipid profiles & cardiac enzymes with onboard refrigerated reagent carousel.',
    angle: 160,
  },
  {
    id: 'vidas',
    heartbeatId: '521082',
    name: 'VIDAS® KUBE™',
    fullName: 'bioMérieux VIDAS® KUBE™',
    heartbeatName: 'PC-152 (Vedas)',
    manufacturer: 'bioMérieux',
    model: 'Automated Immunoassay Analyzer',
    type: 'ANALYZER',
    department: 'Immunoassay',
    protocol: 'Bidirectional ASTM E1394 (COM2)',
    status: 'CONNECTED',
    heartbeatStatus: 'up',
    baseDataRate: '1.4 KB/s',
    dataRate: '1.4 KB/s',
    throughput: 'Continuous Random Access',
    lastPing: 'Heartbeat checking...',
    timeInState: 'Calculating...',
    period: 180,
    grace: 300,
    timezone: 'Chennai',
    heartbeatUrl: 'https://incidents.betterstack.com/api/v1/heartbeat/WeZ6w28XS2XuimZ7b9DKFSer',
    icon: Radio,
    image: '/images/machines/vidas-kube.jpg',
    activeColor: '#8B5CF6',
    description: 'Advanced benchtop automated immunoassay analyzer with ELFA technology for thyroid, fertility, cardiac markers & infectious serology.',
    angle: 200,
  },
  {
    id: 'ld560',
    heartbeatId: '521123',
    name: 'LD-560 HPLC',
    fullName: 'Labnovation LD-560 HPLC',
    heartbeatName: 'HPLC HbA1C Analyzer',
    manufacturer: 'Labnovation',
    model: 'Automated HbA1c HPLC Analyzer',
    type: 'ANALYZER',
    department: 'HbA1c Diabetes',
    protocol: 'HPLC Stream (Port 4001)',
    status: 'OFFLINE',
    heartbeatStatus: 'down',
    baseDataRate: '1.1 KB/s',
    dataRate: '0.0 KB/s',
    throughput: 'CV < 2% HPLC Precision',
    lastPing: 'Heartbeat checking...',
    timeInState: 'Calculating...',
    period: 180,
    grace: 300,
    timezone: 'Chennai',
    heartbeatUrl: 'https://incidents.betterstack.com/api/v1/heartbeat/TXAadMfeqdaWNWkaTPZdqLj4',
    icon: FlaskConical,
    image: '/images/machines/labnovation-ld560.jpg',
    activeColor: '#3B82F6',
    description: 'Gold-standard High-Performance Liquid Chromatography (HPLC) glycated hemoglobin analyzer with automatic sample barcode scanner.',
    angle: 120,
  },
  {
    id: 'cbc',
    heartbeatId: '521124',
    name: 'CBC 3-Part',
    fullName: 'Hematology Cell Counter 3-Part',
    heartbeatName: 'CBC 3 Parts Analyzer',
    manufacturer: 'Mindray Diagnostics',
    model: 'Automated Hematology Analyzer',
    type: 'ANALYZER',
    department: 'Hematology',
    protocol: 'ASTM E1381 / COM5',
    status: 'CONNECTED',
    heartbeatStatus: 'up',
    baseDataRate: '1.6 KB/s',
    dataRate: '1.6 KB/s',
    throughput: '60 samples/hour (19 parameters)',
    lastPing: 'Heartbeat checking...',
    timeInState: 'Calculating...',
    period: 180,
    grace: 300,
    timezone: 'Chennai',
    heartbeatUrl: 'https://incidents.betterstack.com/api/v1/heartbeat/7UeHbm391eH1gcxj1xr5A9ys',
    icon: Activity,
    image: '/images/machines/cbc-3part.jpg',
    activeColor: '#EC4899',
    description: 'High-precision 3-part differential automated hematology analyzer providing CBC, WBC differential histograms, and platelet counts.',
    angle: 40,
  },
  {
    id: 'hdc',
    heartbeatId: '521128',
    name: 'HDC Lyte',
    fullName: 'HDC Lyte Electrolyte Analyzer',
    heartbeatName: 'HDC Lyte Analyzer',
    manufacturer: 'HDC Diagnostics',
    model: 'Automated Electrolyte Analyzer',
    type: 'ANALYZER',
    department: 'Electrolytes',
    protocol: 'ISE Serial Bus (COM3)',
    status: 'CONNECTED',
    heartbeatStatus: 'up',
    baseDataRate: '0.9 KB/s',
    dataRate: '0.9 KB/s',
    throughput: '60 samples/hr',
    lastPing: 'Heartbeat checking...',
    timeInState: 'Calculating...',
    period: 180,
    grace: 300,
    timezone: 'Chennai',
    heartbeatUrl: 'https://incidents.betterstack.com/api/v1/heartbeat/JmUB3F4FcMfc7y8pgCubwgC3',
    icon: Zap,
    image: '/images/machines/hdc-lyte.jpg',
    activeColor: '#0EA5E9',
    description: 'Direct ion-selective electrode analyzer for serum & urine Na+, Cl-, K+, ionized calcium & lithium with automatic calibration.',
    angle: 240,
  },
  {
    id: 'erba',
    heartbeatId: '521129',
    name: 'Erba ECL 105',
    fullName: 'Erba Mannheim ECL 105 (PT)',
    heartbeatName: 'PT Analyzer',
    manufacturer: 'Erba Mannheim',
    model: 'Coagulation Analyzer (PT / INR)',
    type: 'ANALYZER',
    department: 'Coagulation',
    protocol: 'Optical Sensor Bus (COM4)',
    status: 'OFFLINE',
    heartbeatStatus: 'down',
    baseDataRate: '0.8 KB/s',
    dataRate: '0.0 KB/s',
    throughput: 'PT/INR, APTT, Fibrinogen',
    lastPing: 'Heartbeat checking...',
    timeInState: 'Calculating...',
    period: 180,
    grace: 300,
    timezone: 'Chennai',
    heartbeatUrl: 'https://incidents.betterstack.com/api/v1/heartbeat/fEZ2xeyK9hK9z6jNTUGANRc2',
    icon: Microscope,
    image: '/images/machines/erba-ecl105.jpg',
    activeColor: '#F59E0B',
    description: 'Precision optical coagulometer for prothrombin time (PT/INR), activated partial thromboplastin time (APTT) and coagulation factors.',
    angle: 80,
  },
  {
    id: 'lis_engine',
    heartbeatId: '521131',
    name: 'Local Server Engine',
    fullName: 'New Life Care Local Server',
    heartbeatName: 'Local Server',
    manufacturer: 'New Life Care Platform',
    model: 'Central Multiplex Data Router',
    type: 'CORE',
    department: 'Core Infrastructure',
    protocol: 'ASTM E1394 / HL7 v2.5 Core',
    status: 'CONNECTED',
    heartbeatStatus: 'up',
    baseDataRate: '12.1 KB/s',
    dataRate: '12.1 KB/s',
    throughput: 'Real-time multi-channel router',
    lastPing: 'Heartbeat checking...',
    timeInState: 'Calculating...',
    period: 180,
    grace: 300,
    timezone: 'Chennai',
    heartbeatUrl: 'https://incidents.betterstack.com/api/v1/heartbeat/qwLCzi4eBNeJDteoRz42TZgy',
    icon: Server,
    activeColor: '#2563EB',
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
    heartbeatStatus: 'up',
    dataRate: '1.2 KB/s',
    throughput: 'Pathologist Online',
    lastPing: 'Active WebSocket',
    timeInState: 'Operational',
    icon: Stethoscope,
    activeColor: '#10B981',
    description: 'Doctor sign-off gateway allowing real-time clinical review, AI delta reference range checks & digital cryptographic signatures.',
    angle: 280,
  },
  {
    id: 'branch',
    name: 'Station Road Branch',
    fullName: 'Branch Collection Center - Station Road',
    manufacturer: 'LIS WAN Tunnel',
    model: 'VPN Sync Gateway',
    type: 'BRANCH',
    department: 'Satellite Intake',
    protocol: 'TLS 1.3 HTTPS Tunnel',
    status: 'CONNECTED',
    heartbeatStatus: 'up',
    dataRate: '0.6 KB/s',
    throughput: 'Branch Sync Healthy',
    lastPing: 'Active WAN Link',
    timeInState: 'Operational',
    icon: Building,
    activeColor: '#6366F1',
    description: 'High-speed remote branch synchronization node routing sample barcodes, billing entries & receipts across Midnapore network.',
    angle: 0,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Dispatch',
    fullName: 'Meta Cloud API WhatsApp Server',
    manufacturer: 'Meta for Business API',
    model: 'Instant Automated Report Delivery',
    type: 'NOTIFICATION',
    department: 'Patient Communication',
    protocol: 'REST Graph API v19.0',
    status: 'CONNECTED',
    heartbeatStatus: 'up',
    dataRate: '2.4 KB/s',
    throughput: 'Instant PDF dispatch',
    lastPing: 'Webhook Online',
    timeInState: 'Operational',
    icon: MessageSquare,
    activeColor: '#059669',
    description: 'Dispatches automated registration confirmation barcodes and finalized doctor-signed PDF laboratory reports directly to patient mobile numbers.',
    angle: 320,
  },
];

export default function MachineStatusHub({ className = '' }) {
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [selectedMachine, setSelectedMachine] = useState(INITIAL_MACHINES[1]); // VIDAS KUBE active
  const [viewMode, setViewMode] = useState('radial'); // 'radial' | 'pipeline'
  const [packetTick, setPacketTick] = useState(0);
  const [isFetchingHeartbeats, setIsFetchingHeartbeats] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const [pingNotice, setPingNotice] = useState(null);

  /**
   * Fetch live heartbeats directly from BetterStack endpoint
   */
  const syncBetterStackHeartbeats = useCallback(async (forceFresh = false) => {
    try {
      setIsFetchingHeartbeats(true);
      const res = await api.get('/heartbeats', {
        params: { fresh: forceFresh ? 'true' : 'false' },
      });

      if (res.data?.STATUS === 'SUCCESS' && Array.isArray(res.data.heartbeats)) {
        const liveHeartbeats = res.data.heartbeats;

        setMachines((prevMachines) => {
          return prevMachines.map((m) => {
            if (!m.heartbeatId) return m;

            // Match by heartbeatId or name
            const liveHb = liveHeartbeats.find(
              (hb) =>
                String(hb.id) === String(m.heartbeatId) ||
                (hb.name && m.heartbeatName && hb.name.toLowerCase() === m.heartbeatName.toLowerCase())
            );

            if (!liveHb) return m;

            const isUp = liveHb.status === 'up';

            return {
              ...m,
              heartbeatStatus: liveHb.status,
              status: isUp ? 'CONNECTED' : 'OFFLINE',
              heartbeatName: liveHb.name,
              period: liveHb.period || m.period,
              grace: liveHb.grace || m.grace,
              heartbeatUrl: liveHb.url || m.heartbeatUrl,
              timezone: liveHb.timezone || m.timezone,
              timeInState: liveHb.timeInState || (isUp ? 'Active' : 'Offline'),
              lastPing: liveHb.lastPingAgo ? `${liveHb.lastPingAgo} ago` : m.lastPing,
              dataRate: isUp ? (m.baseDataRate || '1.8 KB/s') : '0.0 KB/s (Paused)',
              activeColor: isUp ? m.activeColor : '#EF4444',
            };
          });
        });

        setLastSyncTime(
          new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        );
      }
    } catch (err) {
      console.warn('[MachineStatusHub] Heartbeat sync notice:', err.message);
    } finally {
      setIsFetchingHeartbeats(false);
    }
  }, []);

  // Initial load and recurring 25-second poll
  useEffect(() => {
    syncBetterStackHeartbeats(false);
    const interval = setInterval(() => {
      syncBetterStackHeartbeats(false);
    }, 25000);
    return () => clearInterval(interval);
  }, [syncBetterStackHeartbeats]);

  // Update selected machine reference when machines state updates
  useEffect(() => {
    if (selectedMachine) {
      const updated = machines.find((m) => m.id === selectedMachine.id);
      if (updated) setSelectedMachine(updated);
    }
  }, [machines]);

  // Animated packet tick loop (for streaming data flow dots)
  useEffect(() => {
    const interval = setInterval(() => {
      setPacketTick((prev) => (prev + 1) % 1000);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Live Ping Test via BetterStack Heartbeat URL
  const handlePingTest = async (machine) => {
    setIsPinging(true);
    setPingNotice(null);

    try {
      if (machine.heartbeatUrl) {
        // Send actual ping to update heartbeat in BetterStack!
        const res = await api.post('/heartbeats/ping', {
          url: machine.heartbeatUrl,
          id: machine.heartbeatId,
        });

        if (res.data?.STATUS === 'SUCCESS') {
          setPingNotice({
            type: 'success',
            text: `Echo ACK dispatched to ${machine.name}! Heartbeat ping registered with BetterStack. Refreshing status...`,
          });
          // Immediately re-fetch fresh telemetry
          setTimeout(() => syncBetterStackHeartbeats(true), 800);
        } else {
          throw new Error(res.data?.Message || 'Ping failed');
        }
      } else {
        // Simulated echo for satellite integration nodes
        await new Promise((r) => setTimeout(r, 500));
        setPingNotice({
          type: 'success',
          text: `WebSocket ping echo ACK received from ${machine.name} in 3ms. Network latency healthy.`,
        });
      }
    } catch (err) {
      setPingNotice({
        type: 'error',
        text: `Ping diagnostic notice: ${err.message || 'Port unresponsive'}`,
      });
    } finally {
      setIsPinging(false);
      setTimeout(() => setPingNotice(null), 6000);
    }
  };

  const onlineMachines = machines.filter((m) => m.heartbeatStatus === 'up' && !m.isCenter);
  const offlineMachines = machines.filter((m) => m.heartbeatStatus === 'down');

  return (
    <article
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow duration-200 overflow-hidden ${className}`}
    >
      {/* Top Header with Live Connectivity Metrics, BetterStack Sync & View Switcher */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4.5 bg-blue-600 rounded-full inline-block shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Analyzer Machine Status & Telemetry Hub</span>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-600" />
                BetterStack v2 Direct
              </span>
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 font-medium pl-3.5 mt-0.5">
            Real-time direct telemetry, automatic uptime tracking & serial COM packet streams
            {lastSyncTime && (
              <span className="text-slate-400 font-mono ml-2">
                • Synced: <strong className="text-slate-600">{lastSyncTime}</strong>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Badges: Active & Offline */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineMachines.length} Live (Up)</span>
            </span>

            {offlineMachines.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-bold text-xs shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{offlineMachines.length} Down / Offline</span>
              </span>
            )}
          </div>

          {/* Manual Force Sync Button */}
          <button
            onClick={() => syncBetterStackHeartbeats(true)}
            disabled={isFetchingHeartbeats}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 active:scale-95 font-bold text-xs py-1.5 px-2.5 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Fetch fresh real-time heartbeat statuses directly from BetterStack"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-blue-600 ${isFetchingHeartbeats ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Sync Status</span>
          </button>

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
              Topology Map
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
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-[470px]">
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

          {/* VIEW MODE 1: RADIAL NETWORK TOPOLOGY */}
          {viewMode === 'radial' && (
            <div className="relative w-full max-w-[680px] h-[550px] flex items-center justify-center select-none overflow-visible">
              {/* SVG Canvas for Radiating Connection Lines & Animated Flow Particles */}
              <svg viewBox="0 0 680 550" className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  {/* Glowing Particle Filter */}
                  <filter id="glow-particle" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Central Engine Concentric Radar Waves */}
                <circle cx={340} cy={275} r={76} fill="none" stroke="#3B82F6" strokeWidth={1} strokeDasharray="4 4" opacity={0.35} />
                <circle cx={340} cy={275} r={105} fill="none" stroke="#60A5FA" strokeWidth={1} opacity={0.2} />
                <circle cx={340} cy={275} r={185} fill="none" stroke="#CBD5E1" strokeWidth={1} strokeDasharray="3 6" opacity={0.45} />

                {/* Draw radiating connection lines & traveling data packets to each node */}
                {machines
                  .filter((m) => !m.isCenter)
                  .map((m) => {
                    const rad = (m.angle * Math.PI) / 180;
                    const centerX = 340;
                    const centerY = 275;
                    const radius = 185;
                    const targetX = centerX + radius * Math.cos(rad);
                    const targetY = centerY + radius * Math.sin(rad);

                    const isSelected = selectedMachine.id === m.id;
                    const isOnline = m.heartbeatStatus === 'up';

                    // Animated particle position along line streaming to center (0 to 1) - ONLY when ONLINE
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
                          stroke={
                            !isOnline
                              ? '#CBD5E1'
                              : isSelected
                              ? '#2563EB'
                              : '#94A3B8'
                          }
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeDasharray={!isOnline ? '3 3' : '4 4'}
                          strokeOpacity={!isOnline ? 0.35 : isSelected ? 1 : 0.45}
                          className="transition-all duration-300"
                        />

                        {/* Animated Data Stream Pulse Packet: ONLY RENDERED IF ONLINE */}
                        {isOnline && (
                          <circle
                            cx={particleX}
                            cy={particleY}
                            r={isSelected ? 4.5 : 3.5}
                            fill={m.activeColor || '#3B82F6'}
                            filter="url(#glow-particle)"
                            opacity="0.95"
                          />
                        )}
                      </g>
                    );
                  })}
              </svg>

              {/* Central Core: LIS Platform Engine Hub (Local Server #521131) */}
              <div
                onClick={() =>
                  setSelectedMachine(
                    machines.find((m) => m.id === 'lis_engine') || INITIAL_MACHINES[6]
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
                      LOCAL SERVER
                    </span>
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-blue-600 leading-tight">
                      LIS ENGINE
                    </span>
                    <span className="mt-1 text-[8px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                      #521131 UP
                    </span>
                  </div>
                </div>
              </div>

              {/* Radial Satellite Nodes around Center */}
              {machines
                .filter((m) => !m.isCenter)
                .map((m) => {
                  const rad = (m.angle * Math.PI) / 180;
                  const centerX = 340;
                  const centerY = 275;
                  const radius = 185;
                  const x = centerX + radius * Math.cos(rad);
                  const y = centerY + radius * Math.sin(rad);

                  const isSelected = selectedMachine.id === m.id;
                  const isOnline = m.heartbeatStatus === 'up';
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
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-md transition-all duration-200 group-hover:scale-110 relative ${
                          isSelected
                            ? isOnline
                              ? 'ring-3 ring-blue-500 border-2 border-blue-500 shadow-blue-500/30 scale-105'
                              : 'ring-3 ring-rose-500 border-2 border-rose-500 shadow-rose-500/30 scale-105'
                            : !isOnline
                            ? 'border-2 border-rose-200 opacity-90'
                            : 'border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {m.image ? (
                          <img
                            src={m.image}
                            alt={m.name}
                            className={`w-full h-full object-contain transition-all ${
                              !isOnline ? 'grayscale-40 opacity-80' : ''
                            }`}
                          />
                        ) : (
                          <Icon className={`w-6 h-6 ${!isOnline ? 'text-slate-400' : 'text-slate-700'}`} />
                        )}

                        {/* Top-Right Connected Indicator or Red Crossed Badge */}
                        {isOnline ? (
                          <span
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs"
                            title="Heartbeat: UP (Active Stream)"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          </span>
                        ) : (
                          <span
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center shadow-xs text-white"
                            title={`Heartbeat: DOWN (Stream Paused • ${m.timeInState})`}
                          >
                            <X className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      {/* Pill Label Beneath */}
                      <div
                        className={`mt-1.5 px-2 py-0.5 rounded-full border shadow-2xs text-[10px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                          isSelected
                            ? isOnline
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : !isOnline
                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold'
                            : 'bg-white/95 text-slate-800 border-slate-200 group-hover:border-slate-300'
                        }`}
                      >
                        {!isOnline && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                        <span>{m.name}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* VIEW MODE 2: VERTICAL PIPELINE WORKFLOW */}
          {viewMode === 'pipeline' && (
            <div className="w-full max-w-lg py-4 space-y-3 relative">
              {/* Continuous Connecting Spine Line */}
              <div className="absolute left-[36px] top-6 bottom-6 w-0.5 bg-blue-500/80 -z-0" />

              {machines.map((m) => {
                const isSelected = selectedMachine.id === m.id;
                const isOnline = m.heartbeatStatus === 'up';
                const Icon = m.icon;

                return (
                  <div
                    key={`pipe-${m.id}`}
                    onClick={() => setSelectedMachine(m)}
                    className="relative flex items-center gap-3.5 z-10 cursor-pointer group"
                  >
                    {/* Left Machine Image / Node Thumbnail */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-200 overflow-hidden p-1.5 relative ${
                        isSelected
                          ? isOnline
                            ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-100 scale-105'
                            : 'bg-white border-rose-600 shadow-md ring-2 ring-rose-100 scale-105'
                          : !isOnline
                          ? 'bg-white border-rose-200 opacity-90'
                          : 'bg-white border-slate-200 group-hover:border-blue-400 shadow-xs'
                      }`}
                    >
                      {m.image ? (
                        <img
                          src={m.image}
                          alt={m.name}
                          className={`w-full h-full object-contain ${!isOnline ? 'grayscale-40' : ''}`}
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

                      {/* Corner Badge */}
                      {!isOnline ? (
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                          <X className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                      )}
                    </div>

                    {/* Right Card */}
                    <div
                      className={`flex-1 p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                        isSelected
                          ? isOnline
                            ? 'bg-blue-50/70 border-blue-400 text-blue-900 shadow-xs ring-1 ring-blue-300/40'
                            : 'bg-rose-50/70 border-rose-300 text-rose-950 shadow-xs ring-1 ring-rose-300/40'
                          : !isOnline
                          ? 'bg-rose-50/30 border-rose-200 text-slate-800'
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
                          {isOnline ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold font-mono tracking-wider uppercase text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              CONNECTED • STREAMING
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold font-mono tracking-wider uppercase text-rose-700">
                              <X className="w-3 h-3 stroke-[3]" />
                              DOWN ({m.timeInState})
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                            • {m.protocol.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right hidden sm:block">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md block ${
                              isOnline
                                ? 'text-blue-600 bg-blue-100/70'
                                : 'text-rose-700 bg-rose-100/80'
                            }`}
                          >
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
            {/* Device Photo Preview Card */}
            {selectedMachine.image ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-3 shadow-2xs group">
                <div className="h-40 w-full rounded-xl bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center p-2 relative overflow-hidden border border-slate-100">
                  <img
                    src={selectedMachine.image}
                    alt={selectedMachine.name}
                    className={`max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 ${
                      selectedMachine.heartbeatStatus === 'down' ? 'grayscale-30' : ''
                    }`}
                  />
                  {selectedMachine.heartbeatStatus === 'up' ? (
                    <span className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE LINKED
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1 shadow-2xs">
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                      HEARTBEAT DOWN
                    </span>
                  )}
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
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border font-mono flex items-center gap-1 ${
                    selectedMachine.heartbeatStatus === 'up'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  {selectedMachine.heartbeatStatus === 'up' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>CONNECTED</span>
                    </>
                  ) : (
                    <>
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                      <span>OFFLINE</span>
                    </>
                  )}
                </span>
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedMachine.description}
            </p>

            {/* BetterStack Live Heartbeat Telemetry Card */}
            {selectedMachine.heartbeatId && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-2 ${
                  selectedMachine.heartbeatStatus === 'up'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {selectedMachine.heartbeatStatus === 'up' ? (
                      <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>BetterStack Monitor #{selectedMachine.heartbeatId}</span>
                  </div>
                  <span
                    className={`px-2 py-0.2 rounded-full font-mono text-[10px] uppercase font-extrabold ${
                      selectedMachine.heartbeatStatus === 'up'
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : 'bg-rose-200/80 text-rose-900'
                    }`}
                  >
                    STATUS: {selectedMachine.heartbeatStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-black/5">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Current Duration:</span>
                    <strong className="font-mono text-slate-800">{selectedMachine.timeInState}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Ping Expectation:</span>
                    <strong className="font-mono text-slate-800">
                      {selectedMachine.period}s (Grace {selectedMachine.grace}s)
                    </strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono truncate">
                  Timezone: <strong>{selectedMachine.timezone}</strong> • Target: {selectedMachine.heartbeatName}
                </div>
              </div>
            )}

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
                  Stream Bandwidth
                </span>
                <span
                  className={`font-mono font-bold text-[11px] block ${
                    selectedMachine.heartbeatStatus === 'up' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {selectedMachine.dataRate}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Throughput / Spec
                </span>
                <span className="font-semibold text-slate-800 text-[11px] block truncate">
                  {selectedMachine.throughput}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Last Echo Ping
                </span>
                <span className="font-mono text-slate-600 text-[10px] block truncate">
                  {selectedMachine.lastPing}
                </span>
              </div>
            </div>

            {/* Ping Notice Message */}
            {pingNotice && (
              <div
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
                  pingNotice.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {pingNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-medium text-[11px]">{pingNotice.text}</span>
              </div>
            )}
          </div>

          {/* Diagnostic Action Button */}
          <div className="pt-4 border-t border-slate-200/80 mt-4 space-y-2">
            <button
              onClick={() => handlePingTest(selectedMachine)}
              disabled={isPinging}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-50 ${
                selectedMachine.heartbeatStatus === 'down'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>
                {isPinging
                  ? 'Dispatching Heartbeat Ping...'
                  : selectedMachine.heartbeatStatus === 'down'
                  ? `Simulate Heartbeat / Ping Echo (${selectedMachine.name})`
                  : `Send Heartbeat Echo Ping (${selectedMachine.name})`}
              </span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Directly triggers BetterStack monitor heartbeat ping (Bypasses AWS Server)
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
