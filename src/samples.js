/* Teks contoh per bahasa suara (kode bahasa dasar). Cadangan: Inggris. */
const SAMPLES = {
  id: "Halo! Ini adalah contoh suara natural yang dibacakan langsung oleh browser Anda.",
  en: "Hello! This is a sample of a natural voice read aloud by your browser.",
  es: "¡Hola! Este es un ejemplo de voz natural leída por tu navegador.",
  fr: "Bonjour ! Voici un exemple de voix naturelle lue par votre navigateur.",
  de: "Hallo! Dies ist ein Beispiel für eine natürliche Stimme, die von Ihrem Browser vorgelesen wird.",
  it: "Ciao! Questo è un esempio di voce naturale letta dal tuo browser.",
  pt: "Olá! Este é um exemplo de voz natural lida pelo seu navegador.",
  nl: "Hallo! Dit is een voorbeeld van een natuurlijke stem die door je browser wordt voorgelezen.",
  ru: "Здравствуйте! Это пример естественного голоса, который читает ваш браузер.",
  ja: "こんにちは！これはブラウザが読み上げる自然な音声のサンプルです。",
  ko: "안녕하세요! 이것은 브라우저가 읽어 주는 자연스러운 음성 샘플입니다.",
  zh: "你好！这是由浏览器朗读的自然语音示例。",
  ar: "مرحبًا! هذا مثال على صوت طبيعي يقرؤه متصفحك.",
  hi: "नमस्ते! यह आपके ब्राउज़र द्वारा पढ़ी गई प्राकृतिक आवाज़ का एक उदाहरण है।",
  tr: "Merhaba! Bu, tarayıcınız tarafından okunan doğal bir sesin örneğidir.",
  pl: "Cześć! To jest przykład naturalnego głosu czytanego przez Twoją przeglądarkę.",
  vi: "Xin chào! Đây là ví dụ về giọng nói tự nhiên do trình duyệt của bạn đọc.",
  th: "สวัสดี! นี่คือตัวอย่างเสียงธรรมชาติที่อ่านโดยเบราว์เซอร์ของคุณ",
  ms: "Helo! Ini ialah contoh suara semula jadi yang dibacakan oleh pelayar anda.",
  jv: "Halo! Iki conto swara alami sing diwaca dening browser sampeyan.",
  su: "Halo! Ieu conto sora alami anu dibacakeun ku browser anjeun.",
};

export const SAMPLE_LANGS = Object.keys(SAMPLES);

export function sampleFor(langTag) {
  const base = (langTag || "en").split(/[-_]/)[0].toLowerCase();
  return SAMPLES[base] || SAMPLES.en;
}
