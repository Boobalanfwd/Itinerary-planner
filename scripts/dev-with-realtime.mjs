import { spawn } from "node:child_process";

const children = [];
let shuttingDown = false;

function stopAll(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 250);
}

function start(label, args) {
  const child = spawn("npm", args, { stdio: "inherit", env: process.env });
  children.push(child);
  child.on("error", (error) => {
    console.error(`[${label}] failed to start:`, error);
    stopAll(1);
  });
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.log(`[${label}] exited (${signal || code})`);
      stopAll(code || 0);
    }
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
start("realtime", ["run", "realtime"]);
start("next", ["run", "dev:next"]);
