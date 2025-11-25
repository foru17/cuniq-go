# Environment Variables Setup

This project requires the following environment variables to be configured:

## Required Variables

### `NEXT_PUBLIC_APP_CODE`
- **Description**: Alibaba Cloud API Market APP CODE for mobile number location query service
- **Required**: Yes
- **Where to get it**: [Alibaba Cloud API Market](https://market.aliyun.com/)

### `UPDATE_API_TOKEN`
- **Description**: Bearer token for authenticating requests to the `/api/update-numbers` endpoint
- **Required**: Yes (for production deployments)
- **How to generate**: Run `openssl rand -base64 32` to generate a secure random token
- **Security**: Keep this token secret and never commit it to Git

## Local Development Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace `your_app_code_here` with your actual APP_CODE

3. The `.env.local` file is already in `.gitignore` and will not be committed to the repository

## Vercel Deployment Setup

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the following variables:
   
   **Variable 1:**
   - **Name**: `NEXT_PUBLIC_APP_CODE`
   - **Value**: Your Alibaba Cloud APP CODE
   - **Environment**: Production, Preview, Development (select as needed)
   
   **Variable 2:**
   - **Name**: `UPDATE_API_TOKEN`
   - **Value**: Your secure random token (generate with `openssl rand -base64 32`)
   - **Environment**: Production, Preview, Development (select as needed)

4. Redeploy your application for the changes to take effect

## Using the Update API

The `/api/update-numbers` endpoint is now protected with Bearer token authentication.

### Example Request

```bash
curl -X POST https://your-domain.vercel.app/api/update-numbers \
  -H "Authorization: Bearer YOUR_UPDATE_API_TOKEN"
```

### Response

**Success (200):**
```json
{
  "success": true,
  "timestamp": 1700000000000,
  "duration": "5234ms",
  "stats": {
    "ordinary": { "previous": 100, "current": 120, "active": 115, "new": 20 },
    "special": { "previous": 50, "current": 55, "active": 52, "new": 5 },
    "locationEnriched": 25
  }
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Unauthorized: Bearer token required",
  "timestamp": 1700000000000
}
```

## Security Notes

- ⚠️ **Never commit** `.env.local` or any file containing actual credentials to Git
- ✅ **Always use** environment variables for sensitive data
- ✅ The `.env.example` file should only contain placeholder values
- ✅ For Vercel deployments, use the Vercel dashboard to set environment variables securely
