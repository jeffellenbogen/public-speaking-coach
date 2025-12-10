
export interface StructuredFeedback {
  overallImpression: string;
  bodyLanguageAndPosture: string;
  gesturesAndHandMovement: string;
  vocalVarietyAndPacing: string;
  clarityAndArticulation: string;
  contentAndStructure: string;
  actionableSummary: string[];
}

export interface FileData {
    mimeType: string;
    data: string;
    name: string;
}
