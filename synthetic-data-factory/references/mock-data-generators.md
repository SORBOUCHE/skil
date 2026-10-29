# Synthetic Mock Data Generators & Field Pattern Reference

This reference catalog details algorithms and code patterns for synthesizing realistic, production-grade mock data while strictly preserving privacy and compliance.

---

## 1. Identifiers: UUIDv4, UUIDv7, ULID, CUID, and Snowflake

Using appropriate identifiers is vital for database indexing and realistic payload sizes.

### 1.1 UUIDv7 (Time-Ordered UUID — Postgres & B-Tree Optimized)
UUIDv7 embeds a 48-bit UNIX millisecond timestamp in the leading bits, avoiding B-Tree fragmentation in high-throughput database inserts:

```typescript
import { randomBytes } from 'crypto';

export function generateUUIDv7(timestampMs: number = Date.now()): string {
  const bytes = randomBytes(16);

  // Set 48-bit timestamp
  bytes[0] = (timestampMs / 0x10000000000) & 0xff;
  bytes[1] = (timestampMs / 0x100000000) & 0xff;
  bytes[2] = (timestampMs / 0x1000000) & 0xff;
  bytes[3] = (timestampMs / 0x10000) & 0xff;
  bytes[4] = (timestampMs / 0x100) & 0xff;
  bytes[5] = timestampMs & 0xff;

  // Set version 7 in bits 48-51
  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  // Set variant in bits 64-65 (RFC 4122 variant 1: 10xxxxxx)
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
```

### 1.2 NanoID / Friendly Slugs
```typescript
const ALPHANUMERIC = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateNanoId(size: number = 21): string {
  let id = '';
  for (let i = 0; i < size; i++) {
    id += ALPHANUMERIC[Math.floor(Math.random() * ALPHANUMERIC.length)];
  }
  return id;
}
```

---

## 2. Temporal & Date Generators

### 2.1 Causal Temporal Chain Generator
Guarantees that audit trails and transaction events follow logical sequence without temporal anomalies:

```typescript
export interface AuditTrailTimestamps {
  createdAt: string;
  verifiedAt: string | null;
  updatedAt: string;
  archivedAt: string | null;
}

export function generateCausalTimestamps(historicalWindowDays: number = 90): AuditTrailTimestamps {
  const now = Date.now();
  const windowStart = now - historicalWindowDays * 24 * 60 * 60 * 1000;
  
  // 1. Created at random point in past window
  const createEpoch = windowStart + Math.random() * (now - windowStart);
  const createdAt = new Date(createEpoch);

  // 2. Verified at: 80% probability, within 48 hours of creation
  const isVerified = Math.random() < 0.8;
  const verifiedEpoch = isVerified ? createEpoch + Math.random() * 48 * 3600 * 1000 : null;
  const verifiedAt = verifiedEpoch && verifiedEpoch <= now ? new Date(verifiedEpoch).toISOString() : null;

  // 3. Updated at: between creation and now
  const updateEpoch = createEpoch + Math.random() * (now - createEpoch);
  const updatedAt = new Date(updateEpoch).toISOString();

  // 4. Archived at: 5% probability
  const isArchived = Math.random() < 0.05;
  const archiveEpoch = isArchived ? updateEpoch + Math.random() * (now - updateEpoch) : null;
  const archivedAt = archiveEpoch ? new Date(archiveEpoch).toISOString() : null;

  return {
    createdAt: createdAt.toISOString(),
    verifiedAt,
    updatedAt,
    archivedAt,
  };
}
```

### 2.2 Business Hours Skew (Peak Traffic Modeling)
```typescript
export function generateBusinessHoursTimestamp(baseDate: Date): Date {
  const target = new Date(baseDate);
  // Pick weekday (Mon-Fri)
  const day = Math.floor(Math.random() * 5) + 1;
  // Skew hours towards 09:00 - 17:00
  const hour = Math.floor(Math.random() * 8) + 9;
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);

  target.setDate(target.getDate() + day);
  target.setHours(hour, minute, second, 0);
  return target;
}
```

---

## 3. Financial, Currencies & Payment Fields

### 3.1 Currencies & Safe Integer Minor Units (Cents)
Always represent monetary values in minor units (e.g., cents, pence) to eliminate floating-point arithmetic errors.

```typescript
export interface PriceQuote {
  amountCents: number;
  formatted: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED';
}

const CURRENCY_DISTRIBUTION = [
  { code: 'USD', symbol: '$', weight: 0.50 },
  { code: 'EUR', symbol: '€', weight: 0.25 },
  { code: 'GBP', symbol: '£', weight: 0.10 },
  { code: 'SAR', symbol: '﷼', weight: 0.10 },
  { code: 'AED', symbol: 'د.إ', weight: 0.05 },
];

export function generateRealisticPrice(min: number = 5, max: number = 300): PriceQuote {
  const rand = Math.random();
  let acc = 0;
  let selected = CURRENCY_DISTRIBUTION[0];

  for (const c of CURRENCY_DISTRIBUTION) {
    acc += c.weight;
    if (rand <= acc) {
      selected = c;
      break;
    }
  }

  // Realistic retail pricing endings (.99, .95, .00, .50)
  const endings = [0.99, 0.95, 0.00, 0.50, 0.49];
  const baseInteger = Math.floor(Math.random() * (max - min)) + min;
  const decimalEnding = endings[Math.floor(Math.random() * endings.length)];
  const total = baseInteger + decimalEnding;
  const amountCents = Math.round(total * 100);

  return {
    amountCents,
    formatted: `${selected.symbol}${total.toFixed(2)}`,
    currency: selected.code as any,
  };
}
```

### 3.2 Luhn-Valid Synthetic Test Credit Card Numbers
```typescript
export function generateTestCreditCard(brand: 'visa' | 'mastercard' | 'amex' = 'visa'): string {
  const prefixes = {
    visa: ['4532', '4556', '4916', '4024'],
    mastercard: ['5105', '5200', '5425', '5555'],
    amex: ['3714', '3782'],
  };

  const prefixList = prefixes[brand];
  const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
  const length = brand === 'amex' ? 15 : 16;

  let digits = prefix.split('').map(Number);
  while (digits.length < length - 1) {
    digits.push(Math.floor(Math.random() * 10));
  }

  // Compute Luhn checksum digit
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[digits.length - 1 - i];
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  digits.push(checkDigit);

  return digits.join('');
}
```

---

## 4. Multilingual Demographics & Identity (Zero PII)

### 4.1 Diverse Name Pools (English, Arabic, Hispanic, Asian, European)
```typescript
interface CulturalNamePool {
  culture: string;
  firstNames: string[];
  lastNames: string[];
}

const NAME_POOLS: CulturalNamePool[] = [
  {
    culture: 'Arabic',
    firstNames: ['Tariq', 'Zaid', 'Omar', 'Nour', 'Layla', 'Fatima', 'Yousef', 'Mariam', 'Ziyad', 'Amira'],
    lastNames: ['Al-Mansoor', 'Al-Hashimi', 'Al-Ghamdi', 'Al-Khatib', 'Siddiqui', 'Al-Nasser', 'Qasim'],
  },
  {
    culture: 'English',
    firstNames: ['Alexander', 'Charlotte', 'Benjamin', 'Sophia', 'Liam', 'Emma', 'Oliver', 'Harper'],
    lastNames: ['Vance', 'Sterling', 'Blackwood', 'Hastings', 'Montgomery', 'Wellington', 'Sinclair'],
  },
  {
    culture: 'Hispanic',
    firstNames: ['Mateo', 'Sofia', 'Santiago', 'Valentina', 'Alejandro', 'Camila', 'Diego', 'Lucia'],
    lastNames: ['Navarro', 'Castillo', 'Delgado', 'Morales', 'Velasquez', 'Salazar', 'Mendoza'],
  },
  {
    culture: 'East Asian',
    firstNames: ['Kenji', 'Yuki', 'Min-ho', 'Ji-won', 'Wei', 'Mei-ling', 'Haruto', 'Soo-jin'],
    lastNames: ['Takahashi', 'Watanabe', 'Park', 'Kim', 'Zhang', 'Chen', 'Nakamura'],
  },
];

export function generateSyntheticPerson() {
  const pool = NAME_POOLS[Math.floor(Math.random() * NAME_POOLS.length)];
  const firstName = pool.firstNames[Math.floor(Math.random() * pool.firstNames.length)];
  const lastName = pool.lastNames[Math.floor(Math.random() * pool.lastNames.length)];
  
  // Clean ASCII slug for email
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const randSuffix = Math.floor(Math.random() * 900) + 100;
  const email = `${cleanFirst}.${cleanLast}${randSuffix}@synthetic-mail.internal`;

  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email,
    culture: pool.culture,
  };
}
```

### 4.2 Valid Fictional Phone Numbers (E.164 Compliant)
Utilizes the North American Numbering Plan reserved fictional exchange `555-0100` through `555-0199`:

```typescript
export function generateFictionalPhone(countryCode: 'US' | 'SA' | 'UK' = 'US'): string {
  if (countryCode === 'US') {
    const areaCodes = ['212', '415', '312', '206', '512'];
    const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const line = Math.floor(Math.random() * 100).toString().padStart(4, '01');
    return `+1-${area}-555-${line}`;
  } else if (countryCode === 'SA') {
    // Saudi Arabia format (+966 5X XXX XXXX) with synthetic prefix
    const suffix = Math.floor(Math.random() * 9000000) + 1000000;
    return `+966-50-${suffix}`;
  } else {
    // UK synthetic drama number range: 01632 960000 - 960999
    const suffix = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `+44-1632-960${suffix}`;
  }
}
```

---

## 5. Deterministic Pseudo-Random Seeding (Mulberry32)

To ensure unit and integration tests run deterministically across CI environments:

```typescript
export class DeterministicRandom {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
  }

  // Returns pseudo-random float between 0 and 1
  public next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public integer(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public pickOne<T>(list: T[]): T {
    return list[this.integer(0, list.length - 1)];
  }
}
```
