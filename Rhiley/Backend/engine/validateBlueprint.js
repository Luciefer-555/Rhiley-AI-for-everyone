import Ajv from "ajv";
import fs from "fs";

const ajv = new Ajv();
const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DesignToCodeBlueprintV1",
  "type": "object",
  "required": ["schema_version", "canvas", "elements"],
  "properties": {
    "schema_version": {
      "type": "string",
      "enum": ["1.0"]
    },
    "canvas": {
      "type": "object",
      "required": ["width", "height", "background_color"],
      "properties": {
        "width": { "type": "number" },
        "height": { "type": "number" },
        "background_color": { "type": "string" }
      }
    },
    "elements": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "position"],
        "properties": {
          "id": { "type": "string" },
          "type": {
            "type": "string",
            "enum": ["text", "image", "container", "button"]
          },
          "position": {
            "type": "object",
            "required": ["x", "y"],
            "properties": {
              "x": { "type": "number" },
              "y": { "type": "number" }
            }
          },
          "width": { "type": "number" },
          "height": { "type": "number" },
          "content": { "type": "string" },
          "styles": {
            "type": "object",
            "properties": {
              "font_size": { "type": "number" },
              "font_weight": { "type": "number" },
              "color": { "type": "string" },
              "background_color": { "type": "string" }
            }
          }
        }
      }
    },
    "relationships": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "elements"],
        "properties": {
          "type": {
            "type": "string",
            "enum": ["vertical_stack", "horizontal_row", "grid"]
          },
          "elements": {
            "type": "array",
            "items": { "type": "string" }
          },
          "gap": { "type": "number" }
        }
      }
    }
  }
};

const validate = ajv.compile(schema);

function validateBlueprint(data) {
  const valid = validate(data);
  if (!valid) {
    console.error("❌ Blueprint Invalid:");
    console.error(validate.errors);
    process.exit(1);
  }
  console.log("✅ Blueprint Valid");
}

export { validateBlueprint };
