
import { generatePaymentSuccessEmailHTML } from '../lib/email'; // Adjust import based on your setup

// Mock Data
const mockVoucher = {
    giftItemId: {
        name: "Coffee",
        price: 5.00,
        merchantId: {
            name: "Café Test"
        }
    },
    senderName: "Sender",
    recipientName: "Recipient",
    redemptionLink: "ABC-123",
    status: "active"
};

// Single Order Test
const singleOrder = [mockVoucher];

// Bulk Order Test
const bulkOrder = [
    mockVoucher,
    { ...mockVoucher, redemptionLink: "DEF-456" }
];

console.log("--- Single Order Email HTML Snippet ---");
const singleHtml = generatePaymentSuccessEmailHTML(singleOrder);
// Check for "From", "To" and single Amount
console.log("Has From:", singleHtml.includes("From:"));
console.log("Has To:", singleHtml.includes("To:"));
console.log("Has Amount:", singleHtml.includes("Amount:"));
console.log("Has Total Amount:", singleHtml.includes("Total Amount:"));


console.log("\n--- Bulk Order Email HTML Snippet ---");
const bulkHtml = generatePaymentSuccessEmailHTML(bulkOrder);
// Check for "Total Amount" and NO "From"/"To"
console.log("Has From:", bulkHtml.includes("From:"));
console.log("Has To:", bulkHtml.includes("To:"));
console.log("Has Amount:", bulkHtml.includes("Amount:"));
console.log("Has Total Amount:", bulkHtml.includes("Total Amount:"));
console.log("Total Amount Value:", bulkHtml.includes("€10.00"));

