type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  functionName?: string;
  meta?: Record<string, any>;
  timestamp?: string;
}

function formatEntry(level: LogLevel, message: string, functionName?: string, meta?: Record<string, any>): string {
  const entry: LogEntry = {
    level,
    message,
    functionName,
    meta,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(entry);
}

export const log = {
  info: (message: string, functionName?: string, meta?: Record<string, any>) => {
    console.log(formatEntry("info", message, functionName, meta));
  },
  warn: (message: string, functionName?: string, meta?: Record<string, any>) => {
    console.warn(formatEntry("warn", message, functionName, meta));
  },
  error: (message: string, functionName?: string, meta?: Record<string, any>) => {
    console.error(formatEntry("error", message, functionName, meta));
  },
  debug: (message: string, functionName?: string, meta?: Record<string, any>) => {
    console.debug(formatEntry("debug", message, functionName, meta));
  },
};


// how to use example:
// log("warn", "No user data found", "onUserCreated", { params: event.params });
// log("error", "Missing email in new user document", "onUserCreated", { user });
