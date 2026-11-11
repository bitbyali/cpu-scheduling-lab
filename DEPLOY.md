# راهنمای جامع و گام‌به‌گام استقرار CPU Scheduling Lab روی سرور مجازی (VPS) با اوبونتو، Nginx و HTTPS

این راهنما به‌صورت کاملاً فارسی و مرحله‌به‌مرحله برای افرادی نوشته شده است که می‌خواهند پروژه **CPU Scheduling Lab** را روی یک سرور لینوکس Ubuntu (نسخه 20.04، 22.04 یا 24.04) منتشر کنند و روی دامنه خودشان با گواهی امنیتی رایگان **HTTPS (Let's Encrypt)** بالا بیاورند.

---

## گام صفر: بررسی اولیه وضعیت سرور (مهم برای سرورهای در حال استفاده)

قبل از نصب یا تغییر هر سرویسی، ابتدا با SSH به سرور خود متصل شوید:

```bash
ssh root@YOUR_SERVER_IP

````

اگر از قبل وب‌سرور یا سرویسی روی سرور دارید، با دستورات زیر بررسی کنید که پورت‌های `80` و `443` توسط چه برنامه‌ای اشغال شده‌اند و آیا Nginx از قبل نصب است یا خیر:

Bash

```
sudo ss -tulpn | grep -E ':80|:443'
systemctl status nginx

```

- اگر سرویس دیگری مثل Apache پورت 80 را اشغال کرده و به آن نیاز ندارید، می‌توانید آن را متوقف کنید (`sudo systemctl stop apache2 && sudo systemctl disable apache2`).
- اگر Nginx از قبل نصب و فعال است، تنظیمات سایت‌های قبلی شما در `/etc/nginx/sites-enabled/` قرار دارد؛ آن‌ها را حذف نکنید و فقط یک فایل کانفیگ جدید برای این پروژه بسازید.

## ۱. پیش‌نیازهای سیستم‌عامل Ubuntu

ابتدا فهرست مخازن اوبونتو را به‌روزرسانی کرده و ابزارهای پایه (`curl`، `git`، `unzip` و فایروال `ufw`) را نصب کنید:

Bash

```
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip build-essential ufw

```

پورت‌های SSH و وب (HTTP/HTTPS) را در فایروال باز بگذارید:

Bash

```
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

```

## ۲. نصب Node.js و npm (نسخه LTS استاندارد)

برای کامپایل پروژه در صورت انجام Build روی سرور (یا روی سیستم محلی)، نسخه ۲۰ (LTS) از Node.js را از مخزن رسمی NodeSource نصب کنید:

Bash

```
curl -fsSL [https://deb.nodesource.com/setup_20.x](https://deb.nodesource.com/setup_20.x) | sudo -E bash -
sudo apt install -y nodejs

```

پس از نصب، صحت نسخه‌های نصب‌شده را بررسی کنید:

Bash

```
node -v
npm -v

```

*(خروجی باید مشابه `v20.x.x` برای Node و `10.x.x` برای npm باشد.)*

## ۳. نصب وابستگی‌های پروژه (Dependencies)

شما می‌توانید پروژه را یا روی سیستم شخصی خودتان Build بگیرید و فقط پوشه `dist` را به سرور منتقل کنید (روش الف)، یا کل سورس پروژه را روی سرور قرار دهید و روی سرور Build بگیرید (روش ب).

اگر سورس پروژه را روی سرور در مسیر `/var/www/cpu-scheduling-lab-src` قرار داده‌اید:

Bash

```
cd /var/www/cpu-scheduling-lab-src
npm install

```

## ۴. اجرای Build تولیدی (Production Build)

در پوشه پروژه (روی سیستم خودتان یا روی سرور)، دستور زیر را اجرا کنید:

Bash

```
npm run build

```

این دستور ابتدا کدها را با کامپایلر TypeScript (`tsc`) بررسی می‌کند و سپس با Vite تمام فایل‌های HTML، CSS و JavaScript فشرده و بهینه‌شده را داخل پوشه `dist/` تولید می‌کند.

## ۵. انتقال پوشه `dist` به VPS و تنظیم دسترسی‌ها

ابتدا پوشه مقصد نهایی وب‌سایت را روی سرور ایجاد کنید:

Bash

```
sudo mkdir -p /var/www/cpu-scheduling-lab/dist

```

### حالت اول: اگر Build را روی سیستم شخصی (ویندوز/مک/لینوکس) انجام داده‌اید

از ترمینال سیستم شخصی خودتان، محتویات پوشه `dist` را با دستور `scp` به سرور بفرستید:

Bash

```
scp -r ./dist/* root@YOUR_SERVER_IP:/var/www/cpu-scheduling-lab/dist/

```

### حالت دوم: اگر Build را داخل خود سرور انجام داده‌اید

کافی است محتویات `dist` را به پوشه وب‌سرور کپی کنید:

Bash

```
sudo cp -r /var/www/cpu-scheduling-lab-src/dist/* /var/www/cpu-scheduling-lab/dist/

```

### تنظیم مالکیت و سطح دسترسی استاندارد برای Nginx:

Bash

```
sudo chown -R www-data:www-data /var/www/cpu-scheduling-lab
sudo chmod -R 755 /var/www/cpu-scheduling-lab

```

## ۶. نصب و پیکربندی وب‌سرور Nginx

۱. اگر Nginx روی سرور نصب نیست، آن را نصب و فعال کنید:

Bash

```
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

```

۲. یک فایل پیکربندی اختصاصی برای پروژه ایجاد کنید:

Bash

```
sudo nano /etc/nginx/sites-available/cpu-scheduling-lab

```

۳. محتوای زیر را داخل فایل قرار دهید (به‌جای `example.com` نام دامنه یا ساب‌دامنه واقعی خود، یا در صورت نداشتن دامنه، IP سرور خود را بنویسید):

Nginx

```
server {
    listen 80;
    listen [::]:80;

    server_name example.com [www.example.com](https://www.example.com);

    root /var/www/cpu-scheduling-lab/dist;
    index index.html;

    # فشرده‌سازی Gzip برای بارگذاری سریع فونت‌ها و باندل جاوااسکریپت
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json image/svg+xml;

    # پشتیبانی کامل از مسیریابی تک‌صفحه‌ای (SPA) در React
    location / {
        try_files $uri$uri/ /index.html;
    }

    # کش طولانی‌مدت برای فایل‌های استاتیک هش‌شده در پوشه assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # هدرهای امنیتی پایه
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}

```

۴. فایل را ذخیره کنید (`Ctrl + O` سپس `Enter` و برای خروج `Ctrl + X`).

۵. سایت را فعال کرده و صحت سینتکس Nginx را تست کنید:

Bash

```
sudo ln -s /etc/nginx/sites-available/cpu-scheduling-lab /etc/nginx/sites-enabled/
sudo nginx -t

```

۶. اگر پیام `syntax is ok` و `test is successful` را مشاهده کردید، Nginx را بارگذاری مجدد کنید:

Bash

```
sudo systemctl reload nginx

```

## ۷. تنظیم دامنه و رکوردهای DNS

برای اینکه دامنه شما (مثلاً `example.com` یا ساب‌دامنه `oslab.example.com`) به سرور متصل شود، وارد پنل مدیریت دامنه یا Cloudflare خود شوید و رکوردهای زیر را ثبت کنید:

| نوع رکورد (Type) | نام (Name / Host)                  | مقدار (Value / Target) | وضعیت پروکسی (در صورت استفاده از Cloudflare)                    |
| ---------------- | ---------------------------------- | ---------------------- | --------------------------------------------------------------- |
| **A**            | `@` (یا نام ساب‌دامنه مثل `oslab`) | `YOUR_SERVER_IP`       | در زمان دریافت اولیه SSL روی **DNS Only (ابر خاکستری)** بگذارید |
| **A**            | `www`                              | `YOUR_SERVER_IP`       | **DNS Only (ابر خاکستری)**                                      |

برای اطمینان از اینکه دامنه به IP سرور شما اشاره می‌کند، دستور زیر را در سرور اجرا کنید:

Bash

```
ping -c 3 example.com

```

## ۸. فعال‌سازی رایگان HTTPS با Certbot (Let's Encrypt)

۱. ابزار Certbot و پلاگین Nginx آن را نصب کنید:

Bash

```
sudo apt install -y certbot python3-certbot-nginx

```

۲. دستور زیر را برای دریافت گواهی SSL و پیکربندی خودکار HTTPS در Nginx اجرا کنید (نام دامنه خود را جایگزین کنید):

Bash

```
sudo certbot --nginx -d example.com -d [www.example.com](https://www.example.com)

```

- اگر از یک ساب‌دامنه (مثلاً `oslab.example.com`) استفاده می‌کنید، کافی است بنویسید:`sudo certbot --nginx -d oslab.example.com`
- در مراحل پرسش، ایمیل خود را وارد کنید، با شرایط موافقت کنید (`Y`) و در پایان، Certbot به صورت خودکار ترافیک `HTTP` (پورت 80) را به `HTTPS` (پورت 443) هدایت (Redirect) می‌کند.

## ۹. تمدید خودکار گواهی SSL (Auto-Renewal)

گواهی‌های Let's Encrypt دارای اعتبار ۹۰ روزه هستند. Certbot به صورت خودکار یک تایمر سیستمی (`systemd timer`) برای تمدید خودکار ایجاد می‌کند.

۱. بررسی فعال بودن تایمر تمدید خودکار:

Bash

```
sudo systemctl status certbot.timer

```

۲. تست شبیه‌سازی تمدید خودکار (بدون تغییر واقعی گواهی):

Bash

```
sudo certbot renew --dry-run

```

*(اگر در پایان پیام `Congratulations, all simulated renewals succeeded` نمایش داده شد، تمدید خودکار کاملاً سالم است.)*

## ۱۰. دستورات بررسی وضعیت و رفع خطاهای متداول (Troubleshooting)

### الف) دستورات پرکاربرد بررسی وضعیت

Bash

```
# مشاهده وضعیت سرویس Nginx
sudo systemctl status nginx

# بررسی خطاهای احتمالی در فایل کانفیگ Nginx
sudo nginx -t

# مشاهده آخرین خطاهای ثبت‌شده در لاگ Nginx
sudo tail -n 30 /var/log/nginx/error.log

# مشاهده ترافیک ورودی زنده
sudo tail -n 30 /var/log/nginx/access.log

```

### ب) رفع خطاهای متداول

1. **خطای `403 Forbidden` هنگام باز کردن سایت:**
   - **علت:** پوشه `dist` خالی است یا کاربر `www-data` دسترسی خواندن به پوشه‌های والد را ندارد.
   - **راه‌حل:**

     Bash
     ```
     ls -la /var/www/cpu-scheduling-lab/dist
     sudo chown -R www-data:www-data /var/www/cpu-scheduling-lab
     sudo chmod -R 755 /var/www/cpu-scheduling-lab

     ```
2. **خطای `502 Bad Gateway` یا نمایش صفحه پیش‌فرض Welcome to nginx:**
   - **علت:** در فایل کانفیگ Nginx مقدار `server_name` با آدرسی که در مرورگر وارد کرده‌اید یکی نیست، یا فایل `default` در مسیر `/etc/nginx/sites-enabled/default` ترافیک را می‌گیرد.
   - **راه‌حل:** اگر فقط همین سایت را روی سرور دارید، لینک پیش‌فرض را حذف کرده و Nginx را ریلود کنید:

     Bash
     ```
     sudo rm -f /etc/nginx/sites-enabled/default
     sudo systemctl reload nginx

     ```
3. **خطای Certbot هنگام دریافت گواهی SSL (`Timeout during connect`):**
   - **علت:** پورت 80 یا 443 در فایروال سرور یا پنل دیتاسنتر بسته است، یا دامنه هنوز به IP سرور متصل نشده است.
   - **راه‌حل:** دستور `sudo ufw allow 'Nginx Full'` را اجرا کنید و در پنل کلودفلر تیک پروکسی (ابر نارنجی) را موقتاً خاموش (خاکستری) کنید.















