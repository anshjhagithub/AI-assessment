import express from 'express';
import sapValidationRoutes from './routes/sapValidation.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   FRONTEND UI
   ========================================================= */
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>SAP Payment Validation</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Inter, system-ui, -apple-system, sans-serif;
      background: #f3f4f6;
      padding: 30px;
      color: #111827;
    }
    .container {
      max-width: 1100px;
      margin: auto;
    }
    h1 {
      margin-bottom: 5px;
    }
    .subtitle {
      color: #6b7280;
      margin-bottom: 25px;
    }
    .card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.05);
    }
    .card h2 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 18px;
    }
    textarea, input {
      width: 100%;
      padding: 12px;
      font-family: monospace;
      font-size: 14px;
      border-radius: 6px;
      border: 1px solid #d1d5db;
    }
    textarea {
      height: 260px;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }
    button {
      padding: 10px 18px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .primary {
      background: #2563eb;
      color: white;
    }
    .primary:hover {
      background: #1e40af;
    }
    .secondary {
      background: #111827;
      color: white;
    }
    .secondary:hover {
      background: #000;
    }
    .muted {
      background: #e5e7eb;
      color: #111827;
    }
    pre {
      background: #020617;
      color: #e5e7eb;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    .row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }
    .label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 6px;
    }
  </style>
</head>

<body>
  <div class="container">
    <h1>SAP Payment Validation Agent</h1>
    <div class="subtitle">
      3-Way Match • Tax • Bank • Compliance • Automated Decisioning
    </div>

    <div class="row">
      <!-- REQUEST -->
      <div class="card">
        <h2>1️⃣ Validation Request</h2>
        <div class="label">Request Payload</div>
        <textarea id="payload">
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
        </textarea>

        <div class="actions">
          <button class="primary" onclick="runValidation()">
            Run Validation
          </button>
        </div>
      </div>

      <!-- RUN INFO -->
      <div class="card">
        <h2>2️⃣ Validation Run</h2>

        <div class="label">Run ID</div>
        <input id="runId" placeholder="Generated after validation" />

        <div class="actions">
          <button class="secondary" onclick="getReport()">
            Get Report
          </button>
        </div>
      </div>
    </div>

    <!-- OUTPUT -->
    <div class="card">
      <h2>3️⃣ Output</h2>
      <pre id="output">// response will appear here</pre>
    </div>
  </div>

<script>
  async function runValidation() {
    const output = document.getElementById('output');
    output.textContent = 'Running validation...';

    try {
      const payload = JSON.parse(
        document.getElementById('payload').value
      );

      const res = await fetch('/sap/validation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.runId) {
        document.getElementById('runId').value = data.runId;
      }

      output.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      output.textContent = 'Error: ' + err.message;
    }
  }

  async function getReport() {
    const runId = document.getElementById('runId').value;
    const output = document.getElementById('output');

    if (!runId) {
      output.textContent = 'Please enter or generate a runId first.';
      return;
    }

    output.textContent = 'Fetching report...';

    try {
      const res = await fetch(
        \`/sap/validation/\${runId}/report\`
      );
      const data = await res.json();
      output.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      output.textContent = 'Error: ' + err.message;
    }
  }
</script>

</body>
</html>
`);
});

/* =========================================================
   BACKEND ROUTES (UNCHANGED)
   ========================================================= */
app.use('/sap/validation', sapValidationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SAP Payment Validation' });
});

// Error handler
app.use(errorHandler);

export default app;

