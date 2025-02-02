import { useRef, useState, useEffect } from "react";

const DigitCanvas = ({ onPredict }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [confidence, setConfidence] = useState(null); // State to hold confidence
  const [predictedDigit, setPredictedDigit] = useState(null); // Store predicted digit

  const gridSize = 28; // 28x28 grid
  const pixelSize = 20; // Size of each pixel

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white"; // Set background to white (for better contrast)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black"; // Drawing color
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
  }, []);

  const startDrawing = (e) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const { offsetX, offsetY } = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { offsetX, offsetY } = getMousePos(e);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillRect(0, 0, 280, 280); // Clear the canvas
    setConfidence(null); // Reset confidence
    setPredictedDigit(null); // Reset predicted digit
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };
  };

  const getImageData = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Resize image to 28x28 and get grayscale pixel data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext("2d");

    // Draw and resize the image
    tempCtx.drawImage(canvas, 0, 0, 28, 28);

    // Convert to grayscale
    const imageData = tempCtx.getImageData(0, 0, 28, 28);
    const pixels = Array.from(imageData.data);

    let grayscale = [];
    for (let i = 0; i < pixels.length; i += 4) {
      // Convert RGB to grayscale: 0.3*R + 0.59*G + 0.11*B
      let gray = (pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11);
      grayscale.push(gray / 255); // Normalize to [0,1]
    }

    return grayscale;
  };

  const handlePredict = async () => {
    const imageData = getImageData();
  
    const response = await fetch("http://localhost:5000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData }),
    });
  
    const result = await response.json();
  
    // Ensure the result contains valid prediction and confidence
    if (result.error) {
      console.error(result.error);
      setPredictedDigit(null);
      setConfidence("Uncertain");
    } else {
      const predictedDigit = result.prediction;
      let confidence = result.confidence;
  
      // Check if confidence is NaN and handle gracefully
      if (isNaN(confidence)) {
        confidence = "Uncertain";
      }
  
      setPredictedDigit(predictedDigit);
      setConfidence(confidence); // Update confidence state
      onPredict(predictedDigit, confidence);
    }
  };
  
  

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        className="border-2 border-gray-300 bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-2">
        <button onClick={clearCanvas} className="px-4 py-2 bg-red-500 text-white rounded">
          Clear
        </button>
        <button onClick={handlePredict} className="px-4 py-2 bg-blue-500 text-white rounded">
          Predict
        </button>
      </div>

      {/* Display Prediction and Confidence */}
      {confidence !== null && (
        <div className="mt-4">
          <p>Prediction: {predictedDigit}</p>
          <p>Confidence: { confidence }%</p> {/* Display confidence as a percentage */}
        </div>
      )}
    </div>
  );
};

export default DigitCanvas;
