"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const EditInvoice = FormSchema.omit({ date: true });

export async function createInvoice(formData: FormData) {
  const data = Object.fromEntries(formData.entries());

  const { customerId, amount, status } = CreateInvoice.parse(data);

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
    revalidatePath("/dashboard/invoices");
  } catch {
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  redirect("/dashboard/invoices");
}

export async function editInvoice(formData: FormData) {
  const data = Object.fromEntries(formData.entries());

  const { customerId, amount, status, id } = EditInvoice.parse(data);

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
    UPDATE invoices 
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

    revalidatePath("/dashboard/invoices");
  } catch {
    return {
      message: "Database Error: Failed to update Invoice.",
    };
  }

  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
    DELETE FROM invoices 
    WHERE id = ${id}
  `;

    revalidatePath("/dashboard/invoices");
  } catch {
    return {
      message: "Database Error: Failed to delete Invoice.",
    };
  }
}
