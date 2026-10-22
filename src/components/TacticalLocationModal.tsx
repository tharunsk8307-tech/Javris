import React, { useState } from 'react';
import {
  MapPin,
  Crosshair,
  Compass,
  Navigation,
  Globe,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  X,
  Radio,
  Sliders,
  Shield,
  Layers,
  Map,
} from 'lucide-react';
import {
  TacticalLocationData,
  TacticalLocationPreset,
  TACTICAL_LOCATION_PRESETS,
  formatCoordinates,
  getHeadingCompassName,
} from '../utils/tacticalTimeLocation';

interface TacticalLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationData: TacticalLocationData;
  effectiveAccentColor?: string;
  onRequestLiveGps: () => void;
  onSelectPreset: (preset: TacticalLocationPreset) => void;
  onSetCustomCoordinates: (lat: number, lon: number, city?: string) => void;
}

export const TacticalLocationModal: React.FC<TacticalLocationModalProps> = ({
  isOpen,
  onClose,
  locationData,
  effectiveAccentColor = '#06b6d4',
  onRequestLiveGps,
  onSelectPreset,
  onSetCustomCoordinates,
}) => {
  const [coordFormat, setCoordFormat] = useState<'DD' | 'DMS' | 'MGRS'>('DD');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Manual coordinate input modal state
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualLat, setManualLat] = useState(
    locationData.latitude ? locationData.latitude.toString() : '13.0827'
  );
  const [manualLon, setManualLon] = useState(
    locationData.longitude ? locationData.longitude.toString() : '80.2707'
  );
  const [manualCity, setManualCity] = useState(locationData.city || 'Command Post');
  const [manualError, setManualError] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleApplyManualCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setManualError('Latitude must be a valid number between -90 and +90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setManualError('Longitude must be a valid number between -180 and +180.');
      return;
    }
    setManualError(null);
    onSetCustomCoordinates(lat, lon, manualCity.trim() || undefined);
    setIsManualInput(false);
  };

  const formattedCoords = formatCoordinates(locationData.latitude, locationData.longitude, coordFormat);
  const googleMapsUrl =
    locationData.latitude && locationData.longitude
      ? `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`
      : 'https://maps.google.com';
  const openStreetMapUrl =
    locationData.latitude && locationData.longitude
      ? `https://www.openstreetmap.org/?mlat=${locationData.latitude}&mlon=${locationData.longitude}#map=14/${locationData.latitude}/${locationData.longitude}`
      : 'https://www.openstreetmap.org';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl rounded-2xl bg-slate-950/95 border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
        style={{
          borderColor: `${effectiveAccentColor}60`,
          boxShadow: `0 0 40px ${effectiveAccentColor}25`,
        }}
      >
        {/* Header Bar */}
        <div
          className="p-4 border-b flex items-center justify-between bg-slate-900/60"
          style={{ borderColor: `${effectiveAccentColor}30` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: `${effectiveAccentColor}20`,
                borderColor: `${effectiveAccentColor}60`,
              }}
            >
              <Navigation className="w-5 h-5 animate-spin" style={{ color: effectiveAccentColor, animationDuration: '10s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="hud-font font-bold text-sm tracking-wider text-slate-100">
                  TACTICAL GEOLOCATION &amp; ORBITAL RADAR
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold"
                  style={{
                    backgroundColor:
                      locationData.status === 'LOCKED'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : `${effectiveAccentColor}20`,
                    borderColor:
                      locationData.status === 'LOCKED'
                        ? 'rgba(16, 185, 129, 0.6)'
                        : `${effectiveAccentColor}50`,
                    color: locationData.status === 'LOCKED' ? '#34d399' : effectiveAccentColor,
                  }}
                >
                  {locationData.status === 'LOCKED' ? 'GPS LOCKED (3D FIX)' : locationData.status}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Orbital satellite telemetry • MGRS coordinates • Spatial reconnaissance node
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRequestLiveGps}
              className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Acquire live hardware GPS fix from device"
            >
              <RefreshCw className="w-3.5 h-3.5" style={{ color: effectiveAccentColor }} />
              <span className="hidden sm:inline">REFRESH GPS</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-700/60 hover:bg-rose-950/40 text-slate-400 hover:text-rose-200 transition-colors cursor-pointer"
              title="Close Location Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Hero Section: Tactical Radar Visualizer & Primary Coordinates */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Tactical Radar Display (Left) */}
            <div
              className="lg:col-span-5 h-64 rounded-2xl border bg-slate-950 relative overflow-hidden flex items-center justify-center"
              style={{
                borderColor: `${effectiveAccentColor}40`,
                boxShadow: `inset 0 0 30px ${effectiveAccentColor}15`,
              }}
            >
              {/* Radar Concentric Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-48 h-48 rounded-full border border-dashed opacity-40 animate-spin"
                  style={{ borderColor: effectiveAccentColor, animationDuration: '30s' }}
                />
                <div
                  className="w-36 h-36 rounded-full border opacity-50"
                  style={{ borderColor: effectiveAccentColor }}
                />
                <div
                  className="w-24 h-24 rounded-full border border-dashed opacity-60"
                  style={{ borderColor: effectiveAccentColor }}
                />
                <div
                  className="w-12 h-12 rounded-full border opacity-70"
                  style={{ borderColor: effectiveAccentColor }}
                />

                {/* Crosshairs */}
                <div className="absolute w-full h-px bg-slate-800" />
                <div className="absolute h-full w-px bg-slate-800" />

                {/* Rotating Sweep Beam */}
                <div
                  className="absolute w-48 h-48 rounded-full pointer-events-none animate-spin"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${effectiveAccentColor}40 360deg)`,
                    animationDuration: '4s',
                  }}
                />
              </div>

              {/* Target Location Beacon */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  <div
                    className="w-6 h-6 rounded-full animate-ping absolute"
                    style={{ backgroundColor: effectiveAccentColor, opacity: 0.7 }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white shadow-lg relative z-10"
                    style={{ backgroundColor: effectiveAccentColor }}
                  />
                </div>
                <div
                  className="mt-2 px-2 py-0.5 rounded bg-slate-900/90 border text-[10px] font-mono font-bold tracking-wider text-slate-100 shadow"
                  style={{ borderColor: effectiveAccentColor }}
                >
                  {locationData.city || 'OPERATIVE POSITION'}
                </div>
              </div>

              {/* Cardinal Directions */}
              <span className="absolute top-2 text-[10px] font-mono font-bold text-slate-500">N 000°</span>
              <span className="absolute bottom-2 text-[10px] font-mono font-bold text-slate-500">S 180°</span>
              <span className="absolute left-2 text-[10px] font-mono font-bold text-slate-500">W 270°</span>
              <span className="absolute right-2 text-[10px] font-mono font-bold text-slate-500">E 090°</span>

              {/* Radar Corner Metrics */}
              <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-400">
                RANGE: 25 KM
              </div>
              <div className="absolute bottom-2 right-2 text-[9px] font-mono" style={{ color: effectiveAccentColor }}>
                BEARING: {getHeadingCompassName(locationData.heading)}
              </div>
            </div>

            {/* Coordinates & Main Telemetry (Right) */}
            <div className="lg:col-span-7 space-y-4">
              <div
                className="p-4 sm:p-5 rounded-2xl border bg-slate-900/50 space-y-3"
                style={{
                  borderColor: `${effectiveAccentColor}40`,
                  boxShadow: `inset 0 0 20px ${effectiveAccentColor}10`,
                }}
              >
                {/* Format Toggle Buttons */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5" style={{ color: effectiveAccentColor }} />
                    <span className="font-bold text-slate-200">TACTICAL POSITION</span>
                  </span>

                  <div className="flex items-center gap-1">
                    {(['DD', 'DMS', 'MGRS'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setCoordFormat(fmt)}
                        className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                          coordFormat === fmt
                            ? 'bg-slate-100 text-slate-950 font-bold border-white'
                            : 'border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Coordinates Readout */}
                <div className="py-1">
                  <div
                    className="font-mono text-xl sm:text-2xl font-extrabold text-slate-100 tracking-wider truncate"
                    style={{ textShadow: `0 0 14px ${effectiveAccentColor}60` }}
                  >
                    {formattedCoords}
                  </div>
                  <div className="text-xs font-mono text-slate-300 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>
                      {locationData.city || 'Coordinates Locked'}, {locationData.region ? `${locationData.region}, ` : ''}{locationData.country || ''} {locationData.countryCode ? `(${locationData.countryCode})` : ''}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formattedCoords, 'coords')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'coords' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'coords' ? 'COPIED TO CLIPBOARD' : 'COPY COORDS'}</span>
                  </button>

                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>GOOGLE MAPS</span>
                  </a>

                  <a
                    href={openStreetMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <Map className="w-3.5 h-3.5 text-emerald-400" />
                    <span>OPENSTREETMAP</span>
                  </a>
                </div>
              </div>

              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">GPS ACCURACY</span>
                  <span className="font-bold text-slate-100">
                    {locationData.accuracy ? `±${Math.round(locationData.accuracy)}m` : '±12m (EST)'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ALTITUDE (MSL)</span>
                  <span className="font-bold text-slate-100">
                    {locationData.altitude != null ? `${Math.round(locationData.altitude)}m (${Math.round(locationData.altitude * 3.28)}ft)` : 'Ground Lvl'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">BEARING / HEADING</span>
                  <span className="font-bold text-slate-100">
                    {getHeadingCompassName(locationData.heading)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">SATELLITES</span>
                  <span className="font-bold" style={{ color: effectiveAccentColor }}>
                    {locationData.satellitesTracked} TRACKED
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Location Presets & Manual Override */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="hud-font font-bold text-slate-200 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400" />
                TACTICAL LOCATION SIMULATION PRESETS
              </span>
              <button
                type="button"
                onClick={() => setIsManualInput(!isManualInput)}
                className="text-[10px] px-2 py-0.5 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>{isManualInput ? 'CANCEL OVERRIDE' : 'CUSTOM COORDS OVERRIDE'}</span>
              </button>
            </div>

            {/* Manual Coordinate Form */}
            {isManualInput && (
              <form
                onSubmit={handleApplyManualCoords}
                className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/50 space-y-3 animate-in fade-in"
              >
                <div className="text-xs font-mono font-bold text-cyan-300">
                  SPECIFY CUSTOM OPERATIVE COORDINATES
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">LATITUDE (-90 to +90):</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">LONGITUDE (-180 to +180):</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLon}
                      onChange={(e) => setManualLon(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">LOCATION / CALLSIGN LABEL:</label>
                    <input
                      type="text"
                      value={manualCity}
                      onChange={(e) => setManualCity(e.target.value)}
                      placeholder="e.g. New York Financial HQ"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                {manualError && (
                  <div className="text-xs text-rose-400 font-mono">{manualError}</div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsManualInput(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
                  >
                    LOCK CUSTOM POSITION
                  </button>
                </div>
              </form>
            )}

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {TACTICAL_LOCATION_PRESETS.map((preset) => {
                const isActive =
                  locationData.latitude !== null &&
                  Math.abs(locationData.latitude - preset.latitude) < 0.001 &&
                  Math.abs((locationData.longitude || 0) - preset.longitude) < 0.001;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group relative overflow-hidden ${
                      isActive
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-slate-200 group-hover:text-white truncate">
                        {preset.name}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </div>

                    <div className="text-[10px] font-mono text-cyan-400">
                      {preset.codeName}
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                      {preset.latitude.toFixed(4)}°, {preset.longitude.toFixed(4)}° • {preset.city}, {preset.country}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>THARUN OS • ORBITAL SATELLITE NETWORK ACTIVE</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
