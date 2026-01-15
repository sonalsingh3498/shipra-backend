require("dotenv").config();
const xlsx = require('xlsx');
const { v4: uuidv4 } = require("uuid");
const pool = require("../db/pool");

const FILE_PATH = "./products.csv.xlsx";

(async function importProducts() {
  const client = await pool.connect();
  const productsMap = new Map();

  try {
    console.log("Reading file...");
    
    // 1. Read Excel File
    const workbook = xlsx.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      console.error("❌ No data found in the Excel sheet.");
      return;
    }

    console.log("🧾 FIRST ROW DATA:", rows[0]);

    // 2. Group rows by Handle
    let lastHandle = null;
    for (const row of rows) {
      let handle = row["Handle"];
      handle = handle && String(handle).trim();

      // Shopify format: If handle is empty, it belongs to the previous product
      if (!handle && lastHandle) handle = lastHandle;
      if (!handle) continue;

      lastHandle = handle;

      if (!productsMap.has(handle)) {
        productsMap.set(handle, []);
      }
      productsMap.get(handle).push(row);
    }

    console.log(`📦 Total rows processed: ${rows.length}`);
    console.log(`🛒 Unique products grouped: ${productsMap.size}`);

    // 3. Database Transaction
    await client.query("BEGIN");

    for (const [handle, productRows] of productsMap.entries()) {
      const firstRow = productRows[0];
      const productId = uuidv4();

      // A. Insert Product
      await client.query(
        `INSERT INTO products (
          id, handle, title, body_html, vendor,
          product_category, product_type, tags,
          published, status, seo_title, seo_description, is_gift_card
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          productId,
          handle,
          firstRow["Title"],
          firstRow["Body (HTML)"],
          firstRow["Vendor"],
          firstRow["Product Category"],
          firstRow["Type"],
          firstRow["Tags"] ? firstRow["Tags"].split(",") : [],
          String(firstRow["Published"]).toUpperCase() === "TRUE",
          firstRow["Status"] || "active",
          firstRow["SEO Title"],
          firstRow["SEO Description"],
          String(firstRow["Gift Card"]).toUpperCase() === "TRUE"
        ]
      );

      // B. Insert Metafields
      await client.query(
        `INSERT INTO product_metafields (product_id, attributes) VALUES ($1, $2)`,
        [
          productId,
          {
            color: firstRow["Color (product.metafields.shopify.color-pattern)"],
            fabric: firstRow["Fabric (product.metafields.shopify.fabric)"],
            size: firstRow["Size (product.metafields.shopify.size)"],
            occasion: firstRow["Dress occasion (product.metafields.shopify.dress-occasion)"],
            sleeve_length: firstRow["Sleeve length type (product.metafields.shopify.sleeve-length-type)"],
            target_gender: firstRow["Target gender (product.metafields.shopify.target-gender)"]
          }
        ]
      );

      // C. Insert Variants
      for (const row of productRows) {
        const variantId = uuidv4();

     await client.query(
    `
    INSERT INTO product_variants (
      id, product_id, sku, barcode,
      option1_name, option1_value,
      option2_name, option2_value,
      option3_name, option3_value,
      price, compare_at_price, cost_per_item,
      inventory_qty, inventory_policy, inventory_tracker,
      requires_shipping, taxable,
      weight, weight_unit
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    ON CONFLICT (sku) DO NOTHING
    `,
    [
      variantId,
      productId,
      row["Variant SKU"],
      row["Variant Barcode"],
      row["Option1 Name"],
      row["Option1 Value"],
      row["Option2 Name"],
      row["Option2 Value"],
      row["Option3 Name"],
      row["Option3 Value"],
      row["Variant Price"],
      row["Variant Compare At Price"],
      row["Cost per item"],
      row["Variant Inventory Qty"],
      row["Variant Inventory Policy"],
      row["Variant Inventory Tracker"],
      String(row["Variant Requires Shipping"]).toUpperCase() === "TRUE",
      String(row["Variant Taxable"]).toUpperCase() === "TRUE",
      row["Variant Grams"],
      row["Variant Weight Unit"]
    ]
  );

        // D. Insert Images
        if (row["Image Src"]) {
          await client.query(
            `INSERT INTO product_images (product_id, variant_id, image_src, image_position, image_alt_text)
             VALUES ($1,$2,$3,$4,$5)`,
            [productId, variantId, row["Image Src"], row["Image Position"], row["Image Alt Text"]]
          );
        }

        // E. Insert Variant Prices (Country Specific)
        await client.query(
          `INSERT INTO variant_prices (variant_id, country_code, included, price, compare_at_price)
           VALUES ($1,'IN',$2,$3,$4), ($1,'ALL',$5,$6,$7)`,
          [
            variantId,
            String(row["Included / India"]).toUpperCase() === "TRUE",
            row["Price / India"],
            row["Compare At Price / India"],
            String(row["Included / all"]).toUpperCase() === "TRUE",
            row["Price / all"],
            row["Compare At Price / all"]
          ]
        );

        // F. Shipping Details
        await client.query(
          `INSERT INTO shipping_details (variant_id, length_cm, width_cm, height_cm)
           VALUES ($1,$2,$3,$4)`,
          [variantId, row["Length (cm)"], row["Width (cm)"], row["Height (cm)"]]
        );
      }
    }

    await client.query("COMMIT");
    console.log("✅ Excel import completed successfully!");

  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ Import failed:", error);
  } finally {
    client.release();
    process.exit();
  }
})();