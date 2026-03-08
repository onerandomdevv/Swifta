ALTER TABLE "orders" ADD CONSTRAINT "order_source_check" CHECK (
  quote_id IS NOT NULL OR 
  product_id IS NOT NULL OR 
  supplier_product_id IS NOT NULL OR 
  merchant_id IS NOT NULL OR 
  supplier_id IS NOT NULL
);
