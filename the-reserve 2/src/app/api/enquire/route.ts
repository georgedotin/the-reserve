// Validates enquiries server-side. Delivery is not wired yet: connect an email or CRM
// provider in `deliver()` before launch (the enquiry is only logged on the server today).

type Enquiry = {
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  timing?: string;
  message?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function deliver(enquiry: Enquiry) {
  console.info("[enquiry]", JSON.stringify({ ...enquiry, receivedAt: new Date().toISOString() }));
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const enquiry: Enquiry = {
    name: str(body.name, 200),
    email: str(body.email, 200),
    phone: str(body.phone, 40),
    interest: str(body.interest, 40),
    timing: str(body.timing, 200),
    message: str(body.message, 2000),
  };

  if (!enquiry.name) return Response.json({ ok: false, error: "Please tell us your name." }, { status: 422 });
  if (!EMAIL.test(enquiry.email)) return Response.json({ ok: false, error: "Please enter a valid email address." }, { status: 422 });
  if (body.consent !== "yes") return Response.json({ ok: false, error: "Please confirm we may contact you." }, { status: 422 });

  await deliver(enquiry);
  return Response.json({ ok: true });
}
