# التوليد الإجرائي للأصوات والمؤثرات البصرية (Procedural Audio & VFX)

> اختصار حجم اللعبة من 30 ميجابايت إلى أقل من 5 ميجابايت عبر توليد الأصوات والـ Shaders برمجياً دون ملفات خارجية.

---

## 1. التوليد الصوتي الإجرائي الفوري (ZzFX Micro-Synth)
بدلاً من تحميل وتشفير عشرات ملفات الـ MP3 و الـ WAV الضخمة داخل ملف الـ HTML، نستخدم مولد الذبذبات الصوتي الإجرائي المدمج عبر `Web Audio API`:

```javascript
// مولد أصوات ZzFX فائق الخفة (حجمه أقل من 1KB كود صافٍ)
const AudioEngine = {
  ctx: null,
  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  playSwordSlash() {
    if (!this.ctx) this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  },
  playHitImpact() {
    if (!this.ctx) this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
};
```

---

## 2. المؤثرات البصرية عبر الـ Mesh والـ Shaders (Mesh-Based VFX)

تجنب إنشاء آلاف الجزيئات (Particles) التي تستنزف طاقة المعالج وبطارية الهواتف، واستبدالها بشرائط هندسية (Mesh Ribbons) مع Custom Shaders:

- **أثر السيف المتوهج (Sword Slash Arc Mesh):** شريط هندسي مقوس على شكل هلال يتبع طرف السيف ويتلاشى ناعماً بنسبة Alpha Fade خلال 0.2 ثانية.
- **تأثير الغبار تحت الأقدام (Footstep Dust):** دوائر مسطحة تتوسع وتتلاشى بسرعة عند ملامسة الأرض.
- **التوهج السينمائي (UnrealBloomPass):** إضافة لمعان ساحر لضربات الطاقة والسيوف السحرية.
