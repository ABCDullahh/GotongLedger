#!/usr/bin/env node

/**
 * Bootstrap Development Environment
 *
 * This script orchestrates the startup of all development services:
 * 1. Check Docker availability
 * 2. Start IPFS + PostgreSQL via Docker Compose
 * 3. Start Hardhat node
 * 4. Wait for RPC to be ready
 * 5. Deploy contracts
 * 6. Run Prisma migrations
 * 7. Start Next.js dev server
 */

import { spawn, execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const CONTRACTS_DIR = path.join(ROOT_DIR, "contracts");
const WEB_DIR = path.join(ROOT_DIR, "web");

// Check for --mobile flag
const MOBILE_MODE = process.argv.includes("--mobile");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Check if Docker is available
function checkDocker() {
  logStep("1/7", "Checking Docker availability...");
  try {
    execSync("docker --version", { stdio: "pipe" });
    execSync("docker compose version", { stdio: "pipe" });
    logSuccess("Docker is available");
    return true;
  } catch (error) {
    logError("Docker is not available!");
    log(
      "\nPlease install Docker Desktop from https://www.docker.com/products/docker-desktop",
      colors.yellow
    );
    log("IPFS requires Docker to run locally.\n", colors.yellow);
    return false;
  }
}

// Start IPFS + PostgreSQL via Docker Compose
async function startDockerServices() {
  logStep("2/7", "Starting IPFS + PostgreSQL via Docker Compose...");

  return new Promise((resolve, reject) => {
    const docker = spawn("docker", ["compose", "up", "-d", "ipfs", "postgres"], {
      cwd: ROOT_DIR,
      stdio: "inherit",
      shell: true,
    });

    docker.on("close", (code) => {
      if (code === 0) {
        logSuccess("IPFS + PostgreSQL started");
        resolve();
      } else {
        logError("Failed to start Docker services");
        reject(new Error("Docker services startup failed"));
      }
    });

    docker.on("error", reject);
  });
}

// Start Hardhat node
function startHardhatNode() {
  logStep("3/7", "Starting Hardhat node...");

  const hardhat = spawn("npx", ["hardhat", "node"], {
    cwd: CONTRACTS_DIR,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  hardhat.stdout.on("data", (data) => {
    const output = data.toString();
    // Only log important messages
    if (
      output.includes("Started HTTP") ||
      output.includes("Hardhat Network")
    ) {
      log(output.trim(), colors.blue);
    }
  });

  hardhat.stderr.on("data", (data) => {
    const output = data.toString();
    if (!output.includes("ExperimentalWarning")) {
      console.error(output);
    }
  });

  hardhat.on("error", (err) => {
    logError(`Hardhat node error: ${err.message}`);
  });

  return hardhat;
}

// Wait for RPC to be ready
async function waitForRPC(url = "http://127.0.0.1:8545", timeout = 30000) {
  logStep("4/7", "Waiting for Hardhat RPC to be ready...");

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        }),
      });

      if (response.ok) {
        logSuccess("Hardhat RPC is ready");
        return true;
      }
    } catch (error) {
      // RPC not ready yet, wait and retry
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error("Timeout waiting for Hardhat RPC");
}

// Deploy contracts
async function deployContracts() {
  logStep("5/7", "Deploying contracts...");

  return new Promise((resolve, reject) => {
    const deploy = spawn(
      "npx",
      ["hardhat", "run", "scripts/deploy.ts", "--network", "localhost"],
      {
        cwd: CONTRACTS_DIR,
        stdio: "inherit",
        shell: true,
      }
    );

    deploy.on("close", (code) => {
      if (code === 0) {
        // Verify contracts.ts was generated
        const contractsPath = path.join(WEB_DIR, "src/lib/contracts.ts");
        if (existsSync(contractsPath)) {
          logSuccess("Contracts deployed and ABI exported");
          resolve();
        } else {
          logError("contracts.ts was not generated");
          reject(new Error("Contract export failed"));
        }
      } else {
        logError("Contract deployment failed");
        reject(new Error("Deployment failed"));
      }
    });

    deploy.on("error", reject);
  });
}

// Run Prisma migrations
async function runPrismaMigrations() {
  logStep("6/7", "Running Prisma migrations...");

  return new Promise((resolve, reject) => {
    const prisma = spawn("npx", ["prisma", "db", "push"], {
      cwd: WEB_DIR,
      stdio: "inherit",
      shell: true,
      env: { ...process.env },
    });

    prisma.on("close", (code) => {
      if (code === 0) {
        logSuccess("Database ready");
        resolve();
      } else {
        logError("Prisma migration failed");
        reject(new Error("Prisma migration failed"));
      }
    });

    prisma.on("error", reject);
  });
}

// Start Next.js dev server
function startNextJS() {
  logStep("7/7", "Starting Next.js dev server...");

  const args = MOBILE_MODE ? ["next", "dev", "-H", "0.0.0.0"] : ["next", "dev"];

  const next = spawn("npx", args, {
    cwd: WEB_DIR,
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });

  next.on("error", (err) => {
    logError(`Next.js error: ${err.message}`);
  });

  return next;
}

// Main execution
async function main() {
  console.log("\n");
  log("╔═══════════════════════════════════════════════╗", colors.magenta);
  log("║        GotongLedger Development Setup         ║", colors.magenta);
  log("╚═══════════════════════════════════════════════╝", colors.magenta);
  console.log("\n");

  let hardhatProcess = null;
  let nextProcess = null;

  // Handle cleanup on exit
  const cleanup = () => {
    log("\n\nShutting down...", colors.yellow);

    if (hardhatProcess) {
      hardhatProcess.kill("SIGTERM");
    }
    if (nextProcess) {
      nextProcess.kill("SIGTERM");
    }

    // Stop IPFS
    try {
      execSync("docker compose down", { cwd: ROOT_DIR, stdio: "pipe" });
    } catch (e) {
      // Ignore errors during cleanup
    }

    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    // Step 1: Check Docker
    if (!checkDocker()) {
      logWarning("Continuing without IPFS/PostgreSQL. File uploads and database will not work.");
    } else {
      // Step 2: Start IPFS + PostgreSQL
      await startDockerServices();
    }

    // Step 3: Start Hardhat node
    hardhatProcess = startHardhatNode();

    // Step 4: Wait for RPC
    await waitForRPC();

    // Step 5: Deploy contracts
    await deployContracts();

    // Step 6: Run Prisma migrations
    await runPrismaMigrations();

    // Step 7: Start Next.js
    nextProcess = startNextJS();

    console.log("\n");
    log("═══════════════════════════════════════════════", colors.green);
    logSuccess("All services are running!");
    log("═══════════════════════════════════════════════", colors.green);

    if (MOBILE_MODE) {
      console.log(`
📱 Web App:    http://localhost:3000
📱 Mobile:     http://0.0.0.0:3000 (use your computer's IP)
⛓️  RPC:        http://127.0.0.1:8545
📦 IPFS API:   http://127.0.0.1:5001
🌐 IPFS GW:    http://127.0.0.1:8080

💡 To access from mobile, use: http://<YOUR_IP>:3000
   Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)

Press Ctrl+C to stop all services
      `);
    } else {
      console.log(`
📱 Web App:    http://localhost:3000
⛓️  RPC:        http://127.0.0.1:8545
📦 IPFS API:   http://127.0.0.1:5001
🌐 IPFS GW:    http://127.0.0.1:8080

Press Ctrl+C to stop all services
      `);
    }
  } catch (error) {
    logError(`Bootstrap failed: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

main();
