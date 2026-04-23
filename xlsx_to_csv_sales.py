#!/usr/bin/env python3

import re
import pandas as pd
from pathlib import Path
import sys

# Input directory (WSL mount)
input_dir = Path('/mnt/c/Users/Sarean/Documents/csv_inputs')

if not input_dir.exists():
    print("Error: Directory not found. Check the path.")
    sys.exit(1)

# Find all XLSX files
xlsx_files = list(input_dir.glob('*.xlsx'))
print(f"Found {len(xlsx_files)} XLSX files in {input_dir}")

new_converted = 0
already_exists = 0
skipped = 0

for file_path in xlsx_files:
    try:
        # Dynamically detect if there's a title row (common when title is merged across cells)
        temp_df = pd.read_excel(file_path, header=None, nrows=2, engine='openpyxl')
        non_na_first_row = temp_df.iloc[0].notna().sum()

        if non_na_first_row <= 5:  # Likely a merged title row (few filled cells)
            skip_rows = 1
            print(f"Detected merged title row in {file_path.name} — skipping 1 row")
        else:
            skip_rows = 0
            print(f"No title row detected in {file_path.name} — using row 0 as headers")

        # Read the actual data
        df = pd.read_excel(file_path, skiprows=skip_rows, engine='openpyxl')

        # Clean column names: strip whitespace and drop any Unnamed columns
        df.columns = df.columns.str.strip()
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]

        col_set = set(df.columns.str.strip())

        # --- BRANCH A: Radius Market Report (Market Significance / ZIP / Priority shape) ---
        if 'Market Significance' in col_set and 'ZIP' in col_set and 'Priority' in col_set:
            # Extract radius and model from filename: "Open Road Honda - 15 Mile Radius - Civic.xlsx"
            match = re.search(r'(\d+)\s*Mile\s*Radius\s*[-–]\s*(.+?)$', file_path.stem, re.IGNORECASE)
            if not match:
                print(f"Skipping {file_path.name}: Could not extract radius/model from filename")
                skipped += 1
                continue

            radius_miles = int(match.group(1))
            raw_model = match.group(2).strip()
            model_name = re.sub(r'\s*\(\d+\)\s*$', '', raw_model).strip()

            # Detect period from filename: (1) suffix = latest MTD upload (Apr), clean name = prior period (Q1)
            # Pattern: browser appends (1) when downloading a duplicate — first download = Q1, second = Apr MTD
            is_apr = bool(re.search(r'\(\d+\)\s*$', raw_model))
            if is_apr:
                period_start = '2026-04-01'
                period_end   = '2026-04-30'
                period_label = 'APR-2026'
            else:
                period_start = '2026-01-01'
                period_end   = '2026-03-31'
                period_label = 'Q1-2026'

            from datetime import date
            import_batch_id = f"batch-{date.today().isoformat()}-{period_label.lower()}"

            # Inject metadata columns — batch_local uses these for market_analysis stamping
            df['radius_miles'] = radius_miles
            df['model_name'] = model_name
            df['period_start'] = period_start
            df['period_end'] = period_end
            df['period_label'] = period_label
            df['import_batch_id'] = import_batch_id

            csv_path = input_dir / f"{file_path.stem}.csv"
            if csv_path.exists():
                print(f"Already exists: {file_path.name} → {file_path.stem}.csv")
                already_exists += 1
                continue

            df.to_csv(csv_path, index=False)
            print(f"Converted (radius report): {file_path.name} → {file_path.stem}.csv  [radius={radius_miles}mi, model={model_name}]")
            new_converted += 1
            continue

        # --- BRANCH B: Monthly Sales Report (original format) ---
        expected_start = ['Month (ISO 8601)', 'Month', 'Site Name', 'Make', 'Model']
        actual_start = list(df.columns[:5])

        if actual_start != expected_start:
            print(f"Skipping {file_path.name}: Unexpected column structure")
            print(f"   Actual first 5 columns: {actual_start}")
            print(f"   Full columns: {list(df.columns)}")
            skipped += 1
            continue

        # Check for single month (relaxed year check for Jan 2026)
        unique_months = df['Month'].dropna().unique()
        if len(unique_months) != 1:
            print(f"Skipping {file_path.name}: Multiple or no months detected (likely a range file)")
            skipped += 1
            continue

        month = str(unique_months[0]).strip()
        parts = month.split('-')
        if len(parts) != 2 or not parts[0].isdigit() or len(parts[0]) != 4 or not parts[1].isdigit():
            print(f"Skipping {file_path.name}: Invalid month format '{month}'")
            skipped += 1
            continue

        # Check for single radius
        unique_radii = df['radius'].dropna().unique()
        if len(unique_radii) != 1:
            print(f"Skipping {file_path.name}: Multiple radii detected")
            skipped += 1
            continue

        radius = int(unique_radii[0])
        if radius not in [10, 20, 30, 40, 50]:
            print(f"Skipping {file_path.name}: Unexpected radius value {radius}")
            skipped += 1
            continue

        # Create output folder
        output_folder_name = f"Ready_For_Notion_Client_{radius}_Mile_Radius"
        output_dir = input_dir / output_folder_name
        output_dir.mkdir(exist_ok=True)

        # Output CSV path
        csv_path = output_dir / f"{file_path.stem}.csv"

        # Check for duplicates
        if csv_path.exists():
            print(f"Already exists: {file_path.name} → {output_folder_name}/{file_path.stem}.csv")
            already_exists += 1
            continue

        # Save CSV
        df.to_csv(csv_path, index=False)
        print(f"Converted: {file_path.name} → {output_folder_name}/{file_path.stem}.csv")
        new_converted += 1

    except Exception as e:
        print(f"Error processing {file_path.name}: {e}")
        skipped += 1

print("\nJob complete.")
print(f"Newly converted: {new_converted}")
print(f"Already existing (skipped to avoid duplicates): {already_exists}")
print(f"Skipped (invalid/range/errors): {skipped}")
print("If anything still skips with 'Unexpected column structure', the printed actual columns will tell us exactly what's off.")
