import React from "react";
import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import { ArchiveOcellusApp } from "./ArchiveOcellusApp";
import { FightApp } from "./FightApp";

// Vercel Web Analytics: cookieless page views, only on the deployed site.
if (process.env.NODE_ENV === "production") inject({ mode: "production" });

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

// The full four-phase fight by default; ?mode=p4drill keeps the original phase 4 drill.
const mode = new URL(window.location.href).searchParams.get("mode");
createRoot(root).render(React.createElement(mode === "p4drill" ? ArchiveOcellusApp : FightApp));
