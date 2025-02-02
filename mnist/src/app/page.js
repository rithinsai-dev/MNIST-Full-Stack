"use client";
import { useState } from "react";
import DigitCanvas from "./components/DigitCanvas";

export default function Home() {
  const [prediction, setPrediction] = useState(null);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h1 className="text-2xl font-bold">Draw a Digit (0-9)</h1>
      <DigitCanvas onPredict={setPrediction} />
      {prediction !== null && (
        <p className="text-xl">Prediction: <strong>{prediction}</strong></p>
      )}
    </div>
  );
}
