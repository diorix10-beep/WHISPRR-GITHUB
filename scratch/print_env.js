console.log("Environment variables:");
for (const k in process.env) {
  if (k.includes("SUPABASE") || k.includes("DB") || k.includes("DATABASE") || k.includes("POSTGRES") || k.includes("SECRET") || k.includes("KEY")) {
    console.log(`${k}=${process.env[k]}`);
  }
}
