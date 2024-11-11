import { useState, useRef, useEffect } from "react";

function App() {
  const videoRef = useRef(null);
  const processedDisplayRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStream, setCurrentStream] = useState(null);

  // Function to start attendance and initiate frame capture
  const handleStartAttendance = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera API not supported by this browser.");
        return;
      }

      // Access the camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCurrentStream(stream);
      videoRef.current.srcObject = stream;

      // Hide the video feed and prepare the canvas for processed images
      videoRef.current.style.display = "none";
      processedDisplayRef.current.width = videoRef.current.videoWidth;
      processedDisplayRef.current.height = videoRef.current.videoHeight;

      // Start processing frames
      setIsProcessing(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  // Function to end attendance and stop camera stream
  const handleEndAttendance = () => {
    if (currentStream) {
      setIsProcessing(false);
      currentStream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;

      // Clear the canvas when stopping
      const ctx = processedDisplayRef.current.getContext("2d");
      ctx.clearRect(0, 0, processedDisplayRef.current.width, processedDisplayRef.current.height);
    }
  };

  // Function to process frames: Capture images and send to API
  const processFrames = async () => {
    if (!isProcessing || !videoRef.current) return;

    try {
      // Create canvas and draw video frame onto it
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert the frame to base64
      const imageData = canvas.toDataURL("image/png").replace(/^data:image\/(png|jpg);base64,/, "");

      // Send image data to the server
      const response = await fetch("https://192.168.0.124:5000/app0/api/predict", {
        method: "POST",
        body: JSON.stringify({ image: imageData }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      // Processed image received from the API
      const data = await response.json();
      const processedImage = new Image();
      processedImage.onload = () => {
        const ctx = processedDisplayRef.current.getContext("2d");
        ctx.clearRect(0, 0, processedDisplayRef.current.width, processedDisplayRef.current.height);
        ctx.drawImage(processedImage, 0, 0);

        // Continue processing if still active
        if (isProcessing) {
          requestAnimationFrame(processFrames); // Continue frame processing
        }
      };
      processedImage.src = `data:image/png;base64,${data.image}`;
    } catch (error) {
      console.error("Error in processFrames:", error);
    }
  };

  // useEffect to handle frame processing continuously when isProcessing is true
  useEffect(() => {
    if (isProcessing) {
      processFrames(); // Start processing when isProcessing becomes true
    }
    // Cleanup on unmount or when processing stops
    return () => {
      setIsProcessing(false);
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;

      // Clear canvas
      const ctx = processedDisplayRef.current.getContext("2d");
      ctx.clearRect(0, 0, processedDisplayRef.current.width, processedDisplayRef.current.height);
    };
  }, [isProcessing]); // Re-run the effect when isProcessing changes

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold text-center mb-4">Attendance Monitoring</h1>

        {/* Canvas to display the processed image */}
        <div className="flex justify-center mb-4">
          <canvas
            ref={processedDisplayRef}
            className="border border-gray-300 shadow-sm"
          />
        </div>

        {/* Buttons to start and end attendance */}
        <div className="flex justify-between">
          <button
            onClick={handleStartAttendance}
            className={`px-6 py-3 bg-blue-500 text-white rounded-md transition-all duration-300 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isProcessing}
          >
            Start Attendance
          </button>

          <button
            onClick={handleEndAttendance}
            className={`px-6 py-3 bg-red-500 text-white rounded-md transition-all duration-300 ${!isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isProcessing}
          >
            End Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
    
