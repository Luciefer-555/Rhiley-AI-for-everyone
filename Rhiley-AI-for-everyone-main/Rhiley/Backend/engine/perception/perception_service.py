import cv2
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

def dominant_color(region):
    pixels = region.reshape((-1, 3))
    pixels = np.float32(pixels)

    _, labels, palette = cv2.kmeans(
        pixels,
        3,
        None,
        (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2),
        10,
        cv2.KMEANS_RANDOM_CENTERS
    )

    _, counts = np.unique(labels, return_counts=True)
    dominant = palette[np.argmax(counts)]

    return "#{:02x}{:02x}{:02x}".format(
        int(dominant[2]),
        int(dominant[1]),
        int(dominant[0])
    )

@app.route("/analyze", methods=["POST"])
def analyze():
    file = request.files["image"]
    img = cv2.imdecode(
        np.frombuffer(file.read(), np.uint8),
        cv2.IMREAD_COLOR
    )

    height, width, _ = img.shape

    # Top region (likely title area)
    top_region = img[0:int(height * 0.25), :]
    background_color = dominant_color(top_region)

    # Center region (likely subject)
    center_region = img[int(height*0.3):int(height*0.7),
                        int(width*0.3):int(width*0.7)]
    primary_color = dominant_color(center_region)

    return jsonify({
        "structural_colors": {
            "background": background_color,
            "primary_mass": primary_color
        }
    })

if __name__ == "__main__":
    app.run(port=5001)
