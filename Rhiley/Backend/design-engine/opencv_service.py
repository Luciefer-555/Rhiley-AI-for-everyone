import cv2
import numpy as np
import json
from flask import Flask, request, jsonify
from sklearn.cluster import KMeans

app = Flask(__name__)

def rgb_to_hex(r, g, b):
    return "#" + "".join(f"{x:02x}" for x in [r, g, b])

def extract_dominant_colors(image, k=5):
    pixels = []
    h, w = image.shape[:2]
    for y in range(0, h, 10):
        for x in range(0, w, 10):
            b, g, r = image[y, x]
            pixels.append([r, g, b])
    
    if len(pixels) < k:
        return ["#000000"] * k
    
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(pixels)
    
    colors = []
    for center in kmeans.cluster_centers_:
        hex_color = rgb_to_hex(int(center[0]), int(center[1]), int(center[2]))
        colors.append(hex_color)
    
    return colors

def is_inside(inner, outer):
    return (
        inner['x'] >= outer['x'] and
        inner['y'] >= outer['y'] and
        inner['x'] + inner['width'] <= outer['x'] + outer['width'] and
        inner['y'] + inner['height'] <= outer['y'] + outer['height']
    )

def merge_vertical_blocks(blocks):
    # Sort by Y coordinate
    blocks.sort(key=lambda b: b["y"])
    
    merged = []
    
    for block in blocks:
        if len(merged) == 0:
            merged.append(block)
            continue
        
        last = merged[-1]
        
        # Calculate vertical overlap
        overlap = min(last["y"] + last["height"], block["y"] + block["height"]) - max(last["y"], block["y"])
        min_height = min(last["height"], block["height"])
        
        # Merge if significant overlap (>40% of min height)
        if overlap > 0.4 * min_height:
            new_y = min(last["y"], block["y"])
            new_bottom = max(last["y"] + last["height"], block["y"] + block["height"])
            
            last["y"] = new_y
            last["height"] = new_bottom - new_y
            last["width"] = max(last["width"], block["width"])
        else:
            merged.append(block)
    
    return merged

def analyze_image(image_path):
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Could not read image")
    
    height, width = image.shape[:2]
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter meaningful layout regions
    total_area = width * height
    min_area = total_area * 0.05  # 5% of total area minimum
    
    blocks = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = w * h
        if area > min_area:
            blocks.append({
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h)
            })
    
    # Sort by area (largest first)
    blocks.sort(key=lambda b: b["width"] * b["height"], reverse=True)
    
    # Remove nested rectangles
    filtered = []
    for i in range(len(blocks)):
        keep = True
        for j in range(len(filtered)):
            if is_inside(blocks[i], filtered[j]):
                keep = False
                break
        if keep:
            filtered.append(blocks[i])
    
    # Merge vertically overlapping blocks
    layout_blocks = merge_vertical_blocks(filtered)
    
    dominant_colors = extract_dominant_colors(image)
    
    return {
        "width": width,
        "height": height,
        "dominantColors": dominant_colors,
        "layoutBlocks": layout_blocks
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        temp_path = "temp_image.jpg"
        file.save(temp_path)
        
        result = analyze_image(temp_path)
        
        import os
        os.remove(temp_path)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)
