/**
 * Tactical Time & Geolocation Telemetry Engine for Tharun OS / JARVIS
 * Provides real-time millisecond-precision chronometer, world clocks,
 * browser GPS geolocation with high-accuracy tracking, reverse geocoding,
 * coordinate formatting (Decimal Degrees, DMS, MGRS), and tactical simulation presets.
 */

export interface TacticalLocationData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  status: 'ACQUIRING' | 'LOCKED' | 'DENIED' | 'SIMULATED' | 'OFFLINE';
  isSimulated: boolean;
  source: 'GPS' | 'IP_GEOLOCATION' | 'SIMULATOR';
  timestamp: number;
  satellitesTracked: number;
  hdop: number;
  formattedAddress?: string;
}

export interface TacticalTimeData {
  time24: string; // e.g. "14:32:05"
  time12: string; // e.g. "02:32:05 PM"
  zuluTime: string; // e.g. "09:02:05Z"
  dateFormatted: string; // e.g. "SAT, 17 OCT 2026"
  dateShort: string; // e.g. "17-OCT-2026"
  timezone: string; // e.g. "Asia/Kolkata"
  utcOffset: string; // e.g. "UTC+05:30"
  epoch: number; // e.g. 1792243925000
  stardate: string; // e.g. "SD-2026.290"
  dayOfWeek: string; // e.g. "Saturday"
  milliseconds: number;
}

export interface WorldClockEntry {
  city: string;
  country: string;
  timezone: string;
  timeString: string;
  diffHours: string;
  isDay: boolean;
}

export interface TacticalLocationPreset {
  id: string;
  name: string;
  codeName: string;
  latitude: number;
  longitude: number;
  altitude: number;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  description: string;
}

export const TACTICAL_LOCATION_PRESETS: TacticalLocationPreset[] = [
  {
    id: 'new-york-hq',
    name: 'New York Global Financial HQ',
    codeName: 'MANHATTAN NEXUS-01',
    latitude: 40.7505,
    longitude: -73.9835,
    altitude: 381,
    city: 'New York City',
    region: 'New York',
    country: 'United States',
    countryCode: 'US',
    description: 'Central Executive Command & Global Business Hub, Midtown Manhattan.',
  },
  {
    id: 'silicon-valley-campus',
    name: 'Silicon Valley Innovation Campus',
    codeName: 'SILICON CLOUD HUB',
    latitude: 37.3861,
    longitude: -122.0839,
    altitude: 32,
    city: 'Mountain View',
    region: 'California',
    country: 'United States',
    countryCode: 'US',
    description: 'Primary AI engineering campus, cloud cluster & neural network center.',
  },
  {
    id: 'chennai-hq',
    name: 'Tharun OS Primary Tech Node',
    codeName: 'COROMANDEL NEXUS',
    latitude: 13.0827,
    longitude: 80.2707,
    altitude: 16,
    city: 'Chennai',
    region: 'Tamil Nadu',
    country: 'India',
    countryCode: 'IN',
    description: 'Bay of Bengal strategic neural hub and primary system server.',
  },
  {
    id: 'london-sanctum',
    name: 'London Operative Station',
    codeName: 'THAMES WATCHTOWER',
    latitude: 51.5074,
    longitude: -0.1278,
    altitude: 35,
    city: 'London',
    region: 'Greater London',
    country: 'United Kingdom',
    countryCode: 'GB',
    description: 'European communications array & intelligence relay station.',
  },
  {
    id: 'tokyo-sanctum',
    name: 'Neo-Tokyo Quantum Array',
    codeName: 'SHINJUKU MATRIX',
    latitude: 35.6762,
    longitude: 139.6503,
    altitude: 44,
    city: 'Tokyo',
    region: 'Kanto',
    country: 'Japan',
    countryCode: 'JP',
    description: 'Pacific fiber node & holographic research sector.',
  },
  {
    id: 'san-francisco',
    name: 'San Francisco Cyber Bay',
    codeName: 'GOLDEN GATE NODE',
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 52,
    city: 'San Francisco',
    region: 'California',
    country: 'United States',
    countryCode: 'US',
    description: 'Silicon corridor gateway and neural network telemetry hub.',
  },
];

/**
 * Generate instantaneous TacticalTimeData snapshot
 */
export function getTacticalTimeData(now: Date = new Date()): TacticalTimeData {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();

  const time24 = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const time12 = `${pad(hours12)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;

  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  const zuluTime = `${pad(utcHours)}:${pad(utcMinutes)}:${pad(utcSeconds)}Z`;

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const dayOfWeek = fullDays[now.getDay()];
  const dateFormatted = `${days[now.getDay()]}, ${pad(now.getDate())} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const dateShort = `${pad(now.getDate())}-${months[now.getMonth()]}-${now.getFullYear()}`;

  // Timezone information
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  } catch {
    timezone = 'Local';
  }

  // UTC offset
  const offsetMinutes = -now.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absOffsetMin = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absOffsetMin / 60);
  const offsetRemainMin = absOffsetMin % 60;
  const utcOffset = `UTC${offsetSign}${pad(offsetHours)}:${pad(offsetRemainMin)}`;

  // Military Stardate calculation: Year + (DayOfYear / 365.25) * 1000
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000) + 1;
  const stardate = `SD-${now.getFullYear()}.${pad(dayOfYear)}`;

  return {
    time24,
    time12,
    zuluTime,
    dateFormatted,
    dateShort,
    timezone,
    utcOffset,
    epoch: now.getTime(),
    stardate,
    dayOfWeek,
    milliseconds: ms,
  };
}

/**
 * World clocks list for tactical temporal matrix
 */
export function getWorldClocks(now: Date = new Date()): WorldClockEntry[] {
  const cities = [
    { city: 'London', country: 'UK', tz: 'Europe/London' },
    { city: 'New York', country: 'US', tz: 'America/New_York' },
    { city: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo' },
    { city: 'Chennai / New Delhi', country: 'India', tz: 'Asia/Kolkata' },
    { city: 'San Francisco', country: 'US', tz: 'America/Los_Angeles' },
    { city: 'Paris', country: 'France', tz: 'Europe/Paris' },
    { city: 'Sydney', country: 'Australia', tz: 'Australia/Sydney' },
    { city: 'UTC / Zulu', country: 'Orbital', tz: 'UTC' },
  ];

  return cities.map(({ city, country, tz }) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const timeString = formatter.format(now);
      
      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        hour12: false,
      });
      const cityHour = parseInt(hourFormatter.format(now), 10);
      const isDay = cityHour >= 6 && cityHour < 19;

      // Approximate offset difference vs local
      const localHours = now.getHours();
      const diff = cityHour - localHours;
      const diffFormatted = diff >= 0 ? `+${diff}h` : `${diff}h`;

      return {
        city,
        country,
        timezone: tz,
        timeString,
        diffHours: diffFormatted,
        isDay,
      };
    } catch {
      return {
        city,
        country,
        timezone: tz,
        timeString: '--:--:--',
        diffHours: '+0h',
        isDay: true,
      };
    }
  });
}

/**
 * Coordinate formatting helpers
 */
export function formatCoordinates(
  lat: number | null,
  lon: number | null,
  format: 'DD' | 'DMS' | 'MGRS' = 'DD'
): string {
  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
    return 'COORDINATES ACQUIRING...';
  }

  if (format === 'DD') {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
  }

  if (format === 'DMS') {
    const toDms = (deg: number, isLat: boolean) => {
      const dir = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
      const abs = Math.abs(deg);
      const d = Math.floor(abs);
      const m = Math.floor((abs - d) * 60);
      const s = ((abs - d - m / 60) * 3600).toFixed(1);
      return `${d}° ${m}' ${s}" ${dir}`;
    };
    return `${toDms(lat, true)}, ${toDms(lon, false)}`;
  }

  if (format === 'MGRS') {
    // High-tech tactical military pseudo-grid formatting based on lat/lon
    const zone = Math.floor((lon + 180) / 6) + 1;
    const bandLetters = 'CDEFGHJKLMNPQRSTUVWX';
    const bandIndex = Math.min(
      bandLetters.length - 1,
      Math.max(0, Math.floor((lat + 80) / 8))
    );
    const band = bandLetters[bandIndex] || 'N';
    const easting = Math.floor(((lon + 180) * 1000) % 100000).toString().padStart(5, '0');
    const northing = Math.floor(((lat + 90) * 1000) % 100000).toString().padStart(5, '0');
    return `${zone}${band} TK ${easting.slice(0, 3)} ${northing.slice(0, 3)}`;
  }

  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

/**
 * Calculate Compass Bearing Name (e.g. 0° -> N, 45° -> NE, etc.)
 */
export function getHeadingCompassName(heading: number | null): string {
  if (heading === null || isNaN(heading)) return 'N/A';
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(heading / 22.5) % 16;
  return `${Math.round(heading)}° ${points[index]}`;
}

/**
 * Default fallback location if GPS is unavailable
 */
export const DEFAULT_TACTICAL_LOCATION: TacticalLocationData = {
  latitude: 13.0827,
  longitude: 80.2707,
  altitude: 18,
  accuracy: 12.4,
  heading: 42,
  speed: 0,
  city: 'Chennai',
  region: 'Tamil Nadu',
  country: 'India',
  countryCode: 'IN',
  status: 'SIMULATED',
  isSimulated: true,
  source: 'SIMULATOR',
  timestamp: Date.now(),
  satellitesTracked: 9,
  hdop: 1.2,
  formattedAddress: 'Coromandel Neural Matrix Node, Chennai, Tamil Nadu, IN',
};
