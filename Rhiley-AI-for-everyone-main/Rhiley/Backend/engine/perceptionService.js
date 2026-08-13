import axios from "axios";
import FormData from "form-data";

export async function analyzeWithOpenCV(imageBuffer) {
  const form = new FormData();
  form.append("image", imageBuffer, {
    filename: 'image.jpg',
    contentType: 'image/jpeg'
  });

  const response = await axios.post(
    "http://localhost:5001/analyze",
    form,
    { headers: form.getHeaders() }
  );

  return response.data;
}
