import { useState, useEffect } from "react";

const initBeforeUnLoad = (showExitPrompt) => {
  window.onbeforeunload = (event) => {
    if (showExitPrompt) {
      const e = event || window.event;
      e.preventDefault();
      if (e) {
        e.returnValue = "";
      }
      return "";
    }
  };

  window.onunload = () => {
    if (showExitPrompt) {
      const isConfirmed = window.confirm(
        "You will lose your progress, are you sure want to leave?"
      );
      if (!isConfirmed) {
        return false;
      }
    }
  };
};

// Hook
export default function useExitPrompt(bool) {
  const [showExitPrompt, setShowExitPrompt] = useState(bool);

  window.onload = function () {
    initBeforeUnLoad(showExitPrompt);
  };

  useEffect(() => {
    initBeforeUnLoad(showExitPrompt);
  }, [showExitPrompt]);

  return [showExitPrompt, setShowExitPrompt];
}
