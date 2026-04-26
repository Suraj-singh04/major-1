import os

api_dir = 'src/app/api'
dynamic_export = "export const dynamic = 'force-dynamic';\n"
count = 0

for root, _, files in os.walk(api_dir):
    for file in files:
        if file == 'route.js':
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            if "force-dynamic" not in content:
                with open(filepath, 'w') as f:
                    f.write(dynamic_export + content)
                count += 1

print(f"Updated {count} files.")
