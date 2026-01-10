Implementation Plan: Electron Proof of Concept (PoC)
This plan outlines the steps to transform the SmartLab-V6 web application into a desktop-capable version using Electron. This PoC will focus on providing a desktop shell that loads the local development environment and can be packaged into a Windows .exe.

User Review Required
IMPORTANT

The PoC will initially rely on the Next.js server running in the background (either locally or in cloud). A fully standalone .exe that embeds the server requires a different build approach (Next.js Standalone) which will be explored after the PoC.

Proposed Changes
1. Build & Dependencies
Integrate Electron and its build tools into the existing project.

[MODIFY] 
package.json
Add electron, electron-is-dev to devDependencies.
Add electron-builder for packaging.
Add scripts:
"electron:dev": "electron ."
"electron:build": "next build && electron-builder"
2. Desktop Core
Establish the main entry point for the desktop application.

[NEW] 
main.js
 (Proposed)
Initialize the Electron BrowserWindow.
Configure webPreferences for optimal security and interop.
Handle different environments (Dev vs. Prod).
Implement a custom title bar strategy or window frame.
3. Application Entry
Identify the main entry for the desktop app.

[NEW] 
app/desktop-entry.js
Handle any desktop-specific initialization (e.g., local logs, native crash reports).
Verification Plan
Manual Verification
Run npm run dev to start the Next.js server.
Run npm run electron:dev in a separate terminal.
Verify that the SmartLab UI appears in a separate native Windows window.
Test basic navigation and authentication via Supabase.
Verify that external links (e.g., help docs) open in the system's default browser.
