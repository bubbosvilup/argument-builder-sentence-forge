export type ModuleId = 'stance' | 'precision' | 'hedge' | 'reason' | 'consequence' | 'example' | 'contrast' | 'counterargument' | 'rebuttal' | 'conclusion';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type Quality = { specificity: number; logic: number; support: number; nuance: number };
export type TopicPack = {
  id: string; title: string; question: string; basicSubject: string; preciseSubject: string; predicate: string;
  stance: string; hedge: string; reason: string; consequence: string; example: string; concession: string;
  counterargument: string; rebuttal: string; conclusion: string;
};
export type Segment = { id: ModuleId | 'claim'; label: string; text: string; breakBefore?: boolean };
