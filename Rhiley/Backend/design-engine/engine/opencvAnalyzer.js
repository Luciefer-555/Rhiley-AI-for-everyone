const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

async function analyzeImage(imagePath) {
  try {
    console.log("OpenCV: Analyzing image:", imagePath);
    
    // Create form data
    const formData = new FormData();
    formData.append("image", fs.createReadStream(imagePath), {
      filename: "image.jpg",
      contentType: "image/jpeg"
    });

    // Send to Python OpenCV service
    const response = await axios.post(
      "http://localhost:5003/analyze",
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000
      }
    );

    if (!response.data) {
      throw new Error("No response from OpenCV service");
    }

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    console.log("OpenCV: Analysis completed");
    return response.data;

  } catch (error) {
    console.error("OpenCV: Analysis failed:", error.message);
    throw error;
  }
}

module.exports = { analyzeImage };
