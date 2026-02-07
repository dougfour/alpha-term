#!/usr/bin/env node
// CLI entry point - wraps the TypeScript CLI module
// This file is used by pkg to create standalone binaries

// Use require instead of import for pkg compatibility
const path = require("path");

// Get the directory where this script is located
const __dirname = path.dirname(require.main?.filename || __filename);

// Import the CLI module
const cli = require("../dist/cli.js");
