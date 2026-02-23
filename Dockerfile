# 1. استخدام نسخة Node مستقرة
FROM node:18-alpine

# 2. تحديد مجلد العمل
WORKDIR /app

# 3. نسخ ملفات التعريف أولاً لسرعة البناء
COPY package*.json ./

# 4. تثبيت المكتبات (بما فيها firebase و xlsx)
RUN npm install

# 5. نسخ باقي ملفات المشروع
COPY . .

# 6. بناء التطبيق للإنتاج
RUN npm run build

# 7. استخدام سيرفر خفيف لتشغيل التطبيق (مثل serve)
RUN npm install -g serve
# ملاحظة: تم تغيير المنفذ إلى 3000 ليتوافق مع متطلبات البيئة
EXPOSE 3000

# 8. أمر التشغيل النهائي
CMD ["serve", "-s", "dist", "-l", "3000"]
