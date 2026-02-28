const products = [
  {
    id: "lamp_01",
    type: "lamp",
    style: ["cozy", "warm"],
    price: 3999,
    source: "IKEA",
    reason: "Soft light balances darker furniture"
  },
  {
    id: "rug_01",
    type: "rug",
    style: ["cozy"],
    price: 5999,
    source: "Urban Ladder",
    reason: "Anchors the bed and adds warmth"
  }
]

export function cozyNarrator(engineOutput) {
  const { intent = {}, issues = [], decision = {} } = engineOutput

  const summary =
    "This bedroom already feels calm and comfortable. " +
    "The layout supports rest, and the overall mood feels warm and relaxed."

  const whyItWorks = [
    "The bed placement keeps the room visually grounded.",
    "Warm tones help the space feel restful rather than busy."
  ]

  const suggestions = []

  for (const issue of issues) {
    if (issue.type === "visual_imbalance") {
      suggestions.push(
        "Adding a warm floor lamp near the lighter side can help balance the room visually."
      )
    }
  }

  const confidenceMap = {
    looks_good: "Looks good as it is.",
    small_refinements: "Small refinements could make it even better.",
    needs_rethink: "Some changes may be worth considering."
  }

  return {
    summary,
    whyItWorks,
    suggestions: suggestions.slice(0, 2),
    confidence: confidenceMap[decision.mode] || "Looks good as it is."
  }
}

export function recommendProducts(engineOutput) {
  const { intent = {}, issues = [] } = engineOutput
  const style = intent.style || []

  const recommendations = []

  for (const issue of issues) {
    if (issue.type === "visual_imbalance") {
      const lamp = products.find(
        p => p.type === "lamp" && p.style.some(s => style.includes(s))
      )

      if (lamp) {
        recommendations.push(lamp)
      }
    }
  }

  return recommendations.slice(0, 2)
}

export default function runCozy(engineOutput) {
  const narration = cozyNarrator(engineOutput)
  const products = recommendProducts(engineOutput)

  return {
    narration,
    products
  }
}
