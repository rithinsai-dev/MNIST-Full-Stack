import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-wasm";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from 'public' folder
app.use(express.static("public"));

let model;

// Load the trained model
async function loadModel() {
  await tf.setBackend("wasm"); // Set backend to WASM
  await tf.ready(); // Ensure TensorFlow.js is ready

  // Load model from the public folder
  model = await tf.loadLayersModel("http://localhost:5000/model/model.json");
  console.log("Model loaded!");
}
loadModel();

app.post("/predict", async (req, res) => {
  try {
    if (!model) return res.status(500).json({ error: "Model not loaded yet" });

    let { image } = req.body;
    if (!image || image.length !== 784) return res.status(400).json({ error: "Invalid image data" });

    // Convert grid (1=white, 0=black) to match MNIST format (1=black, 0=white)
    image = image.map(pixel => 1 - pixel);  

    // Reshape and normalize the image (Ensuring it's [0,1] range)
    const tensor = tf.tensor(image, [1, 28, 28, 1]).div(tf.scalar(1.0));

    // Resize to 32x32 and crop to center (for better alignment with MNIST input)
    const paddedTensor = tf.image.resizeBilinear(tensor, [32, 32]).slice([2, 2, 0], [28, 28, 1]);

    // Get raw prediction from model (tensor)
    const prediction = model.predict(paddedTensor);

    // Log the raw prediction tensor for debugging
    console.log("Raw Prediction Tensor: ", prediction);

    // Convert the prediction tensor to an array
    const predArray = await prediction.array();
    console.log("Prediction Array: ", predArray);

    // Ensure the prediction array has valid values
    if (!Array.isArray(predArray) || !predArray[0]) {
      return res.status(500).json({ error: "Invalid prediction array returned by the model" });
    }

    // Extract predicted digit and confidence (max value and index)
    const predictedDigit = predArray[0].indexOf(Math.max(...predArray[0])); // Get max index
    const confidence = predArray[0][predictedDigit]; 
    console.log(confidence);// Confidence from max value

    console.log(`Predicted Digit: ${predictedDigit} with confidence: ${confidence}`);

    // Check if confidence is NaN and return an error
    if (isNaN(confidence)) {
      return res.status(500).json({ error: "Confidence is NaN" });
    }

    res.json({ prediction: predictedDigit, confidence });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
