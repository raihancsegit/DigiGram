# DigiGram Multi-Platform API Documentation

This RESTful API architecture is designed so that both the Next.js Web Frontend and Native Mobile Apps (Flutter / React Native) can securely consume the same endpoints.

All endpoints live under the base URL: `https://[your-domain]/api/v1/`

---

## 1. Core Hierarchy API (Location Data)

### 1.1 Get Location Details & Path
**Route:** `GET /api/v1/hierarchy/:location_id`  
**Description:** Fetches details of a specific Upazila, Union, Ward, or Village, including its parent path.  
**Mobile/Web App Usage:** Use this when a user logs in to fetch their assigned territory.  

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name_en": "Poba Union",
    "name_bn": "পবা ইউনিয়ন",
    "type": "union",
    "parent_id": "upazila-uuid-here",
    "stats": {"total_voters": 5000}
  }
}
```

### 1.2 Get Child Entities (E.g., All Wards under a Union)
**Route:** `GET /api/v1/hierarchy/:location_id/children`  
**Description:** Returns a list of immediate children (e.g., getting all 9 wards for a specific Union).

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": "ward-1-uuid", "name_en": "Ward 1", "type": "ward" },
    { "id": "ward-2-uuid", "name_en": "Ward 2", "type": "ward" }
  ]
}
```

---

## 2. Dynamic Services / Plugins API

### 2.1 Get Active Services (Addons)
**Route:** `GET /api/v1/services/active?location_id=:location_id`  
**Description:** Checks which plugins (like Smart School, Digi-Fuel, SMS Gateway) are activated for a specific location. By hitting this from the Mobile App, you can dynamically show/hide bottom tabs or menu items based on what's active.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
       "service": { "name": "Digi Fuel", "slug": "digi_fuel" },
       "config": { "max_quota_per_day": 5 }
    }
  ]
}
```

---

## 3. SaaS Institutions API (Schools, Mosques)

### 3.1 Get All Institutions for a Village/Ward
**Route:** `GET /api/v1/institutions?location_id=:location_id`  
**Description:** Fetches all registered schools, colleges, and mosques in a given area.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inst-1-uuid",
      "name": "Poba High School",
      "type": "school",
      "subdomain": "pobaschool.digigram.com"
    }
  ]
}
```

---

## 4. API Authentication & Security

Mobile apps shouldn't make direct unauthenticated SQL queries. Instead, the Mobile App will obtain a Supabase JWT Session Token on Login and pass it via headers to this API:

```http
Authorization: Bearer <Users_JWT_Token>
```

Our Next.js API Routes will parse this token, extract the user's `profile_id` and `access_scope`, and perform strict backend Row-Level Security logic before pushing queries down to the Database.
