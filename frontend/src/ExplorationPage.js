import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ExplorationAvatar from "./components/exploration/ExplorationAvatar";
import ExplorationVectorAvatar from "./components/exploration/ExplorationVectorAvatar";
import { EXPLORATION } from "./constants/testIds";
import "./App.css";

/* /exploration — reached only from the navbar. An empty canvas with the
   avatar on it, always on the paper theme's background.

   The page pins the document to the paper theme while it's open (so the back
   link, focus ring and avatar all use paper colours on the paper background)
   and puts the visitor's own theme back when they leave. It only touches
   data-theme, never the saved preference in localStorage. */
export default function ExplorationPage() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    const previousTitle = document.title;
    root.dataset.theme = "paper";
    document.title = "Exploration · Eshani Somwanshi";
    window.scrollTo(0, 0);
    return () => {
      if (previous) root.dataset.theme = previous;
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="exploration-page" data-testid={EXPLORATION.page}>
      <h1 className="sr-only">Exploration</h1>
      <Link to="/" className="cs-back exploration-back" data-testid={EXPLORATION.backLink}>
        <ArrowLeft size={15} /> Home
      </Link>
      {/* Side by side while the vector rebuild is in progress. */}
      <div className="exploration-compare">
        <figure className="exploration-stage" data-testid={EXPLORATION.avatar}>
          <ExplorationAvatar size={560} theme="paper" />
          <figcaption>3D image</figcaption>
        </figure>
        <figure className="exploration-stage">
          <ExplorationVectorAvatar size={560} />
          <figcaption>Vector, from the 2D drawing</figcaption>
        </figure>
      </div>
    </main>
  );
}
