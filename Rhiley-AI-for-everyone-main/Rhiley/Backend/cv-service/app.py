from flask import Flask, request, jsonify
import cv2
import numpy as np
import os

app = Flask(__name__)

@app.route('/detect', methods=['POST'])
def detect_layout():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Read image
        filestr = file.read()
        nparr = np.frombuffer(filestr, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({'error': 'Invalid image'}), 400
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter small contours
        min_area = 10000  # Minimum area threshold
        blocks = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > min_area:
                x, y, w, h = cv2.boundingRect(contour)
                blocks.append({
                    'x': int(x),
                    'y': int(y),
                    'width': int(w),
                    'height': int(h)
                })
        
        # Sort by Y coordinate (top to bottom)
        blocks.sort(key=lambda b: b['y'])
        
        return jsonify({'blocks': blocks})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
