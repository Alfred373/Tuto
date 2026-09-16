-- Rename columns in Subscription table
ALTER TABLE "Subscription" RENAME COLUMN "paystackCustomerCode" TO "flutterwaveCustomerCode";
ALTER TABLE "Subscription" RENAME COLUMN "paystackSubCode" TO "flutterwaveSubCode";

-- Rename columns in Payment table
ALTER TABLE "Payment" RENAME COLUMN "paystackRef" TO "flutterwaveRef";

-- Rename indexes
ALTER INDEX "Subscription_paystackSubCode_idx" RENAME TO "Subscription_flutterwaveSubCode_idx";
ALTER INDEX "Payment_paystackRef_key" RENAME TO "Payment_flutterwaveRef_key";