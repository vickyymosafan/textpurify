import { GoogleGenAI } from "@google/genai";
import { CleaningOptions } from "../types";

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const cleanTextWithGemini = async (text: string, options: CleaningOptions): Promise<string> => {
  if (!text || text.trim().length === 0) return "";
  
  const ai = getAiClient();

  // Build specific instructions based on options
  const rules: string[] = [];

  if (options.normalizeSpaces) {
    rules.push("1. Hapus spasi di awal/akhir baris dan ubah spasi berlebih antar kata menjadi satu spasi.");
  }

  if (options.removeBlankLines) {
    rules.push("2. Hapus baris kosong yang berlebihan (maksimal satu baris kosong sebagai pemisah antar paragraf).");
  }

  if (options.fixBrokenLines) {
    rules.push("3. Gabungkan baris yang terputus secara tidak wajar di tengah kalimat (sering terjadi pada hasil copy-paste PDF). JANGAN gabungkan jika itu adalah item daftar (list) atau awal paragraf baru.");
  }

  if (options.removeSpecialChars) {
    rules.push("4. Hapus karakter non-standar, simbol aneh, atau artifacts yang tidak terbaca.");
  }

  const systemInstruction = `
    Anda adalah mesin pembersih teks (Text Cleaner) yang sangat presisi.
    Tugas utama: Merapikan format teks input berdasarkan aturan di bawah ini.

    ATURAN PEMBERSIHAN (Lakukan yang diminta saja):
    ${rules.join('\n    ')}

    ATURAN MUTLAK (JANGAN DILANGGAR):
    - JANGAN mengubah kata, ejaan, atau struktur kalimat asli.
    - JANGAN meringkas (summarize) atau menulis ulang (rewrite) dengan gaya bahasa lain.
    - Output HARUS teks asli yang sudah diformat ulang.
    - Jika tidak ada perubahan yang diperlukan berdasarkan aturan, kembalikan teks asli apa adanya.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1, // Low temp for fidelity
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Gagal memproses teks. Periksa koneksi atau API Key Anda.");
  }
};