import { generateCafeReport } from './src/lib/pdf-report-generator';
import Merchant from './src/models/Merchant';
import { connectToDatabase } from './src/lib/mongodb';
import fs from 'fs';

async function testPdf() {
    await connectToDatabase();
    const merchant = await Merchant.findOne({});
    if (!merchant) {
        console.log("No merchant found");
        return;
    }
    console.log("Generating report for:", merchant.name);
    const result = await generateCafeReport(merchant._id.toString());
    fs.writeFileSync('test-report.pdf', result.buffer);
    console.log("Report saved to test-report.pdf");
    process.exit(0);
}

testPdf().catch(console.error);
