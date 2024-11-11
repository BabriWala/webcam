import { useState, useRef, useEffect } from "react";

function App() {
  const videoRef = useRef(null);
  const processedDisplayRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStream, setCurrentStream] = useState(null);

  const handleCapture = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API not supported by this browser.");
        return;
      }
      console.log("i am hre");
      console.log("i am hre");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCurrentStream(stream);
      videoRef.current.srcObject = stream;
      videoRef.current.style.display = "block"; // Show video for debugging
      console.log("i am hre");

      await videoRef.current.play();
      processedDisplayRef.current.width = videoRef.current.videoWidth;
      processedDisplayRef.current.height = videoRef.current.videoHeight;
      console.log("i am hre");

      setIsProcessing(true);
      processFrames(); // Start frame processing
      console.log("i am hre");

    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const handleClose = () => {
    if (currentStream) {
      setIsProcessing(false);
      currentStream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      videoRef.current.style.display = "none";

      const ctx = processedDisplayRef.current.getContext("2d");
      ctx.clearRect(
        0,
        0,
        processedDisplayRef.current.width,
        processedDisplayRef.current.height
      );
    }
  };

  const processFrames = async () => {
    if (!isProcessing) return;
      console.log("i am hre");

    try {
      console.log("i am hre");

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);

      const imageData = canvas
        .toDataURL("image/png")
        .replace(/^data:image\/(png|jpg);base64,/, "");

      console.log("Sending image data to server...");
      const response = await fetch(
        "https://192.168.0.124:5000/app0/api/predict",
        {
          method: "POST",
          body: JSON.stringify({ image: imageData }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const data = await response.json();
      console.log("Data received:", data);

      const processedImage = new Image();
      processedImage.onload = () => {
        const ctx = processedDisplayRef.current.getContext("2d");
        ctx.clearRect(
          0,
          0,
          processedDisplayRef.current.width,
          processedDisplayRef.current.height
        );
        ctx.drawImage(processedImage, 0, 0);

        if (isProcessing) {
          requestAnimationFrame(processFrames); // Continue processing
        }
      };
      processedImage.src = `data:image/png;base64,${data.image}`;
    } catch (error) {
      console.error("Error in processFrames:", error);
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        style={{ display: "block", width: "100%", maxWidth: "400px" }}
      />
      <button
        onClick={handleCapture}
        style={{ display: isProcessing ? "none" : "inline" }}
      >
        Start Capture
      </button>
      <button
        onClick={handleClose}
        style={{ display: isProcessing ? "inline" : "none" }}
      >
        Close Capture
      </button>
      <div id="videoContainer">
        <canvas
          ref={processedDisplayRef}
          style={{ display: "block", marginTop: "20px" }}
        />
      </div>
    </div>
  );
}

export default App;
