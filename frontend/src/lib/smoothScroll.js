import { createContext, useContext } from "react";

// Shared across index.js (creates the instance) and any component that
// needs to trigger a programmatic scroll (App.js's nav links,
// CaseStudyPage.js's route-change reset) via lenis.scrollTo(...).
export const LenisContext = createContext(null);

export const useLenis = () => useContext(LenisContext);
