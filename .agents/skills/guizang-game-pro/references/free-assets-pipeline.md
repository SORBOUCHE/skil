# خط إنتاج النماذج والوسائط المجانية والهجينة (Free & Hybrid Asset Pipeline)

> بناء ألعاب مذهلة بدون إجبار المستخدم على اشتراكات مدفوعة، مع إمكانية دمج أدوات الـ AI المتقدمة عند توفرها.

---

## 1. مصادر المجسمات المجانية المفتوحة (CC0 / Permissive)

| المصدر | نوع الأصول | كيفية الاستخدام برمجياً |
| :--- | :--- | :--- |
| **Kenney.nl** | بيئات كاملة، شخصيات، أسلحة، مباني، جزيئات | مجانية 100% (CC0) بصيغ `GLTF` و `FBX`. |
| **Poly Pizza** | مكتبة ضخمة لمجسمات Low-Poly خفيفة وسريعة التحميل | مجانية مع ترخيص المشاع الإبداعي. |
| **Mixamo (Adobe)** | مكتبة مجانية تضم آلاف الشخصيات والحركات الحركية (MoCap) | تصدير حركات المشي، الهجوم، القفز، الموت كـ `GLTF`. |
| **OpenGameArt.org** | مواد وخامات وأصوات مجانية | رخص مفتوحة المصدر. |

---

## 2. دمج خط إنتاج الذكاء الاصطناعي (عند توفر أدوات الـ AI)

### القاعدة الذهبية لإنتاج النماذج ثلاثية الأبعاد بـ AI:
> **لا تولد 3D من نص مباشرة!** بل اتبع الخطوات الثلاث:
1. **توليد صورة مفهومية 2D أولاً:** (عبر Imagen 3 أو Midjourney أو Jimeng أو Stable Diffusion):
   - البرومبت: `single full-body character, isometric view, T-pose, pure white background, no shadows, game asset style`.
2. **تحويل الصورة إلى مجسم ثلاثي الأبعاد 3D:**
   - أدوات سريعة سحابية: `Tripo 3D` أو `Meshy.ai` أو `Luma Genie`.
   - أدوات مجانية مفتوحة المصدر: `TripoSR` أو `Stable Fast 3D` عبر HuggingFace.
3. **الربط التلقائي للهيكل العظمي (Auto-Rigging):**
   - رفعه إلى `Mixamo` برمجياً أو استخدام ميزة الـ Auto-Rig في `Tripo`.

---

## 3. هندسة المجسمات الإجرائية (Procedural Low-Poly Mesh Fallback)

في حال عدم وجود أي أصول خارجية، يتم بناء الأشكال الهندسية بأسلوب Low-Poly جذاب يعتمد على الألوان وتدرجات التظليل الـ Flat Shading:

```javascript
// إنشاء صخرة إجرائية عشوائية بـ Flat Shading
function createProceduralRock(radius = 1) {
  const geo = new THREE.DodecahedronGeometry(radius, 1);
  const pos = geo.attributes.position;
  // تشويه النقاط لإنتاج تضاريس عشوائية
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    v.addScaledVector(v.clone().normalize(), (Math.random() - 0.5) * 0.3 * radius);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6e7681,
    flatShading: true,
    roughness: 0.9
  });
  return new THREE.Mesh(geo, mat);
}
```
