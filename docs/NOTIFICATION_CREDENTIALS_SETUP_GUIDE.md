# Livic Notification Senders & Credentials Setup Guide

This guide provides step-by-step instructions for acquiring and configuring all credentials needed for outbound notifications across **Mobile Push (Expo)**, **Email (SMTP)**, and **WhatsApp / SMS (MSG91 or Meta)**.

---

## 1. Environment Variable Reference

Add these variables to your root `.env` file (or container environment). In local development, any channel left disabled (`false`) will automatically fall back to `ConsoleNotificationSender`, logging messages to the terminal without errors.

```env
# ==============================================================================
# 1. MOBILE PUSH NOTIFICATIONS (Expo Push Service)
# ==============================================================================
PUSH_ENABLED=true

# ==============================================================================
# 2. EMAIL NOTIFICATIONS (SMTP - Gmail, SendGrid, Resend, or AWS SES)
# ==============================================================================
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_ADDRESS=notifications@livic.com

# ==============================================================================
# 3. WHATSAPP & SMS (MSG91 - Recommended Single Vendor for India)
# ==============================================================================
MSG91_ENABLED=true
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=LIVIC

# MSG91 SMS (one flow per DLT template; see section 4, Step 2):
MSG91_SMS_ENABLED=true
MSG91_SMS_FLOW_MARKETPLACE_OTP=flow_id
MSG91_SMS_FLOW_TOUR_APPROVED=flow_id
MSG91_SMS_FLOW_TOUR_DECLINED=flow_id
MSG91_SMS_FLOW_TOUR_REMINDER=flow_id
# Production defaults to true: the app refuses to start with SMS disabled
MSG91_SMS_REQUIRED=true
# Links in SMS point here; the domain must be whitelisted with DLT
MARKETPLACE_BASE_URL=https://your-marketplace-domain

# MSG91 WhatsApp:
MSG91_WHATSAPP_ENABLED=true
MSG91_WHATSAPP_INTEGRATED_NUMBER=919876543210

# ==============================================================================
# 4. DIRECT WHATSAPP CLOUD API (Meta - Alternative if not using MSG91)
# ==============================================================================
WHATSAPP_ENABLED=false
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_meta_system_user_token
```

---

## 2. Mobile Push Notifications (Expo)

### Overview
* **Provider**: Expo Push Service (`https://exp.host/--/api/v2/push/send`).
* **API Cost / Secret Key**: **Free, no secret key required**.
* **How it works**:
  1. The resident or landlord opens the mobile app (iOS or Android).
  2. The app requests push notification permissions and retrieves an `ExponentPushToken[...]`.
  3. The app automatically registers the token with the backend at `POST /api/v1/user/me/device-token`.
  4. When notifications trigger, `PushNotificationSender` posts directly to Expo's push endpoint.

### Configuration Steps
1. Set `PUSH_ENABLED=true` in your backend environment.
2. In `livic-resident-fe/app.json` and `livic-landlord-fe/app.json`, ensure your Expo project ID is defined under `extra.eas.projectId` (already pre-configured).

---

## 3. Email Notifications (SMTP)

### Option A: Gmail (Free, best for development and staging)
1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Enable **2-Step Verification** (required by Google to generate App Passwords).
3. Navigate to **App Passwords**: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Enter an app name (e.g. `Livic Backend`) and click **Create**.
5. Google will display a 16-character password (e.g. `abcd efgh ijkl mnop`).
6. Configure in `.env`:
   ```env
   EMAIL_ENABLED=true
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your-account@gmail.com
   EMAIL_PASSWORD=abcdefghijklmnop
   EMAIL_FROM_ADDRESS=your-account@gmail.com
   ```

### Option B: SendGrid / Resend (Production standard)
1. **Sign Up**:
   - [SendGrid](https://app.sendgrid.com/) or [Resend](https://resend.com/).
2. **Domain Authentication**:
   - Add your DNS records (SPF, DKIM, CNAME) to verify domain ownership (e.g. `livic.com`).
3. **Generate API Key**:
   - Create an API key with Mail Send permissions.
4. Configure in `.env`:
   ```env
   EMAIL_ENABLED=true
   # For SendGrid:
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USERNAME=apikey
   EMAIL_PASSWORD=SG.your_sendgrid_api_key_here
   EMAIL_FROM_ADDRESS=notifications@yourverifieddomain.com

   # Or for Resend:
   # EMAIL_HOST=smtp.resend.com
   # EMAIL_PORT=587
   # EMAIL_USERNAME=resend
   # EMAIL_PASSWORD=re_your_resend_api_key_here
   ```

---

## 4. WhatsApp & SMS via MSG91 (India)

MSG91 is a single provider that handles both **TRAI DLT-compliant transactional SMS** and **Meta WhatsApp Business API** for India.

### Step 1: Create an Account & Get Authkey
1. Register or log in at [https://msg91.com/](https://msg91.com/).
2. Open the **Dashboard** and navigate to **Authkey**: [https://control.msg91.com/app/authkey](https://control.msg91.com/app/authkey).
3. Click **Create New Authkey**, name it `Livic-Backend`, and copy the key into `MSG91_AUTH_KEY`.

### Step 2: Configure SMS (`MSG91_SMS_FLOW_*` & `MSG91_SENDER_ID`)
Carriers in India deliver only SMS whose text matches a DLT-registered template, so every SMS the backend sends is one of the fixed templates in `MessageTemplate` (`backend/src/main/java/com/livic/platform/notification/domain/MessageTemplate.java`). Registration takes days to weeks, so start it early; the code runs with the console provider meanwhile.

1. **DLT registration**: register the business as a Principal Entity on a DLT portal (Jio, Vilpower, Airtel, etc.) and add the entity ID in MSG91.
2. **Sender ID (header)**: register a 6-letter transactional header (e.g. `LIVICR`) on DLT and in MSG91 under **SMS** > **Sender ID**. Set `MSG91_SENDER_ID`.
3. **URL whitelisting**: whitelist the marketplace domain used in `MARKETPLACE_BASE_URL` on the DLT portal; SMS with unlisted links are blocked.
4. **Content templates**: register these four as *Service Implicit* templates. The text must match exactly; each `{#var#}` value is at most 30 characters (the backend cuts longer values), and the link uses `{#url#}`.

   | Template (env var) | DLT text | MSG91 variables, in order |
   |---|---|---|
   | `MSG91_SMS_FLOW_MARKETPLACE_OTP` | `{#var#} is your Livic verification code. It expires in {#var#} minutes. Do not share it with anyone. -LIVIC` | `otp`, `minutes` |
   | `MSG91_SMS_FLOW_TOUR_APPROVED` | `Hi {#var#}, your visit to {#var#} on {#var#} at {#var#} is confirmed. Details: {#url#} -LIVIC` | `name`, `property`, `date`, `time`, `link` |
   | `MSG91_SMS_FLOW_TOUR_DECLINED` | `Hi {#var#}, your visit request for {#var#} on {#var#} at {#var#} was declined. {#var#} See other slots: {#url#} -LIVIC` | `name`, `property`, `date`, `time`, `note`, `link` |
   | `MSG91_SMS_FLOW_TOUR_REMINDER` | `Reminder: your visit to {#var#} is on {#var#} at {#var#}. Details: {#url#} -LIVIC` | `property`, `date`, `time`, `link` |

5. **Flows**: in MSG91 under **SMS** > **Flows**, create one flow per approved template, writing each variable as `##name##` with the names above (e.g. `##otp## is your Livic verification code...`). Copy each Flow ID into its env var.
6. Set `MSG91_SMS_ENABLED=true` and `MSG91_AUTH_KEY`. At startup the backend checks that the auth key and all four flow IDs are present.

If you change a template's wording, change `MessageTemplate`, re-register on DLT and update the MSG91 flow together.

### Step 3: Configure WhatsApp (`MSG91_WHATSAPP_INTEGRATED_NUMBER`)
1. In the MSG91 dashboard, navigate to **WhatsApp**.
2. Connect your Meta WhatsApp Business Account (WABA) and onboard your business phone number.
3. Once approved, note the phone number including the country code (e.g. `919876543210` for an Indian number without `+` or leading `0`).
4. Set:
   ```env
   MSG91_WHATSAPP_ENABLED=true
   MSG91_WHATSAPP_INTEGRATED_NUMBER=919876543210
   ```
5. `Msg91WhatsAppNotificationSender` will automatically normalize recipient numbers to standard international format and dispatch outbound messages.

---

## 5. Alternative: Direct Meta WhatsApp Cloud API

If you prefer to connect directly to Meta without MSG91:
1. Go to [Meta for Developers](https://developers.facebook.com/) and open your Business App.
2. Under **WhatsApp** > **API Setup**:
   - Copy the **Phone number ID** into `WHATSAPP_PHONE_NUMBER_ID`.
3. In **Meta Business Manager** > **System Users**:
   - Create a System User with `whatsapp_business_messaging` permissions and generate a permanent token.
   - Copy this token into `WHATSAPP_ACCESS_TOKEN`.
4. Configure in `.env`:
   ```env
   WHATSAPP_ENABLED=true
   WHATSAPP_PHONE_NUMBER_ID=109283746501928
   WHATSAPP_ACCESS_TOKEN=EAAG...permanent_token
   # Ensure MSG91 WhatsApp is disabled if using direct Meta:
   MSG91_WHATSAPP_ENABLED=false
   ```

---

## 6. Local Development Mode (Zero Credentials Required)

If you are developing locally or do not yet have live credentials:
- Keep `EMAIL_ENABLED=false`, `PUSH_ENABLED=false`, `MSG91_ENABLED=false` and `MSG91_SMS_ENABLED=false`.
- SMS then go to `ConsoleSmsProvider`, which prints the rendered text with a masked number (`[SMS - not sent, console provider] to=******3210 template=TOUR_APPROVED: Hi Riya, ...`). The dev profile also fixes marketplace OTPs to `000000` and skips sending them; set `MARKETPLACE_DEV_OTP_CODE=` (empty) to exercise the OTP SMS.
- Spring Boot will automatically activate `ConsoleNotificationSender`.
- When rent cycles are published or notifications are triggered, all notifications will print directly to the backend log output:
  ```text
  [CONSOLE NOTIFICATION] Channel: EMAIL | To: tenant@example.com | Title: Rent Statement Ready: 2026-09 | Body: ...
  [CONSOLE NOTIFICATION] Channel: PUSH | To: ExponentPushToken[...] | Title: Rent Due: 2026-09 | Body: ...
  [CONSOLE NOTIFICATION] Channel: WHATSAPP | To: +919876543210 | Title: Rent Invoice | Body: ...
  ```
- This allows you to verify rent cycle generation, multi-channel dispatch, and tenant preference filtering without sending live emails or SMS.

---

## 7. Tenant Channel Preferences

Residents can independently choose their preferred communication channels on the resident mobile app (**Settings** > **Notification Channels**):
- **Email Notifications**: Opt in/out of email rent invoices and receipts.
- **Push Notifications**: Opt in/out of mobile push alerts.
- **WhatsApp Notifications**: Opt in/out of WhatsApp statements.

`NotificationServiceImpl` evaluates these preferences from `resident_notification_preference_tbl` before any outbound dispatch, ensuring tenants only receive messages on their selected channels.
