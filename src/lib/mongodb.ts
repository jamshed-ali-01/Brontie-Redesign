import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI_LOCAL = process.env.MONGODB_URI_LOCAL;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

export interface MaintenanceStatus {
  maintenanceMode: boolean;
  bypassPassword?: string;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  currentUri?: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null, currentUri: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

// Helper to check maintenance status directly from the LIVE database
// We use a separate Mongoose connection instead of MongoClient to avoid Webpack/Next.js build errors
let liveConnection: mongoose.Connection | null = null;

export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  try {
    if (!liveConnection) {
      if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');
      liveConnection = await mongoose.createConnection(MONGODB_URI).asPromise();
    }

    const db = liveConnection.db;
    if (!db) {
      throw new Error('Database connection not yet established');
    }
    const settings = await db.collection('settings').findOne({});
    return {
      maintenanceMode: settings?.maintenanceMode || false,
      bypassPassword: settings?.bypassPassword || ''
    };
  } catch (error) {
    console.error('Error checking maintenance status:', error);
    // If error, reset connection to try again next time
    if (liveConnection) {
      try { await liveConnection.close(); } catch (e) { }
      liveConnection = null;
    }
    return { maintenanceMode: false };
  }
}

export async function connectToDatabase() {
  // 1. Check Maintenance Mode status
  const { maintenanceMode } = await getMaintenanceStatus();

  // 2. Determine target URI
  // SECURITY HARDENING: If maintenance mode is ON, we MUST use LOCAL URI.
  // If undefined, THROW ERROR. Do NOT fallback to LIVE.
  let targetUri = MONGODB_URI!;

  if (maintenanceMode) {
    if (!MONGODB_URI_LOCAL) {
      throw new Error('CRITICAL SECURITY ERROR: Maintenance Mode is ON but MONGODB_URI_LOCAL is not defined. Cannot safely connect to database.');
    }
    targetUri = MONGODB_URI_LOCAL;
  }

  // 3. Check if current connection matches target
  if (cached.conn && cached.currentUri === targetUri) {
    return cached.conn;
  }

  // 4. Switch connection if needed
  if (cached.conn && cached.currentUri !== targetUri) {
    console.log(`Switching Database Connection to ${targetUri === MONGODB_URI ? 'LIVE' : 'LOCAL'}`);
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(targetUri, opts).then((mongoose) => {
      return mongoose;
    });
    cached.currentUri = targetUri;
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.currentUri = null;
    throw e;
  }

  return cached.conn;
}
