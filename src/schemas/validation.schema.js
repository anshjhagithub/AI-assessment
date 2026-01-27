import { z } from "zod";

export const validationRequestSchema = z.object({
  invoiceId: z.string().min(1),
  poId: z.string().min(1),
  grnId: z.string().min(1),
  vendorId: z.string().min(1),
  entitlementRef: z.object({
    modelId: z.string(),
    entitlementId: z.string()
  }),
  context: z.object({
    requesterUserId: z.string(),
    approverUserId: z.string(),
    budgetAvailable: z.number().positive()
  })
});

export const invoiceSchema = z.object({
  invoice_id: z.string(),
  vendor_id: z.string(),
  po_id: z.string(),
  grn_id: z.string(),
  invoice_date: z.string(),
  currency: z.string().default("INR"),
  invoice_json: z.object({
    header: z.object({
      invoiceNo: z.string(),
      total: z.number()
    }),
    lineItems: z.array(
      z.object({
        lineNo: z.number(),
        material: z.string(),
        qty: z.number(),
        unitPrice: z.number(),
        hsn: z.string().optional(),
        gstRate: z.number()
      })
    ),
    taxes: z.object({
      gstAmount: z.number(),
      tdsAmount: z.number()
    })
  })
});
