import os
from pathlib import Path

# Base paths
app_utils = Path("/Users/a/Documents/Project/lms_demo/app/utils")
app_api = Path("/Users/a/Documents/Project/lms_demo/app/api")

# Function to calculate relative path
def get_relative_import(file_path: Path) -> str:
    # Count how many levels deep the file is from app/api
    rel_to_api = file_path.relative_to(app_api)
    depth = len(rel_to_api.parents) - 1  # -1 because we don't count the file itself
    
    # Build the relative path
    if depth == 0:
        return "../../utils/supabaseClient"
    else:
        return "../" * (depth + 2) + "utils/supabaseClient"

# Find all TypeScript files in app/api
ts_files = list(app_api.rglob("*.ts"))

fixed_count = 0
for ts_file in ts_files:
    correct_import = get_relative_import(ts_file)
    
    # Read file
    with open(ts_file, 'r') as f:
        content = f.read()
    
    # Check if it needs fixing
    if 'utils/supabaseClient' in content and f'from "{correct_import}"' not in content:
        # Replace any supabaseClient import with correct one
        import re
        new_content = re.sub(
            r'from\s+["\'][\.\/]*utils/supabaseClient["\']',
            f'from "{correct_import}"',
            content
        )
        
        if new_content != content:
            with open(ts_file, 'w') as f:
                f.write(new_content)
            print(f"✓ Fixed: {ts_file.relative_to(app_api)} -> {correct_import}")
            fixed_count += 1

print(f"\n✅ Fixed {fixed_count} files")
