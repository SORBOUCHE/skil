# هندسة المحرك الفيزيائي والتصادم (Physics & Collision Engineering)

> تفادي أكبر نقطة ضعف في الألعاب البدائية: اختراق الجدران والاهتزاز عند صعود المنحدرات.

---

## 1. اختيار محرك الفيزياء المناسب

### الخيار أ: Rapier.js (الموصى به للأداء العالي والـ WebAssembly)
- **المزايا**: مبني بلغة Rust ومُصرف إلى WebAssembly، فائق السرعة، مزود بمتحكم مدمج بالشخصية (`KinematicCharacterController`).
- **التضمين في الـ HTML**:
```html
<script src="https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/rapier.umd.min.js"></script>
```

### الخيار ب: Cannon-es (خفيف وبسيط للـ 3D Arcade)
- **المزايا**: كود جافاسكريبت صافٍ وخفيف، سهل الإعداد للتصادمات الأساسية والمقذوفات.
- **التضمين في الـ HTML**:
```html
<script src="https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js"></script>
```

---

## 2. المتحكم الحركي بالشخصية (Kinematic Character Controller)

بدلاً من تطبيق قوى ديناميكية عشوائية على جسم اللاعب (Dynamic Rigidbody) والتي تجعل التحكم عائماً وغير مستقر، نستخدم **Kinematic Controller** مع كبسولة تصادم:

```javascript
// كبسولة تصادم اللاعب (نصف القطر 0.35م، الارتفاع 1.7م)
const characterColliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.35)
  .setTranslation(0, 0.85, 0);
const characterBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.kinematicPositionBased()
);
const characterCollider = world.createCollider(characterColliderDesc, characterBody);

// إعدادات صعود المنحدرات والسلالم وتجاوز العوائق الصغيرة
const characterController = world.createCharacterController(0.01);
characterController.enableAutostep(0.3, 0.2, true); // صعود عتبات حتى 30 سم
characterController.enableSnapToGround(0.5);        // التصاق بالأرض عند نزول المنحدرات
characterController.setMaxSlopeClimbAngle(45 * Math.PI / 180); // حد أقصى للمنحدر 45 درجة
```

---

## 3. نظام الـ Hitboxes والـ Hurtboxes القتالي

- **Hurtbox (منطقة تلقي الضرر):** كبسولة محيطة بجسد الشخصية في طبقة تصادم (Collision Group) مخصصة لتلقي الإصابات.
- **Hitbox (منطقة تسديد الضرر):** يتم تفعيلها برمجياً فقط أثناء إطارات الضربة النشطة (Active Hit Frames) لنصل السيف أو القبضة، وتُعطّل فور انتهاء الضربة لمنع الضربات الشبحية المزدوجة.

```javascript
// مصفوفة أقنعة التصادم (Collision Bitmasks)
const COLLISION_GROUPS = {
  ENVIRONMENT: 0x0001,
  PLAYER_BODY: 0x0002,
  PLAYER_ATTACK: 0x0004,
  ENEMY_BODY: 0x0008,
  ENEMY_ATTACK: 0x0010
};
```
