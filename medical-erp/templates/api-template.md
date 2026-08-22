# API Endpoint: {Endpoint Name}

---
Document ID: {PREFIX-NNN}
Status: Draft
Version: 0.1.0
Owner: API
Last Update: {YYYY-MM-DD}
Last Reviewed: {YYYY-MM-DD}
Source of Truth: {true|false}
Depends On: [{Document IDs}]
---

## 1. Overview

{Brief description of the endpoint}

## 2. Endpoint

```
{METHOD} /api/{resource}
```

## 3. Authentication

| Property | Value |
|---|---|
| Required | {Yes/No} |
| Roles | {DOCTORA, ENFERMERA} |

## 4. Request

### 4.1 Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| {id} | {type} | {Yes/No} | {description} |

### 4.2 Query Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| {param} | {type} | {Yes/No} | {default} | {description} |

### 4.3 Request Body

```json
{
  "field": "value"
}
```

## 5. Response

### 5.1 Success (200)

```json
{
  "data": {},
  "message": "Success",
  "timestamp": "2026-07-28T10:00:00Z"
}
```

### 5.2 Error Responses

| Code | Description |
|---|---|
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |

## 6. Business Rules

- {Rule 1}
- {Rule 2}

## 7. Examples

### 7.1 Request Example

```bash
curl -X {METHOD} http://localhost:8080/api/{resource} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### 7.2 Response Example

```json
{
  "data": {}
}
```

## 8. Dependencies

| Document | Relationship |
|---|---|
| {Document ID} | {Relationship} |
