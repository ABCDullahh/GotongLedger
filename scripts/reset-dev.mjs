#!/usr/bin/env node

/**
 * Reset Development Environment
 *
 * This script:
 * 1. Stops all running services
 * 2. Resets the PostgreSQL database
 * 3. Restarts the dev environment
 */

import { execSync, spawn } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const WEB_DIR = path.join(ROOT_DIR, "web");

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
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

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function main() {
  console.log("\n");
  log("╔═══════════════════════════════════════════════╗", colors.magenta);
  log("║        GotongLedger Development Reset         ║", colors.magenta);
  log("╚═══════════════════════════════════════════════╝", colors.magenta);
  console.log("\n");

  try {
    // Step 1: Stop Docker services
    logStep("1/4", "Stopping Docker services...");
    try {
      execSync("docker compose down", { cwd: ROOT_DIR, stdio: "pipe" });
      logSuccess("Docker services stopped");
    } catch (e) {
      logWarning("Docker services were not running");
    }

    // Step 2: Kill any running Hardhat/Next.js processes
    logStep("2/4", "Stopping any running dev processes...");
    try {
      if (process.platform === "win32") {
        try {
          execSync("taskkill /F /IM node.exe /T", { stdio: "pipe" });
        } catch (e) {
          // Ignore - processes might not be running
        }
      } else {
        try {
          execSync("pkill -f 'hardhat node'", { stdio: "pipe" });
        } catch (e) {
          // Ignore
        }
        try {
          execSync("pkill -f 'next dev'", { stdio: "pipe" });
        } catch (e) {
          // Ignore
        }
      }
      logSuccess("Dev processes stopped");
    } catch (e) {
      logWarning("No running processes found");
    }

    // Step 3: Reset PostgreSQL database via Docker
    logStep("3/4", "Resetting PostgreSQL database...");
    try {
      // Drop and recreate the database by restarting the postgres container with a fresh volume
      execSync("docker compose down postgres", { cwd: ROOT_DIR, stdio: "pipe" });
      execSync("docker volume rm 2_postgres_data", { cwd: ROOT_DIR, stdio: "pipe" });
      logSuccess("PostgreSQL data volume removed");
    } catch (e) {
      logWarning("PostgreSQL volume not found or already removed (clean state)");
    }

    // Clear Hardhat deployments
    const hardhatDeployments = path.join(ROOT_DIR, "contracts", "ignition", "deployments");
    if (existsSync(hardhatDeployments)) {
      rmSync(hardhatDeployments, { recursive: true, force: true });
      logSuccess("Hardhat deployments cleared");
    }

    // Step 4: Restart dev environment
    logStep("4/4", "Restarting development environment...");
    log("\n--- Restarting in 2 seconds ---\n", colors.yellow);

    await new Promise((r) => setTimeout(r, 2000));

    // Start the bootstrap script
    const bootstrap = spawn("node", ["scripts/bootstrap-dev.mjs"], {
      cwd: ROOT_DIR,
      stdio: "inherit",
      shell: true,
    });

    bootstrap.on("error", (err) => {
      log(`Failed to restart: ${err.message}`, colors.red);
      process.exit(1);
    });

  } catch (error) {
    log(`\n❌ Reset failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();
