function getPromptTier(sourceTag) {
  return sourceTag === "inferred_default" ? "inferred" : "direct";
}

function getImageTier(sourceTag) {
  return sourceTag === "ocr_read" ? "direct" : "inferred";
}

function mergeField(field, pVal, iVal, pTag, iTag, conflictsArray) {
  const pTier = getPromptTier(pTag);
  const iTier = getImageTier(iTag);

  if (pTier === "direct" && iTier === "inferred") return { value: pVal, tag: pTag };
  if (iTier === "direct" && pTier === "inferred") return { value: iVal, tag: iTag };

  if (pTier === "direct" && iTier === "direct") {
    if (JSON.stringify(pVal) !== JSON.stringify(iVal)) {
      conflictsArray.push({ field, promptValue: pVal, imageValue: iVal, resolution: "kept_prompt" });
    }
    return { value: pVal, tag: pTag }; // prompt wins
  }

  // both inferred
  if (pTier === "inferred" && iTier === "inferred") {
    const visualFields = ["colorPalette", "designStyle", "layout", "motionPreset"];
    if (visualFields.includes(field)) {
      return { value: iVal, tag: iTag };
    } else {
      return { value: pVal, tag: pTag };
    }
  }

  // fallback
  return { value: pVal, tag: pTag };
}

function mergeSection(pSec, iSec, conflictsArray) {
  const merged = { type: pSec.type };
  
  const pSecTag = pSec.source;
  const iSecTag = iSec.source;

  if (pSec.purpose !== undefined || iSec.purpose !== undefined) {
    const purposeMerge = mergeField("purpose", pSec.purpose, iSec.purpose, pSecTag, iSecTag, conflictsArray);
    if (purposeMerge.value !== undefined) merged.purpose = purposeMerge.value;
  }

  // Section source tag should reflect the merged state or the winning root source?
  // We'll preserve it on individual fields to be safe. We can also set a base source.
  const sourceMerge = mergeField("source", pSec.source, iSec.source, pSecTag, iSecTag, []);
  if (sourceMerge.value !== undefined) merged.source = sourceMerge.value;

  merged.content = {};
  
  const pContent = pSec.content || {};
  const iContent = iSec.content || {};
  const allKeys = new Set([...Object.keys(pContent), ...Object.keys(iContent)]);
  
  for (const key of allKeys) {
    if (key.endsWith("_source")) continue;

    const pVal = pContent[key];
    const iVal = iContent[key];
    
    const pTag = pContent[key + "_source"] || pSecTag;
    const iTag = iContent[key + "_source"] || iSecTag;

    if (pVal !== undefined && iVal !== undefined) {
      const fieldMerge = mergeField(key, pVal, iVal, pTag, iTag, conflictsArray);
      merged.content[key] = fieldMerge.value;
      if (fieldMerge.tag) {
         merged.content[key + "_source"] = fieldMerge.tag;
      }
    } else if (pVal !== undefined) {
      merged.content[key] = pVal;
      if (pTag) merged.content[key + "_source"] = pTag;
    } else if (iVal !== undefined) {
      merged.content[key] = iVal;
      if (iTag) merged.content[key + "_source"] = iTag;
    }
  }

  return merged;
}

function mergeBlueprints(promptBlueprint, imageBlueprint, route) {
  const conflicts = [];
  const merged = {};
  
  const rootKeys = new Set([...Object.keys(promptBlueprint), ...Object.keys(imageBlueprint)]);
  rootKeys.delete("sections");
  rootKeys.delete("conflicts");

  const isVague = route === "hybrid_image_vague";

  for (const key of rootKeys) {
    const pVal = promptBlueprint[key];
    const iVal = imageBlueprint[key];
    
    // In vague mode, root visual attributes are inferred by default
    let pRootTag = undefined;
    if (isVague && ["layout", "designStyle", "colorPalette", "motionPreset"].includes(key)) {
      pRootTag = "inferred_default";
    }

    if (pVal !== undefined && iVal !== undefined) {
      const res = mergeField(key, pVal, iVal, pRootTag, undefined, conflicts);
      merged[key] = res.value;
    } else if (pVal !== undefined) {
      merged[key] = pVal;
    } else if (iVal !== undefined) {
      merged[key] = iVal;
    }
  }

  const mergedSections = [];
  const pSections = [...(promptBlueprint.sections || [])];
  const iSections = [...(imageBlueprint.sections || [])];

  for (let i = 0; i < pSections.length; i++) {
    const pSec = pSections[i];
    if (!pSec) continue;

    let matchedIdx = -1;
    if (pSec.purpose) {
      matchedIdx = iSections.findIndex(iSec => iSec && iSec.purpose === pSec.purpose);
    }
    
    // If no match by purpose, try type.
    if (matchedIdx === -1 && pSec.type) {
      matchedIdx = iSections.findIndex(iSec => iSec && iSec.type === pSec.type && !iSec.purpose);
    }

    if (matchedIdx !== -1) {
      const iSec = iSections[matchedIdx];
      mergedSections.push(mergeSection(pSec, iSec, conflicts));
      pSections[i] = null;
      iSections[matchedIdx] = null;
    } else {
      mergedSections.push(pSec);
      pSections[i] = null;
    }
  }

  for (const iSec of iSections) {
    if (iSec) {
      mergedSections.push(iSec);
    }
  }

  merged.sections = mergedSections;
  merged.conflicts = conflicts;
  
  return merged;
}

module.exports = { mergeBlueprints };
