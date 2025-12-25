export interface CleaningOptions {
  normalizeSpaces: boolean;      // Merapikan spasi antar kata
  removeBlankLines: boolean;     // Menghapus baris kosong berlebih
  fixBrokenLines: boolean;       // Menyambung baris terputus (style PDF)
  removeSpecialChars: boolean;   // Menghapus karakter non-standar
}

export interface CleaningState {
  isCleaning: boolean;
  error: string | null;
}
