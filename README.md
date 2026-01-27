# SAP Payment Validation & Verification Agent

An enterprise-grade **Accounts Payable payment validation service** inspired by SAP-style controls.  
This service performs deterministic, auditable validations on invoices before payment execution.

It is designed as a **backend validation agent** that can be plugged into procurement / AP platforms.


##  What This Project Does

The SAP Payment Validation Agent validates invoices **before payment** by running them through multiple independent checks and then producing a **final decision**:

- **OKAY** → Safe to pay
- **HOLD** → Needs clarification / correction
- **REJECT** → Critical violation, do not pay

Every decision is:
- Rule-based (not probabilistic)
- Fully auditable
- Backed by structured evidence
- Persisted for compliance and reporting

---

## 🔍 Validations Performed

### 1️⃣ 3-Way Match Validation (Mandatory)
Compares:
- **Invoice vs Purchase Order vs GRN**

Checks:
- Unit price tolerance
- Quantity tolerance
- Missing PO or GRN lines
- Material mismatch

---

### 2️⃣ Tax Validation
Validates:
- GST rate correctness
- GST amount calculation
- TDS calculation
- Mandatory HSN codes

---

### 3️⃣ Bank & Vendor Risk Validation
Checks:
- IFSC format
- Vendor name vs bank account holder name
- Recent bank detail changes for high-value invoices

---

### 4️⃣ Compliance & Controls
Enforces:
- Segregation of Duties (SOD)
- Budget availability
- PO ceiling limits
- High-value approval rules

---

### 5️⃣ Decision Engine
Aggregates all validation results and determines:
- Final decision
- Exception severity summary
- Routing suggestions (Tax / Procurement / Finance / Compliance)

---

## 🧠 Decision Logic

| Condition | Result |
|---------|--------|
| ≥1 Critical Exception | **REJECT** |
| ≥1 Major Exception | **HOLD** |
| Only Minor Exceptions | **OKAY** |
| No Exceptions | **OKAY** |

---

## 🏗️ Tech Stack

- **Node.js (ES Modules)**
- **Express**
- **Supabase (PostgreSQL)**
- **Zod** – request validation
- **UUID** – audit-safe identifiers
- **JSON-based Rules Engine**

---

## 📁 Project Structure

```

src/
├── app.js
├── server.js
├── routes/
│   └── sapValidation.routes.js
├── controllers/
│   └── sapValidation.controller.js
├── services/
│   ├── invoice.service.js
│   ├── po.service.js
│   ├── grn.service.js
│   ├── vendor.service.js
│   ├── entitlementProxy.service.js
│   ├── match3way.service.js
│   ├── taxValidation.service.js
│   ├── bankValidation.service.js
│   ├── compliance.service.js
│   ├── decision.service.js
│   └── reporting.service.js
├── rules/
│   ├── tolerance.rules.json
│   ├── tax.rules.json
│   ├── bank.rules.json
│   └── compliance.rules.json
├── schemas/
│   └── validation.schema.js
├── middleware/
│   ├── validator.js
│   └── errorHandler.js
└── db/
├── supabaseClient.js
├── schema.sql
└── seed.js

````

---

## 🛠️ Setup Instructions

### 1️⃣ Install Dependencies
```bash
npm install
````

---

### 2️⃣ Configure Environment Variables

Create a `.env` file:

```env
PORT=8080
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
NODE_ENV=development
```

---

### 3️⃣ Setup Database

* Open Supabase SQL Editor
* Run `src/db/schema.sql`

---

### 4️⃣ Seed Test Data

```bash
npm run seed
```

---

### 5️⃣ Start Server

```bash
npm run dev
```

Health check:

```
GET http://localhost:8080/health
```

---

## 🔗 API Endpoints

### ▶ Run Payment Validation

```
POST /sap/validation/run
```

**Request Body**

```json
{
  "invoiceId": "INV-7788",
  "poId": "PO-10091",
  "grnId": "GRN-0091",
  "vendorId": "VEND-22",
  "entitlementRef": {
    "modelId": "CPM-001",
    "entitlementId": "ENT-001"
  },
  "context": {
    "requesterUserId": "U-100",
    "approverUserId": "U-105",
    "budgetAvailable": 6000000
  }
}
```

---

### ▶ Fetch Validation Report

```
GET /sap/validation/{runId}/report
```

Returns a **full audit-ready validation report**.

---

## 🧪 Testing

Import `postman_collection.json` into Postman.

### Covered Scenarios

* Perfect match → **OKAY**
* Price mismatch → **HOLD**
* Quantity mismatch → **HOLD**
* Missing GRN → **REJECT**
* SOD violation → **REJECT**
* Budget exceeded → **HOLD**
* Invalid GST → **HOLD**
* Bank risk → **HOLD**

---

## ⚙️ Configuration (Rules Engine)

All business rules are configurable via JSON:

```
src/rules/
├── tolerance.rules.json
├── tax.rules.json
├── bank.rules.json
└── compliance.rules.json
```

No code changes required to update policies.

---

## 📊 Audit & Reporting

Each validation run stores:

* Decision
* Exception details
* Evidence
* Suggested resolution
* Routing recommendations

Designed to be:

* SOX-friendly
* Audit-ready
* Deterministic

---

## 🔄 Recent Update: Agentic AI Validation

This project now includes an agentic AI layer that:
- Runs domain-specific agents (Tax, Compliance, Risk)
- Executes asynchronously (non-blocking)
- Incrementally enriches validation reports
- Preserves deterministic validation as the source of truth


## 📌 Ideal Use Cases

* SAP / ERP payment pre-checks
* AP automation platforms
* Internal finance controls
* Vendor payment risk screening
* Agentic finance workflows

---

## 🧩 Future Enhancements

* Human-in-the-loop resolution flows
* ML-assisted anomaly scoring (optional layer)
* Vendor risk scoring engine
* Policy versioning
* Agent-to-agent orchestration



