// Central Configuration for AI Models

const NIM_BASE_URL = process.env.NIM_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NIM_API_KEY = process.env.NVIDIA_API_KEY || "";

const CODING_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const VISION_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
const LIGHT_MODEL = "meta/llama-3.1-8b-instruct";

const MIN_CONTENT_THRESHOLD = 3;

module.exports = {
  NIM_BASE_URL,
  NIM_API_KEY,
  CODING_MODEL,
  VISION_MODEL,
  LIGHT_MODEL,
  MIN_CONTENT_THRESHOLD
};
