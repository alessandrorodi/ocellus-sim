import React from "react";
import { createRoot } from "react-dom/client";
import { ArchiveOcellusApp } from "./ArchiveOcellusApp";
import { FightApp } from "./FightApp";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

// The full four-phase fight by default; ?mode=p4drill keeps the original phase 4 drill.
const mode = new URL(window.location.href).searchParams.get("mode");
createRoot(root).render(React.createElement(mode === "p4drill" ? ArchiveOcellusApp : FightApp));
