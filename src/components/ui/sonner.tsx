"use client";

import { Toaster as Sonner } from "sonner@2.0.3";

const Toaster = () => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      richColors
    />
  );
};

export { Toaster };
