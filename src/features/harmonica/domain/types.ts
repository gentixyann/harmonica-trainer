export type Breath = "blow" | "draw";

export type HarmonicaNote = {
  hole: number;
  breath: Breath;
  at: number;
  length?: number;
};

export type Song = {
  title: string;
  subtitle: string;
  duration: number;
  notes: HarmonicaNote[];
};
