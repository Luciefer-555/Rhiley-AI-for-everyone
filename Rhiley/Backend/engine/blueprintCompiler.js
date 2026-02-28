import axios from "axios";

export async function compileBlueprint(perception, vision) {
  const structuralColors = perception.structural_colors || {};
  
  try {
    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "claude-3-sonnet",
      prompt: `You are a deterministic visual structure parser.
Extract layout data from this image analysis and output JSON that strictly matches DesignToCodeBlueprintV1 schema.

PERCEPTION DATA:
${JSON.stringify(structuralColors, null, 2)}

VISION ANALYSIS:
${vision}

OUTPUT ONLY this JSON schema (no explanations, no commentary, no analysis):

{
  "schema_version": "1.0",
  "canvas": {
    "width": 1200,
    "height": 800,
    "background_color": "${structuralColors.background || "#ffffff"}"
  },
  "elements": [
    {
      "id": "header",
      "type": "text",
      "position": {"x": 0.0, "y": 0.0},
      "width": 1200,
      "height": 80,
      "content": "${extractHeaderText(vision)}",
      "styles": {
        "font_size": 24,
        "font_weight": 600,
        "color": "${structuralColors.primary_mass || "#000000"}",
        "background_color": "${structuralColors.background || "#ffffff"}"
      }
    }
  ],
  "relationships": [
    {
      "type": "vertical_stack",
      "elements": ["header"],
      "gap": 0
    }
  ]
}

Rules:
- Output ONLY valid JSON
- If value cannot be determined, set to null
- All measurements numeric
- Positions normalized 0-1 relative to canvas
- Do not add fields outside schema`,
      stream: false,
      timeout: 30000,
      maxContentLength: 1000000
    });

    // Parse JSON response
    let blueprintText = response.data.response.trim();
    
    // Handle potential JSON parsing errors
    let blueprint;
    try {
      blueprint = JSON.parse(blueprintText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      // Return fallback with schema_version
      blueprint = {
        "schema_version": "1.0",
        "canvas": {
          "width": 1200,
          "height": 800,
          "background_color": structuralColors.background || "#ffffff"
        },
        "elements": [
          {
            "id": "container",
            "type": "container",
            "position": {"x": 0.0, "y": 0.0},
            "width": 1200,
            "height": 800,
            "styles": {
              "background_color": structuralColors.background || "#ffffff"
            }
          }
        ],
        "relationships": [
          {
            "type": "vertical_stack",
            "elements": ["container"],
            "gap": 0
          }
        ]
      };
    }
    
    // Add required schema_version for validation
    blueprint.schema_version = "1.0";
    
    return blueprint;
    
  } catch (error) {
    console.error("Claude API error:", error);
    
    // Fallback to basic structure matching strict contract
    return {
      "schema_version": "1.0",
      "canvas": {
        "width": 1200,
        "height": 800,
        "background_color": structuralColors.background || "#ffffff"
      },
      "elements": [
        {
          "id": "container",
          "type": "container",
          "position": {"x": 0.0, "y": 0.0},
          "width": 1200,
          "height": 800,
          "styles": {
            "background_color": structuralColors.background || "#ffffff"
          }
        }
      ],
      "relationships": [
        {
          "type": "vertical_stack",
          "elements": ["container"],
          "gap": 0
        }
      ]
    };
  }
}

function extractHeaderText(vision) {
  // Extract text content from vision analysis
  const textMatch = vision.match(/text|title|heading|header/i);
  if (textMatch) {
    // Look for quoted text in vision
    const quotedText = vision.match(/"([^"]+)"/);
    if (quotedText) {
      return quotedText[1];
    }
  }
  return "Header";
}
