#!/bin/bash

# Test script for update-numbers API authentication
# This script tests both successful and failed authentication scenarios

echo "🔐 Testing Update Numbers API Authentication"
echo "=============================================="
echo ""

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep UPDATE_API_TOKEN | xargs)
else
  echo "❌ Error: .env.local file not found"
  exit 1
fi

API_URL="http://localhost:3000/api/update-numbers"

echo "📍 API Endpoint: $API_URL"
echo ""

# Test 1: No Authorization Header
echo "Test 1: Request without Authorization header"
echo "Expected: 401 Unauthorized"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ PASS: Got 401 status"
  echo "Response: $BODY"
else
  echo "❌ FAIL: Expected 401, got $HTTP_STATUS"
  echo "Response: $BODY"
fi
echo ""

# Test 2: Invalid Token
echo "Test 2: Request with invalid token"
echo "Expected: 401 Unauthorized"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer invalid_token_12345")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ PASS: Got 401 status"
  echo "Response: $BODY"
else
  echo "❌ FAIL: Expected 401, got $HTTP_STATUS"
  echo "Response: $BODY"
fi
echo ""

# Test 3: Valid Token
echo "Test 3: Request with valid token"
echo "Expected: 200 OK (or 500 if API has other issues)"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $UPDATE_API_TOKEN")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "500" ]; then
  echo "✅ PASS: Authentication successful (status: $HTTP_STATUS)"
  echo "Response: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ FAIL: Expected 200 or 500, got $HTTP_STATUS"
  echo "Response: $BODY"
fi
echo ""

# Test 4: Malformed Authorization Header
echo "Test 4: Request with malformed Authorization header (no 'Bearer' prefix)"
echo "Expected: 401 Unauthorized"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$API_URL" \
  -H "Authorization: $UPDATE_API_TOKEN")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ PASS: Got 401 status"
  echo "Response: $BODY"
else
  echo "❌ FAIL: Expected 401, got $HTTP_STATUS"
  echo "Response: $BODY"
fi
echo ""

echo "=============================================="
echo "🏁 Authentication tests completed!"
