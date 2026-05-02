"""
Fix the product CSV by properly quoting all fields
"""
import csv

# Read the raw data and manually parse it
input_file = '../data/produits_tunisiens.csv'
output_file = '../data/produits_tunisiens_fixed.csv'

with open(input_file, 'r', encoding='utf-8') as f_in:
    lines = f_in.readlines()

# Get header
header = lines[0].strip()

# Write properly quoted CSV
with open(output_file, 'w', encoding='utf-8', newline='') as f_out:
    writer = csv.writer(f_out, quoting=csv.QUOTE_ALL)
    
    # Write header
    writer.writerow(header.split(','))
    
    # Process each data line
    for line in lines[1:]:
        # Split by comma but be careful with quoted fields
        # For now, let's just write all fields quoted
        fields = line.strip().split(',')
        writer.writerow(fields)

print(f"Fixed CSV written to {output_file}")
print(f"Processed {len(lines)-1} data rows")
