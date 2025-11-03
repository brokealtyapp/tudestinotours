import { seedEmailTemplates } from "./emailTemplates";

async function main() {
  console.log("🚀 Starting database seed...\n");
  
  try {
    await seedEmailTemplates();
    
    console.log("\n✅ All seeds completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    process.exit(1);
  }
}

main();
