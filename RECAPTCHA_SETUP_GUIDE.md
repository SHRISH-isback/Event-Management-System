# Google reCAPTCHA Setup Guide

## 🔐 How to Get Google reCAPTCHA Keys

### Step 1: Go to Google reCAPTCHA Admin Console

Visit: **https://www.google.com/recaptcha/admin/create**

(You need to be logged into a Google account)

---

### Step 2: Register Your Site

Fill in the registration form:

#### 1. **Label**
   - Give your project a name
   - Example: `Event Management System`

#### 2. **reCAPTCHA Type**
   
   Choose one of these options:

   **Option A: reCAPTCHA v2** (Recommended for beginners)
   - ✅ Select: **"I'm not a robot" Checkbox**
   - This shows the familiar checkbox that users click
   - Easier to implement and test
   - **Choose this if unsure!**

   **Option B: reCAPTCHA v3** (Advanced)
   - Returns a score (0.0 - 1.0) based on user behavior
   - No user interaction required
   - More complex to configure

#### 3. **Domains**
   
   Add your domains (one per line):
   ```
   localhost
   127.0.0.1
   your-production-domain.com
   ```
   
   **Important:** For local development, add:
   - `localhost`
   - `127.0.0.1`

#### 4. **Accept reCAPTCHA Terms of Service**
   - ✅ Check the box

#### 5. **Send alerts to owners**
   - Optional: Check if you want notifications about configuration issues

---

### Step 3: Get Your Keys

After submitting, you'll receive **two keys**:

1. **Site Key** (Public key)
   - Used in your **frontend** (React app)
   - Safe to expose in client-side code
   - Example: `6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

2. **Secret Key** (Private key)
   - Used in your **backend** (Node.js/Express)
   - ⚠️ **NEVER expose this in frontend code**
   - Keep it in your `.env` file
   - Example: `6LdYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY`

---

## 📝 Configuration Steps

### Backend Configuration (.env)

1. Navigate to your backend folder:
   ```bash
   cd backend
   ```

2. Create/edit `.env` file:
   ```bash
   nano .env
   # or use any text editor
   ```

3. Add your secret key:
   ```env
   RECAPTCHA_SECRET_KEY=6LdYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
   RECAPTCHA_SCORE_THRESHOLD=0.5
   ```

---

### Frontend Configuration (.env)

1. Navigate to your frontend folder:
   ```bash
   cd frontend
   ```

2. Create/edit `.env` file:
   ```bash
   nano .env
   ```

3. Add your site key:
   ```env
   REACT_APP_RECAPTCHA_SITE_KEY=6LdXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

---

## 🧪 Testing with Test Keys

Google provides **test keys** for development that always pass validation:

### Test Site Key (Frontend):
```
6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

### Test Secret Key (Backend):
```
6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

**Frontend .env:**
```env
REACT_APP_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

**Backend .env:**
```env
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

⚠️ **Note:** Test keys will show a warning but always validate successfully.

---

## 🚀 Quick Start (Using Test Keys)

### 1. Backend Setup

```bash
cd backend

# Create .env file if it doesn't exist
cat > .env << 'EOF'
MONGO_URI=mongodb://localhost:27017/event-management
JWT_SECRET=your-jwt-secret-change-in-production
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
RECAPTCHA_SCORE_THRESHOLD=0.5
PORT=5000
EOF

# Install dependencies (if not already done)
npm install

# Start server
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Create .env file if it doesn't exist
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:5000
REACT_APP_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
EOF

# Start React app
npm start
```

---

## ✅ Verification

### Test Login/Register Pages

1. Open your browser: `http://localhost:3000`
2. Go to Login or Register page
3. You should see the reCAPTCHA widget
4. Complete the CAPTCHA
5. Submit the form

### Check Browser Console

- No CAPTCHA errors should appear
- Form should submit successfully

### Check Backend Logs

- Should show successful CAPTCHA verification
- No verification errors

---

## 🔧 Troubleshooting

### Issue 1: "ERROR for site owner: Invalid site key"

**Solution:** 
- Check that your site key matches exactly (no extra spaces)
- Verify the domain is registered (add `localhost` if testing locally)
- Clear browser cache and reload

### Issue 2: "CAPTCHA verification required"

**Solution:**
- Ensure the CAPTCHA widget loaded properly
- Check browser console for errors
- Verify internet connection (reCAPTCHA loads from Google CDN)

### Issue 3: "CAPTCHA verification failed"

**Solution:**
- Check that backend secret key is correct
- Ensure backend can reach Google's verification API
- Verify the token is being sent from frontend to backend

### Issue 4: CAPTCHA not showing

**Solution:**
- Check if reCAPTCHA script is blocked by ad-blocker
- Verify the site key is set correctly in frontend `.env`
- Check browser console for loading errors
- Ensure `ReCaptcha` component is imported correctly

---

## 📚 Additional Resources

- **Official Documentation:** https://developers.google.com/recaptcha/docs/display
- **reCAPTCHA Admin:** https://www.google.com/recaptcha/admin
- **API Reference:** https://developers.google.com/recaptcha/docs/verify

---

## 🔒 Security Best Practices

1. ✅ **Never commit** `.env` files to Git
2. ✅ Use different keys for development and production
3. ✅ Keep secret key truly secret (backend only)
4. ✅ Set proper domain restrictions in reCAPTCHA admin
5. ✅ Monitor your reCAPTCHA dashboard for suspicious activity
6. ✅ Rotate keys periodically in production

---

## 📋 Summary

| Item | Location | Purpose |
|------|----------|---------|
| **Site Key** | Frontend `.env` | Public key for widget display |
| **Secret Key** | Backend `.env` | Private key for verification |
| **Test Site Key** | `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` | For development |
| **Test Secret Key** | `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` | For development |

---

## 🎯 Next Steps

1. ✅ Register your site at https://www.google.com/recaptcha/admin/create
2. ✅ Copy the Site Key to `frontend/.env`
3. ✅ Copy the Secret Key to `backend/.env`
4. ✅ Restart both servers
5. ✅ Test login/register pages
6. ✅ Check Security Dashboard at `/security` (admin only)

**Your bot protection feature is now complete!** 🎉
