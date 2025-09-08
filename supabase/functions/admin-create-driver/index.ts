// Deno / Supabase Edge Function
// Path: supabase/functions/admin-create-driver/index.ts
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  console.log("=== Edge Function Called ===");
  console.log("Method:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers.entries()));

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY") || "";

    console.log("Environment check:");
    console.log("- SUPABASE_URL:", SUPABASE_URL ? "✓ Set" : "✗ Missing");
    console.log("- SERVICE_KEY:", SERVICE_KEY ? "✓ Set" : "✗ Missing");
    console.log("- ANON_KEY:", ANON_KEY ? "✓ Set" : "✗ Missing");

    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error("Missing required environment variables");
      return json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
    }

    // Caller JWT (must be an admin)
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    
    console.log("Auth header check:");
    console.log("- Auth header present:", !!authHeader);
    console.log("- JWT extracted:", !!jwt);
    
    if (!jwt) {
      console.error("No JWT token found in Authorization header");
      return json({ error: "Missing Authorization Bearer token" }, 401);
    }

    // Clients
    const userClient  = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    
    console.log("Supabase clients created successfully");

    // Verify caller is admin
    console.log("Verifying user authentication...");
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    
    console.log("Auth.getUser result:");
    console.log("- Error:", userErr?.message || "None");
    console.log("- User ID:", userRes?.user?.id || "None");
    console.log("- User email:", userRes?.user?.email || "None");
    
    if (userErr || !userRes?.user) {
      console.error("Authentication failed:", userErr?.message);
      return json({ error: "Invalid or expired token" }, 401);
    }

    console.log("Checking user profile and admin role...");
    const { data: prof, error: profErr } = await userClient.from("profiles").select("role").eq("id", userRes.user.id).single();
    
    console.log("Profile check result:");
    console.log("- Error:", profErr?.message || "None");
    console.log("- Profile role:", prof?.role || "None");
    
    if (profErr) {
      console.error("Profile check failed:", profErr.message);
      return json({ error: `Profile check failed: ${profErr.message}` }, 500);
    }
    
    if (prof?.role !== "admin") {
      console.error("User is not admin. Role:", prof?.role);
      return json({ error: "Only admin may create drivers" }, 403);
    }
    
    console.log("✓ Admin verification successful");

    // Payload
    console.log("Parsing request body...");
    const body = await req.json().catch(() => ({}));
    const {
      email,
      password = cryptoRandom(), // default if not provided
      name = null,
      phone = null,
      license_number = null,
      vehicle_type = null,
      vehicle_plate = null,
      is_verified = true,
    } = body || {};

    console.log("Request payload:");
    console.log("- Email:", email);
    console.log("- Name:", name);
    console.log("- Vehicle plate:", vehicle_plate);
    
    if (!email) {
      console.error("Email is required but not provided");
      return json({ error: "email is required" }, 400);
    }

    // Try to create the user; if already exists, keep going
    console.log("Creating auth user...");
    let createdId: string | null = null;
    const createRes = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    console.log("Auth user creation result:");
    console.log("- Success:", !createRes.error);
    console.log("- Error:", createRes.error?.message || "None");
    console.log("- Created user ID:", createRes.data?.user?.id || "None");

    if (createRes.error) {
      // 422 email taken or other errors — continue and let RPC find the user by email
      // but bubble non-duplicate errors as details
      const msg = String(createRes.error.message || "");
      const duplicate = msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists");
      if (!duplicate) {
        // We still proceed, but include detail for debug
        console.warn("Non-duplicate createUser error (continuing):", msg);
      }
    } else {
      createdId = createRes.data?.user?.id ?? null;
    }

    // Attach role + driver row
    console.log("Calling admin_create_driver RPC...");
    const { data: rpcData, error: rpcErr } = await adminClient.rpc("admin_create_driver", {
      p_email: String(email).toLowerCase(),
      p_name: name,
      p_phone: phone,
      p_license: license_number,
      p_vehicle_type: vehicle_type,
      p_vehicle_plate: vehicle_plate,
      p_is_verified: is_verified,
    });
    
    console.log("RPC call result:");
    console.log("- Error:", rpcErr?.message || "None");
    console.log("- Data:", rpcData || "None");
    
    if (rpcErr) {
      console.error("admin_create_driver RPC failed:", rpcErr.message);
      // Check if it's a "function does not exist" error
      if (rpcErr.message?.includes("function") && rpcErr.message?.includes("does not exist")) {
        console.error("RPC function admin_create_driver does not exist in database");
        return json({ 
          error: "Database function 'admin_create_driver' not found. Please ensure the RPC function is created in your Supabase database.",
          details: rpcErr.message 
        }, 500);
      }
      return json({ 
        error: `admin_create_driver failed: ${rpcErr.message}`,
        details: rpcErr
      }, 500);
    }
    
    console.log("✓ Driver created successfully");

    return json({ ok: true, created_user_id: createdId }, 200);
  } catch (e: any) {
    console.error("Unhandled error in Edge Function:", e);
    console.error("Stack trace:", e.stack);
    return json({ error: e?.message || "Unhandled error" }, 500);
  }
});

function cryptoRandom() {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("");
}