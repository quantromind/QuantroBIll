import * as XLSX from 'xlsx';

export interface BulkParsedMenuItem {
  name: string;
  category: string;
  price: number;
  isVeg: boolean;
  shortCode: string;
  gstPercent: number;
  description: string;
  isAvailable: boolean;
}

export interface ParseExcelResult {
  items: BulkParsedMenuItem[];
  errors: string[];
  categories: string[];
}

/**
 * Generates and triggers download of a standardized Demo Excel template for bulk menu upload.
 * If includeSample is false, only header row is provided (clean demo template).
 */
export const downloadDemoMenuExcel = (includeSample: boolean = false) => {
  const headers = [
    'Dish Name',
    'Category',
    'Price (₹)',
    'Food Type (Veg / Non-Veg)',
    'Shortcode',
    'GST %',
    'Description',
    'Available (Yes/No)',
  ];

  const data: (string | number)[][] = [headers];

  if (includeSample) {
    data.push([
      'Paneer Butter Masala',
      'Main Course',
      240,
      'Veg',
      'PBM',
      5,
      'Creamy cottage cheese in rich tomato butter gravy',
      'Yes',
    ]);
    data.push([
      'Chicken Tikka',
      'Starters',
      280,
      'Non-Veg',
      'CT',
      5,
      'Charcoal grilled spiced boneless chicken',
      'Yes',
    ]);
    data.push([
      'Butter Garlic Naan',
      'Breads & Rice',
      60,
      'Veg',
      'BGN',
      5,
      'Crisp tandoori naan topped with roasted garlic & butter',
      'Yes',
    ]);
    data.push([
      'Cold Coffee with Ice Cream',
      'Beverages',
      120,
      'Veg',
      'CCI',
      5,
      'Chilled espresso blended with milk and vanilla ice cream',
      'Yes',
    ]);
    data.push([
      'Gulab Jamun (2 Pcs)',
      'Desserts',
      80,
      'Veg',
      'GJ',
      5,
      'Warm khoya dumplings soaked in cardamom sugar syrup',
      'Yes',
    ]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set optimal column widths for Excel
  worksheet['!cols'] = [
    { wch: 30 }, // Dish Name
    { wch: 18 }, // Category
    { wch: 12 }, // Price
    { wch: 24 }, // Food Type
    { wch: 14 }, // Shortcode
    { wch: 10 }, // GST %
    { wch: 45 }, // Description
    { wch: 18 }, // Available
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu Template');

  const filename = includeSample
    ? 'QuantroBill_Menu_Demo_With_Samples.xlsx'
    : 'QuantroBill_Menu_Demo_Template.xlsx';

  XLSX.writeFile(workbook, filename);
};

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file into validated menu items.
 */
export const parseMenuExcelFile = async (file: File): Promise<ParseExcelResult> => {
  const errors: string[] = [];
  const items: BulkParsedMenuItem[] = [];
  const categoriesSet = new Set<string>();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { items: [], errors: ['Excel file does not contain any sheets.'], categories: [] };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rows.length === 0) {
      return { items: [], errors: ['The uploaded file is empty.'], categories: [] };
    }

    // Locate header row by searching for keywords
    let headerRowIndex = -1;
    let nameCol = -1;
    let categoryCol = -1;
    let priceCol = -1;
    let foodTypeCol = -1;
    let shortCodeCol = -1;
    let gstCol = -1;
    let descCol = -1;
    let availCol = -1;

    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r].map((cell) => String(cell || '').trim().toLowerCase());
      const nIdx = row.findIndex((c) => c.includes('dish') || c.includes('item') || c === 'name');
      const pIdx = row.findIndex((c) => c.includes('price') || c.includes('rate') || c.includes('cost') || c.includes('amount'));

      if (nIdx !== -1 || pIdx !== -1) {
        headerRowIndex = r;
        nameCol = nIdx;
        priceCol = pIdx;
        categoryCol = row.findIndex((c) => c.includes('cat'));
        foodTypeCol = row.findIndex((c) => c.includes('veg') || c.includes('food') || c.includes('diet') || c.includes('type'));
        shortCodeCol = row.findIndex((c) => c.includes('short') || c.includes('code'));
        gstCol = row.findIndex((c) => c.includes('gst') || c.includes('tax'));
        descCol = row.findIndex((c) => c.includes('desc') || c.includes('detail'));
        availCol = row.findIndex((c) => c.includes('avail') || c.includes('status') || c.includes('stock'));
        break;
      }
    }

    // Fallback if no specific header names detected: use first row
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
      nameCol = 0;
      categoryCol = 1;
      priceCol = 2;
      foodTypeCol = 3;
      shortCodeCol = 4;
      gstCol = 5;
      descCol = 6;
      availCol = 7;
    }

    // Fallback column indexes if some headers weren't found by keyword
    if (nameCol === -1) nameCol = 0;
    if (categoryCol === -1) categoryCol = 1;
    if (priceCol === -1) priceCol = 2;
    if (foodTypeCol === -1) foodTypeCol = 3;
    if (shortCodeCol === -1) shortCodeCol = 4;
    if (gstCol === -1) gstCol = 5;
    if (descCol === -1) descCol = 6;
    if (availCol === -1) availCol = 7;

    // Process data rows
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawName = String(row[nameCol] || '').trim();
      // Skip empty or comment rows
      if (!rawName || rawName.toLowerCase() === 'dish name' || rawName.toLowerCase() === 'item name') {
        continue;
      }

      // Extract Category
      const rawCategory = categoryCol !== -1 && row[categoryCol] != null ? String(row[categoryCol]).trim() : '';
      const category = rawCategory || 'Main Course';
      categoriesSet.add(category);

      // Extract Price
      let rawPrice = priceCol !== -1 && row[priceCol] != null ? String(row[priceCol]).replace(/[^\d.]/g, '') : '0';
      let price = parseFloat(rawPrice);
      if (isNaN(price) || price < 0) price = 0;

      // Extract Food Type (Veg / Non-Veg)
      const rawVeg = foodTypeCol !== -1 && row[foodTypeCol] != null ? String(row[foodTypeCol]).toLowerCase().trim() : 'veg';
      const isVeg = !(
        rawVeg.includes('non') ||
        rawVeg.includes('egg') ||
        rawVeg.includes('chicken') ||
        rawVeg.includes('fish') ||
        rawVeg.includes('mutton') ||
        rawVeg === 'nv' ||
        rawVeg === 'n'
      );

      // Extract Shortcode
      let shortCode = shortCodeCol !== -1 && row[shortCodeCol] != null ? String(row[shortCodeCol]).trim().toUpperCase() : '';
      if (!shortCode) {
        // Auto-generate shortcode from name initials or first 3 letters
        const words = rawName.split(/\s+/).filter(Boolean);
        if (words.length >= 2) {
          shortCode = words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
        } else {
          shortCode = rawName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
        }
      }

      // Extract GST %
      let rawGst = gstCol !== -1 && row[gstCol] != null ? String(row[gstCol]).replace(/[^\d.]/g, '') : '5';
      let gstPercent = parseFloat(rawGst);
      if (isNaN(gstPercent) || gstPercent < 0) gstPercent = 5;

      // Extract Description
      const description = descCol !== -1 && row[descCol] != null ? String(row[descCol]).trim() : '';

      // Extract Availability
      const rawAvail = availCol !== -1 && row[availCol] != null ? String(row[availCol]).toLowerCase().trim() : 'yes';
      const isAvailable = !(
        rawAvail === 'no' ||
        rawAvail === 'false' ||
        rawAvail === '86' ||
        rawAvail.includes('out') ||
        rawAvail === '0'
      );

      items.push({
        name: rawName,
        category,
        price,
        isVeg,
        shortCode,
        gstPercent,
        description,
        isAvailable,
      });
    }

    if (items.length === 0) {
      errors.push('No valid dish items found in the file. Please make sure the rows contain dish names.');
    }
  } catch (err: any) {
    errors.push(`Failed to read file: ${err?.message || 'Invalid or corrupted file format.'}`);
  }

  return {
    items,
    errors,
    categories: Array.from(categoriesSet),
  };
};
