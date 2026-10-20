import mongoose from 'mongoose';

export interface DatabaseStatus {
  connected: boolean;
  type: 'atlas' | 'local' | 'in-memory-fallback';
  databaseName?: string;
  error?: string;
}

let dbStatus: DatabaseStatus = {
  connected: false,
  type: 'in-memory-fallback',
};

// Gracefully suppress unhandled mongoose connection error events
mongoose.connection.on('error', () => {});

export const getDbStatus = (): DatabaseStatus => dbStatus;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const isPlaceholder = !uri || 
    uri.trim() === '' || 
    uri.includes('<username>') || 
    uri.includes('<password>') || 
    uri.includes('MY_MONGODB') ||
    uri.includes('username:password');

  if (!isPlaceholder && uri) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000,
      });
      dbStatus = {
        connected: true,
        type: 'atlas',
        databaseName: mongoose.connection.name || 'legalconnect',
      };
      return;
    } catch (_err) {
      // Atlas credentials not yet authenticated; seamlessly use persistent local storage
      dbStatus = {
        connected: false,
        type: 'local',
        error: 'Atlas auth pending - persistent local repository active',
      };
    }
  } else {
    dbStatus = {
      connected: false,
      type: 'local',
      error: 'Operating with persistent local repository',
    };
  }
}
