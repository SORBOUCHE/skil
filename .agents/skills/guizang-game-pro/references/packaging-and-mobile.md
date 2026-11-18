# الحزم ودعم أجهزة التحكم والهواتف الذكية (Packaging, Gamepads & Mobile)

> ضمان تشغيل اللعبة بأعلى سلاسة على الحواسيب، أذرع التحكم الاحترافية، والهواتف الذكية مع الاهتزاز التفاعلي.

---

## 1. دعم أذرع التحكم الحقيقية (Gamepad API)

دعم أيدي التحكم (PlayStation DualSense, Xbox Wireless, Nintendo Switch Pro):

```javascript
window.addEventListener("gamepadconnected", (e) => {
  console.log("🎮 يد التحكم متصلة:", e.gamepad.id);
});

function pollGamepad() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = gamepads[0];
  if (!gp) return null;

  // المحاور: عصا التحكم اليسرى للحركة
  const stickX = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
  const stickY = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;

  return {
    moveX: stickX,
    moveY: stickY,
    attack: gp.buttons[0].pressed, // A أو X
    dodge: gp.buttons[1].pressed,  // B أو دائرة
    block: gp.buttons[4].pressed || gp.buttons[6].pressed // LB أو LT
  };
}
```

---

## 2. اللمس على الهواتف مع الاهتزاز الحركي (Touch Joystick & Haptics)

- **عصا التحكم الافتراضية (Virtual Touch Joystick):** تظهر ديناميكياً أينما يضع المستخدم إصبعه على النصف الأيسر من الشاشة.
- **الاهتزاز الحسي (Haptic Feedback):**
```javascript
function triggerHaptic(duration = 40) {
  if (navigator.vibrate) {
    navigator.vibrate(duration); // نبضة اهتزاز خفيفة وسريعة في يد اللاعب
  }
}
```

---

## 3. حزم اللعبة في ملف HTML مستقل واحد (Single Standalone HTML)

- يتم دمج كافة أكواد الـ JavaScript ومكتبات Three.js و Rapier.js في وسم `<script>` واحد.
- يتم ضغط وتضمين أي خامات أو نماذج خارجية بصيغة `Data URI` (Base64) بداخل الملف.
- النتيجة: ملف `game.html` واحد، يمكن إرساله عبر الواتساب أو تيليجرام أو فتحه على أي متصفح في العالم بنقرة مزدوجة ودون الحاجة لأي خادم أو اتصال بالإنترنت!
